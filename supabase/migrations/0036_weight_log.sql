-- 0036_weight_log.sql
--
-- User weight measurements over time, used by the analytics
-- weight-tracking chart to compare actual body weight against the
-- weight predicted from each day's calorie deficit or surplus.
--
-- One row per (user_id, day_key) — daily granularity because
-- that's the same granularity as food_log, but a realistic
-- user-input cadence is weekly or whenever the user weighs in.
-- The primary key (user_id, day_key) means re-weighing on the
-- same day replaces the old reading; we don't accumulate dupes.
--
-- day_key matches the format used by food_log (YYYY-MM-DD) so
-- joins are painless. NUMERIC for kg with two decimals of
-- precision (sub-kg fluctuation is meaningful when comparing
-- against a projection).
--
-- RLS scoped to user_id, like every other log table in this app.

CREATE TABLE IF NOT EXISTS public.weight_log (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_key TEXT NOT NULL,
  weight_kg NUMERIC(5, 2) NOT NULL CHECK (weight_kg > 0 AND weight_kg < 500),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, day_key)
);

CREATE INDEX IF NOT EXISTS weight_log_user_day_idx
  ON public.weight_log (user_id, day_key DESC);

ALTER TABLE public.weight_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own weight log" ON public.weight_log;
CREATE POLICY "Users can read their own weight log"
  ON public.weight_log FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own weight log" ON public.weight_log;
CREATE POLICY "Users can insert their own weight log"
  ON public.weight_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own weight log" ON public.weight_log;
CREATE POLICY "Users can update their own weight log"
  ON public.weight_log FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own weight log" ON public.weight_log;
CREATE POLICY "Users can delete their own weight log"
  ON public.weight_log FOR DELETE
  USING (auth.uid() = user_id);

comment on table public.weight_log is
  'User-entered weight measurements over time, paired with food_log for the analytics weight-projection chart. PRIMARY KEY (user_id, day_key) means re-weighing replaces the prior reading.';
