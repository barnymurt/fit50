-- 0020_portion_prefs_and_meal_bundles.sql
--
-- One-tap repeat logging / meal bundles / smart portion memory.
--
-- 1. user_food_portion_prefs: per (user, food) memory of the last
-- portion_grams the user logged. FoodDetail pre-fills the grams
-- input with this on open so the 80%-case (logging the same thing
-- again) is one tap. Updates on every successful log.
--
-- 2. meal_bundles + meal_bundle_items: a set of (food, portion)
-- pairs the user wants to log together. UI exposes "Save as meal"
-- after a multi-item log, and "Log this meal" on the next meal so
-- common combos (porridge + berries, etc.) are one tap.

create table if not exists public.user_food_portion_prefs (
  user_id uuid not null references auth.users(id) on delete cascade,
  food_id text not null,
  portion_grams numeric not null,
  last_logged_at timestamptz not null default now(),
  primary key (user_id, food_id)
);

alter table public.user_food_portion_prefs enable row level security;
drop policy if exists "user reads own portion prefs" on public.user_food_portion_prefs;
create policy "user reads own portion prefs" on public.user_food_portion_prefs
  for select using (auth.uid() = user_id);
drop policy if exists "user writes own portion prefs" on public.user_food_portion_prefs;
create policy "user writes own portion prefs" on public.user_food_portion_prefs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.meal_bundles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  last_logged_at timestamptz not null default now(),
  times_logged integer not null default 0
);
create index if not exists idx_meal_bundles_user
  on public.meal_bundles (user_id, last_logged_at desc);

alter table public.meal_bundles enable row level security;
drop policy if exists "user reads own bundles" on public.meal_bundles;
create policy "user reads own bundles" on public.meal_bundles
  for select using (auth.uid() = user_id);
drop policy if exists "user writes own bundles" on public.meal_bundles;
create policy "user writes own bundles" on public.meal_bundles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.meal_bundle_items (
  bundle_id uuid not null references public.meal_bundles(id) on delete cascade,
  food_id text not null,
  portion_grams numeric not null,
  position integer not null default 0,
  primary key (bundle_id, food_id)
);
create index if not exists idx_meal_bundle_items_bundle
  on public.meal_bundle_items (bundle_id, position);

alter table public.meal_bundle_items enable row level security;
drop policy if exists "user reads own bundle items" on public.meal_bundle_items;
create policy "user reads own bundle items" on public.meal_bundle_items
  for select using (
    exists (
      select 1 from public.meal_bundles b
      where b.id = meal_bundle_items.bundle_id
        and b.user_id = auth.uid()
    )
  );
drop policy if exists "user writes own bundle items" on public.meal_bundle_items;
create policy "user writes own bundle items" on public.meal_bundle_items
  for all using (
    exists (
      select 1 from public.meal_bundles b
      where b.id = meal_bundle_items.bundle_id
        and b.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.meal_bundles b
      where b.id = meal_bundle_items.bundle_id
        and b.user_id = auth.uid()
    )
  );