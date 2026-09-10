-- 0030_meal_bundle_position.sql
--
-- Add a position column to meal_bundles so users can reorder their
-- saved bundles manually. Default 0 = "use last_logged_at desc" as
-- the implicit order; lower position values sort first when set.
--
-- The 4x4 bundle tile grid lets users drag (or arrow) a tile to
-- top to bring it into their current week's rotation. Without this
-- column, ordering is fixed by last_logged_at which only updates
-- when the bundle is actually logged.

alter table public.meal_bundles
  add column if not exists position integer not null default 0;

create index if not exists idx_meal_bundles_user_order
  on public.meal_bundles (user_id, position asc, last_logged_at desc);

-- Refresh existing rows so the index is actually ordered. New
-- bundles get the default of 0 which sorts last in the manual
-- ordering (top of the implicit last_logged_at desc); the first
-- reorder sets it to a small negative number to put it at the top.
update public.meal_bundles
  set position = 0
  where position is null;