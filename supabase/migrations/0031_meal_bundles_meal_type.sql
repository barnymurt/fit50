-- 0031_meal_bundles_meal_type.sql
--
-- Add a meal type column to meal_bundles so each saved bundle
-- carries a single meal slot (breakfast / lunch / dinner / snack).
-- The colour the tile wears on the dashboard is keyed off this
-- value — cream for breakfast, coral for lunch, lavender for dinner,
-- teal for snack — so each meal type gets its own visual identity.
--
-- The column is nullable. Bundles created before this migration
-- don't have a meal type and render with the neutral accent; new
-- bundles infer the meal from the picked food-log entries at save
-- time (the most common non-null meal among them), with the user
-- able to override via the bundle editor.

alter table public.meal_bundles
  add column if not exists meal text;

-- The meal type is one of these four strings. We don't enforce it
-- at the DB level so future meal types (e.g. "late_snack") can
-- roll out without another migration. The app layer constrains the
-- input via the MEAL_OPTIONS select.
