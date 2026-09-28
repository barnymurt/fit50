-- 0032_meal_bundles_backfill_meal.sql
--
-- Backfill the meal column for bundles that existed before
-- migration 0031. Migration 0031 added `meal` as nullable, so
-- all pre-existing rows have meal = null and render with the
-- neutral accent on the bundle grid.
--
-- Inference is name-based — we grep the bundle name for the four
-- meal keywords. Most users name their bundles by meal type
-- (e.g. "Porridge + berries" → breakfast, "Chicken salad" →
-- lunch). Bundles whose name doesn't match a keyword default to
-- 'lunch' — the user can override via the bundle editor if it
-- doesn't fit.
--
-- This is a one-shot data fix. New bundles go through the app's
-- inference logic, which uses the picked items' meal slots at
-- save time (most common non-null meal among them).

update public.meal_bundles
set meal = case
  when name ~* 'breakfast|morning|brunch' then 'breakfast'
  when name ~* 'dinner|evening|supper' then 'dinner'
  when name ~* 'snack' then 'snack'
  when name ~* 'lunch' then 'lunch'
  else 'lunch'
end
where meal is null;
