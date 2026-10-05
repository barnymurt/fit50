-- 0046_cohorts_seed.sql
--
-- Pre-creates the next six monthly cohorts so the StartSplash
-- "Or start with a cohort" CTA has something to show, and so
-- the cohort-join-closes cron has rows to flip on the 1st of
-- each month.
--
-- Idempotent: ON CONFLICT (start_date) DO NOTHING on the
-- unique start_date constraint means re-running this is a
-- no-op. Safe to apply in a Supabase env that's already
-- running 0045.
--
-- The cohort month is computed from CURRENT_DATE inside a DO
-- block, so this migration works regardless of when it's run —
-- the cohorts it inserts are always "the 1st of the next six
-- consecutive months starting from next month, plus next month
-- itself". A 6-month-from-now run still produces 6 valid
-- 1st-of-month cohort start_dates; a 5-year-from-now run does
-- the same.

DO $$
DECLARE
  base_date  DATE := date_trunc('month', CURRENT_DATE + INTERVAL '1 month')::DATE;
  i          INT;
  cohort_dt  DATE;
  signup_dt  DATE;
  cohort_nm  TEXT;
BEGIN
  FOR i IN 0..5 LOOP
    cohort_dt := base_date + (i || ' months')::INTERVAL;
    signup_dt := cohort_dt - INTERVAL '30 days';
    cohort_nm := to_char(cohort_dt, 'FMMonth YYYY') || ' cohort';
    INSERT INTO public.cohorts (start_date, name, signups_open_at, cap)
    VALUES (cohort_dt, cohort_nm, signup_dt, 1000)
    ON CONFLICT (start_date) DO NOTHING;
  END LOOP;
END $$;
