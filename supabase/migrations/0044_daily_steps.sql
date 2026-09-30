-- 0044_daily_steps.sql
--
-- Per-user, per-day step count for the additional-burn calculation
-- in the kcal balance. Only steps > 10k contribute additional
-- kcal burn above the activity baseline (the activity baseline is
-- already baked into TDEE via ACTIVITY_MULTIPLIER when the macro
-- profile is created).
--
-- One row per (user, day_key) so users can come back later and
-- revise the number — same upsert pattern as water_log.
-- UPDATE policy is included from the start since the same
-- "we added INSERT but no UPDATE" foot-gun bit streak_protections
-- (0037), daily_totals (0039), and water_log (0042).

CREATE TABLE IF NOT EXISTS public.daily_steps (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date_key TEXT NOT NULL,
  steps INTEGER NOT NULL CHECK (steps >= 0 AND steps < 100000),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, date_key)
);

CREATE INDEX IF NOT EXISTS idx_daily_steps_user_date
  ON public.daily_steps (user_id, date_key DESC);

ALTER TABLE public.daily_steps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own daily steps" ON public.daily_steps;
CREATE POLICY "Users can read their own daily steps"
  ON public.daily_steps FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own daily steps" ON public.daily_steps;
CREATE POLICY "Users can insert their own daily steps"
  ON public.daily_steps FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own daily steps" ON public.daily_steps;
CREATE POLICY "Users can update their own daily steps"
  ON public.daily_steps FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own daily steps" ON public.daily_steps;
CREATE POLICY "Users can delete their own daily steps"
  ON public.daily_steps FOR DELETE
  USING (auth.uid() = user_id);
