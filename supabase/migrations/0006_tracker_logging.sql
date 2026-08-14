-- Tracker daily state: in-progress taps for the current local-tz day.
-- Lives ~24h, then flushed to daily_totals by the rollover handler.
-- RLS: per-user SELECT/INSERT/UPDATE/DELETE.

CREATE TABLE IF NOT EXISTS public.daily_state (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date_key TEXT NOT NULL,
  habit_id TEXT NOT NULL,
  tapped BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, date_key, habit_id)
);

CREATE INDEX IF NOT EXISTS idx_daily_state_user_date
  ON public.daily_state (user_id, date_key);

ALTER TABLE public.daily_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own daily state" ON public.daily_state;
CREATE POLICY "Users can read their own daily state"
  ON public.daily_state FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own daily state" ON public.daily_state;
CREATE POLICY "Users can insert their own daily state"
  ON public.daily_state FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own daily state" ON public.daily_state;
CREATE POLICY "Users can update their own daily state"
  ON public.daily_state FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own daily state" ON public.daily_state;
CREATE POLICY "Users can delete their own daily state"
  ON public.daily_state FOR DELETE
  USING (auth.uid() = user_id);


-- Tracker daily totals: immutable archive written at midnight rollover.
-- One row per (user, day_number, habit).
-- RLS: per-user SELECT/INSERT/UPDATE/DELETE.

CREATE TABLE IF NOT EXISTS public.daily_totals (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL CHECK (day_number BETWEEN 1 AND 50),
  habit_id TEXT NOT NULL,
  completed BOOLEAN NOT NULL,
  archived_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, day_number, habit_id)
);

CREATE INDEX IF NOT EXISTS idx_daily_totals_user_day
  ON public.daily_totals (user_id, day_number);

ALTER TABLE public.daily_totals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own daily totals" ON public.daily_totals;
CREATE POLICY "Users can read their own daily totals"
  ON public.daily_totals FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own daily totals" ON public.daily_totals;
CREATE POLICY "Users can insert their own daily totals"
  ON public.daily_totals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own daily totals" ON public.daily_totals;
CREATE POLICY "Users can delete their own daily totals"
  ON public.daily_totals FOR DELETE
  USING (auth.uid() = user_id);


-- Water log: per-user, per local-tz day, ml amount. Cross-device mirror
-- of what was previously localStorage-only.
-- RLS: per-user SELECT/INSERT/UPDATE/DELETE.

CREATE TABLE IF NOT EXISTS public.water_log (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date_key TEXT NOT NULL,
  amount_ml INTEGER NOT NULL DEFAULT 0 CHECK (amount_ml >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, date_key)
);

ALTER TABLE public.water_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own water log" ON public.water_log;
CREATE POLICY "Users can read their own water log"
  ON public.water_log FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own water log" ON public.water_log;
CREATE POLICY "Users can insert their own water log"
  ON public.water_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own water log" ON public.water_log;
CREATE POLICY "Users can update their own water log"
  ON public.water_log FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own water log" ON public.water_log;
CREATE POLICY "Users can delete their own water log"
  ON public.water_log FOR DELETE
  USING (auth.uid() = user_id);
