-- Open Food Facts seed: staging table + run audit + promote helper.
--
-- The seed script writes cleaned/normalized rows into `foods_staging`
-- tagged with a `seed_run_id`. Inspect, then run the promote block
-- below to copy a successful run into the public `foods` table.
--
-- Run this migration once. The promote step is a separate command —
-- see the bottom of this file.

create table if not exists public.foods_runs (
  id uuid primary key default gen_random_uuid(),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  source_file text,
  rows_in bigint not null default 0,
  rows_out bigint not null default 0,
  status text not null default 'running'
    check (status in ('running', 'completed', 'failed')),
  note text
);

create table if not exists public.foods_staging (
  -- Same shape as `foods` minus the tsvector (trigger handles that on
  -- promote into `foods`).
  id text not null,
  name text not null,
  category text not null,
  subcategory text,
  preparation text,
  state text,
  type text not null,
  kcal real not null,
  protein real not null,
  carbs real not null,
  fat real not null,
  fiber real not null,
  serving_basis text not null default '100g',
  standard_serving_grams real,
  standard_serving_label text,
  aliases text[] not null default '{}',
  seed_run_id uuid not null references public.foods_runs(id) on delete cascade,
  source_code text,
  primary key (id, seed_run_id)
);

create index if not exists foods_staging_run_idx
  on public.foods_staging (seed_run_id);

-- Lock both tables down. Only the service role (used by the seed
-- script) writes; nobody reads from staging publicly.
alter table public.foods_staging enable row level security;
alter table public.foods_runs enable row level security;

drop policy if exists "service role manages foods_staging" on public.foods_staging;
drop policy if exists "service role manages foods_runs" on public.foods_runs;

-- No public policies: anon/authenticated can't read or write either.

------------------------------------------------------------------------
-- PROMOTE STEP — run this after the seed script reports rows_out > 0
-- and you've spot-checked the data:
--
--   select promote_foods_run('<seed_run_id>');
--
-- It upserts every row from that run into `foods`. The trigger on
-- `foods` (foods_set_search_text) populates search_text automatically.
------------------------------------------------------------------------
create or replace function public.promote_foods_run(p_run_id uuid)
returns bigint
language plpgsql
security definer
as $$
declare
  v_count bigint;
begin
  insert into public.foods (
    id, name, category, subcategory, preparation, state, type,
    kcal, protein, carbs, fat, fiber,
    serving_basis, standard_serving_grams, standard_serving_label, aliases
  )
  select
    id, name, category, subcategory, preparation, state, type,
    kcal, protein, carbs, fat, fiber,
    serving_basis, standard_serving_grams, standard_serving_label, aliases
  from public.foods_staging
  where seed_run_id = p_run_id
  on conflict (id) do update set
    name = excluded.name,
    category = excluded.category,
    subcategory = excluded.subcategory,
    preparation = excluded.preparation,
    state = excluded.state,
    type = excluded.type,
    kcal = excluded.kcal,
    protein = excluded.protein,
    carbs = excluded.carbs,
    fat = excluded.fat,
    fiber = excluded.fiber,
    serving_basis = excluded.serving_basis,
    standard_serving_grams = excluded.standard_serving_grams,
    standard_serving_label = excluded.standard_serving_label,
    aliases = excluded.aliases;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;