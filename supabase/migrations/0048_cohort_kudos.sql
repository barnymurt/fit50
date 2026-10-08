-- 0048_cohort_kudos.sql
--
-- "High-five the cohort" — a daily collective kudos counter per
-- cohort member. The cap is 5 per day (resets at local-midnight)
-- and the target is the whole cohort, not an individual — no per-
-- member targeting, no per-member recipient. The display on the
-- cohort section is the SUM across the cohort, so users see
-- something like "37 of 80 high-fived today" — the same collective
-- number shape as every other cohort stat, not a personal feed.
--
-- Storage: per-membership, two columns.
--   kudos_today       — int 0..5, count sent in the current local day
--   kudos_today_date  — date of the last reset, so we know when to
--                        reset back to 0 (a member's counter is
--                        strictly per local day; no day-over-day
--                        rollover of a stale count)
--
-- The API route resets the counter to 0 in the same UPDATE that
-- increments it when kudos_today_date != current_date, so the cap
-- is enforced without a separate cron.
--
-- RLS unchanged from migration 0045: cohorts are world-readable
-- for shareable landing pages, but cohort_memberships remains
-- scoped to the row's owner and cohort-mates only. UPDATE on
-- cohort_memberships (the kudos increment) stays locked to the
-- row's own user — the API route uses the service role to
-- enforce that.

ALTER TABLE public.cohort_memberships
  ADD COLUMN IF NOT EXISTS kudos_today      INTEGER NOT NULL DEFAULT 0
    CHECK (kudos_today >= 0 AND kudos_today <= 5);
ALTER TABLE public.cohort_memberships
  ADD COLUMN IF NOT EXISTS kudos_today_date DATE;

CREATE INDEX IF NOT EXISTS idx_cohort_memberships_kudos
  ON public.cohort_memberships (cohort_id, kudos_today_date);
