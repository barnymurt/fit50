-- 0038_streak_protections_per_day.sql
--
-- Switch the unique constraint on streak_protections from
-- (user_id, week_start_date) — which capped each user to one
-- protection per calendar week — to (user_id, redeemed_day) so
-- each protected DAY is unique, allowing multiple protections per
-- challenge subject to the 25-day cooldown enforced client-side
-- in useStreakProtectionForDay.
--
-- Why this change: the 1-per-week model was too restrictive for
-- premium users who miss multiple days. The new model is
-- "premium: 1 protection, then wait 25 days for another" —
-- roughly 2 protections across the 50-day challenge. The
-- cooldown is computed from the most recent redemption and
-- enforced in app code; this migration just relaxes the database
-- constraint so each day can have its own row.

ALTER TABLE public.streak_protections
  DROP CONSTRAINT IF EXISTS streak_protections_user_id_week_start_date_key;

ALTER TABLE public.streak_protections
  ADD CONSTRAINT streak_protections_user_id_redeemed_day_key
  UNIQUE (user_id, redeemed_day);
