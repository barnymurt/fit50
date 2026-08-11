-- Food log — per-user, per-day entries the user has actually eaten.
-- RLS: a user can only read/insert/update/delete their own rows.

CREATE TABLE IF NOT EXISTS public.food_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  food_id TEXT NOT NULL,
  name TEXT NOT NULL,
  grams NUMERIC NOT NULL CHECK (grams > 0),
  kcal NUMERIC NOT NULL CHECK (kcal >= 0),
  protein NUMERIC NOT NULL CHECK (protein >= 0),
  carbs NUMERIC NOT NULL CHECK (carbs >= 0),
  fat NUMERIC NOT NULL CHECK (fat >= 0),
  fiber NUMERIC NOT NULL DEFAULT 0 CHECK (fiber >= 0),
  meal TEXT CHECK (meal IS NULL OR meal IN ('breakfast','lunch','dinner','snack')),
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  day_key TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_food_log_user_day
  ON public.food_log (user_id, day_key);

CREATE INDEX IF NOT EXISTS idx_food_log_user_logged_at
  ON public.food_log (user_id, logged_at DESC);

ALTER TABLE public.food_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own food log" ON public.food_log;
CREATE POLICY "Users can read their own food log"
  ON public.food_log FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own food log" ON public.food_log;
CREATE POLICY "Users can insert their own food log"
  ON public.food_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own food log" ON public.food_log;
CREATE POLICY "Users can delete their own food log"
  ON public.food_log FOR DELETE
  USING (auth.uid() = user_id);
