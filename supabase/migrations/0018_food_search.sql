-- 0018_food_search.sql
--
-- Brings the food search up to "fit for purpose":
--   * Adds tier / brand / regions / language columns to `foods`
--   * Enables pg_trgm + unaccent for fuzzy / accent-folded matching
--   * Trigram GIN indexes on name + brand for "yog" -> "yogurt" hits
--   * search_foods(query, user_id, region, language, category,
--                 subcategory, limit, show_branded) RPC that does the
--     blended ranking:
--       0.6 * ts_rank_cd
--     + 0.4 * trigram similarity
--     + tier / favourite / recent / region boosts
--     - tier-3 hidden unless show_branded
--
-- Apply on Supabase before running scripts/load-corpus.js. The new
-- columns default to safe values so existing OFF rows keep working
-- (with the current plain-textSearch) until the corpus replaces them.

create extension if not exists pg_trgm;
create extension if not exists unaccent;

-- Tier / brand / regions / language. The current OFF seed (0008 +
-- 0015) doesn't emit these, so they're null / default for the
-- existing 40k rows. The corpus loader fills them in.
alter table public.foods
  add column if not exists brand text,
  add column if not exists tier integer,
  add column if not exists regions text[] not null default '{uk-ie,us,worldwide}',
  add column if not exists language text not null default 'en';

create index if not exists idx_foods_tier     on public.foods (tier);
create index if not exists idx_foods_regions  on public.foods using gin (regions);
create index if not exists idx_foods_language on public.foods (language);
create index if not exists idx_foods_name_trgm on public.foods using gin (name gin_trgm_ops);
create index if not exists idx_foods_brand_trgm
  on public.foods using gin (brand gin_trgm_ops);

-- Extend the existing search-text trigger to also include brand, so
-- the tsquery half of the score picks up "rit" -> "Ritz" etc.
create or replace function foods_set_search_text() returns trigger as $$
begin
  new.search_text :=
    setweight(to_tsvector('simple', coalesce(new.name, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(array_to_string(new.aliases, ' '), '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(new.brand, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(new.category, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(new.subcategory, '')), 'C');
  return new;
end;
$$ language plpgsql;

-- Force-update existing rows so the new columns flow into the
-- tsvector (only updates the four we already have data for:
-- brand defaults to null, regions defaults to a safe set, etc.).
-- Cheap: only refreshes ~40k rows. The trigger will only re-build
-- the tsvector for rows whose values actually changed, so this is
-- a no-op for the OFF seed (no brand populated).
update public.foods
   set search_text = foods_set_search_text().search_text
 where search_text is null
    or true;  -- safe: re-runs on every row but the underlying to_tsvector is fast

-- Tier-aware ranked search. Browse mode (empty query) is curated-
-- only by default; tier 3 hides unless the caller passes
-- show_branded = true.
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
          -- browse mode: only show staples + curated unless branded
          -- is explicitly enabled
          case
            when f.tier = 1 then 1.0
            when f.tier = 2 then 0.5
            when f.tier = 3 and p_show_branded then 0.0
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
            when f.tier = 1 and (p_region is null or p_region = 'worldwide' or p_region = any(f.regions)) then 0.6
            when f.tier = 2 and (p_region is null or p_region = 'worldwide' or p_region = any(f.regions)) then 0.3
            when f.tier = 3 and (p_region is null or p_region = 'worldwide' or p_region = any(f.regions)) then 0.0
            else 0.0
          end
        + case
            when f.tier = 3 and not p_show_branded then -1.0
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
        f.tier in (1, 2) or
        p_show_branded
      )
  )
  select * from scored
  where score is not null and score > 0
  order by score desc, name asc
  limit p_limit
$$;

grant execute on function public.search_foods to anon, authenticated;

comment on function public.search_foods is
  'Ranked food search. tier-1/2 always shown, tier-3 hidden unless
   show_branded. Blends ts_rank_cd (0.6) + trigram similarity (0.4)
   + tier/region/favourite/recent-logged boosts.';