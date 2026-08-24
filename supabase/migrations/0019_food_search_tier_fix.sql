-- 0019_food_search_tier_fix.sql
--
-- Treat NULL tier rows as curated (tier 2) so the existing 40k
-- OFF seed rows show up by default. The corpus loader assigns
-- real tier values (1 / 2 / 3) to its 42k rows, so this fix is
-- only relevant for the pre-corpus state of the foods table.
--
-- Also: the "Show branded products" toggle is now reflected in
-- the filter so tier-1 / tier-2 always show, tier-3 hides unless
-- the user opts in.

create or replace function public.search_foods(
  p_query text,
  p_user_id uuid default null,
  p_region text default null,
  p_language text default 'en',
  p_category text default null,
  p_subcategory text default null,
  p_limit integer default 30,
  p_show_branded boolean default false
)
returns table (
  id text,
  name text,
  category text,
  subcategory text,
  kcal real,
  protein real,
  carbs real,
  fat real,
  fiber real,
  serving_basis text,
  standard_serving_label text,
  aliases text[],
  brand text,
  regions text[],
  language text,
  tier integer,
  score real
)
language sql stable
as $$
  with q as (
    select
      websearch_to_tsquery('simple', coalesce(p_query, '')) as tsq,
      lower(unaccent(coalesce(p_query, ''))) as q_norm
  ),
  faves as (
    select food_id from public.food_favorites where user_id = p_user_id
  ),
  recents as (
    select distinct food_id, max(logged_at) as last_logged
      from public.food_log
     where user_id = p_user_id
       and logged_at > now() - interval '30 days'
     group by food_id
  ),
  scored as (
    select
      f.id, f.name, f.category, f.subcategory, f.kcal, f.protein, f.carbs,
      f.fat, f.fiber, f.serving_basis, f.standard_serving_label, f.aliases,
      f.brand, f.regions, f.language, f.tier,
      case
        when p_query is null or p_query = '' then
          case
            when coalesce(f.tier, 2) = 1 then 1.0
            when coalesce(f.tier, 2) = 2 then 0.5
            when coalesce(f.tier, 2) = 3 and p_show_branded then 0.0
            else null
          end
        else
          0.6 * coalesce(ts_rank_cd(f.search_text, q.tsq), 0.0)
        + 0.4 * similarity(unaccent(lower(f.name)), q.q_norm)
        + case when f.id in (select food_id from faves) then 1.5 else 0.0 end
        + case
            when (select last_logged from recents where food_id = f.id)
                 is not null
            then 1.0 * greatest(0, 1 - extract(epoch from (now() - (select last_logged from recents where food_id = f.id))) / (30 * 86400))
            else 0.0
          end
        + case
            when coalesce(f.tier, 2) = 1 and (p_region is null or p_region = 'worldwide' or p_region = any(f.regions)) then 0.6
            when coalesce(f.tier, 2) = 2 and (p_region is null or p_region = 'worldwide' or p_region = any(f.regions)) then 0.3
            when coalesce(f.tier, 2) = 3 and (p_region is null or p_region = 'worldwide' or p_region = any(f.regions)) then 0.0
            else 0.0
          end
        + case
            when coalesce(f.tier, 2) = 3 and not p_show_branded then -1.0
            else 0.0
          end
      end as score
    from public.foods f, q
    where
      (
        p_query is null or p_query = '' or
        f.search_text @@ q.tsq or
        similarity(unaccent(lower(f.name)), q.q_norm) > 0.2
      )
      and (p_category is null or f.category = p_category)
      and (p_subcategory is null or f.subcategory = p_subcategory)
      and (
        p_query is null or p_query = '' or
        coalesce(f.tier, 2) in (1, 2) or
        p_show_branded
      )
  )
  select * from scored
  where score is not null and score > 0
  order by score desc, name asc
  limit p_limit
$$;

grant execute on function public.search_foods to anon, authenticated;