-- 0050_profiles_scheduled_start_at.sql
--
-- Persist the user's chosen future start date on profiles so
-- the "X days till you start" panel survives a refresh. This is
-- distinct from challenge_started_at, which is the actual day
-- they committed. The StartSplash writes here on a future pick
-- and clears the field on the morning they actually start.
--
-- RLS: profile updates already gate on auth.uid() = id, so the
-- user can only touch their own row. This column adds no new
-- permission surface.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS scheduled_start_at DATE;

-- Helpful for the cohort-milestones / day-before-reminder crons
-- if they ever want to query the union of "users who plan to
-- start on date X". Cheap btree on a low-cardinality column is
-- fine; we'll skip the index until we hit scale.
