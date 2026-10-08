-- 0049_cohort_day_before_reminder.sql
--
-- Day-before-start reminder for cohort / buddy / solo
-- challengers. Fires the morning of day-1 of their challenge.
--
-- The send flag lives in a separate log table so retries on
-- the cron don't double-mail. The (user_id, source) primary
-- key ensures the cron is at-most-once per source per user; if
-- we ever change the source enum (e.g. add a "team" cohort)
-- the user's prior solo/cohort/buddy email still counts and the
-- new one fires cleanly.

CREATE TABLE IF NOT EXISTS public.challenge_day_before_reminder (
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source      TEXT NOT NULL CHECK (source IN ('solo', 'cohort', 'buddy')),
  sent_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, source)
);

CREATE INDEX IF NOT EXISTS idx_challenge_day_before_reminder_sent_at
  ON public.challenge_day_before_reminder (sent_at);

ALTER TABLE public.challenge_day_before_reminder ENABLE ROW LEVEL SECURITY;
-- Service role only. The cron is the sole writer. The user can
-- read their own row so the cohort page can show "we sent you
-- the day-before email" but the policy here is restrictive —
-- only service role can write.
DROP POLICY IF EXISTS "Users can read own day-before reminder" ON public.challenge_day_before_reminder;
CREATE POLICY "Users can read own day-before reminder"
  ON public.challenge_day_before_reminder FOR SELECT
  USING (auth.uid() = user_id);