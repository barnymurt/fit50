-- Macro profile -- saved inputs from the macro calculator so
-- returning users don't have to re-enter their stats. One row
-- per user; upserted on every Calculate. RLS scoped to the user.

CREATE TABLE IF NOT EXISTS public.macro_profile (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  age INTEGER NOT NULL,
  sex TEXT NOT NULL CHECK (sex IN ('male','female')),
  height_cm NUMERIC NOT NULL,
  weight_kg NUMERIC NOT NULL,
  body_fat NUMERIC,
  activity TEXT NOT NULL CHECK (activity IN ('none','light','moderate','heavy')),
  goal TEXT NOT NULL CHECK (goal IN ('loss','recomp','muscle')),
  diet TEXT NOT NULL CHECK (diet IN ('balanced','lower','higher')),
  -- calculated results, snapshotted so the UI shows what was calculated
  -- even if the formula changes in future releases
  results_kcal NUMERIC NOT NULL,
  results_protein NUMERIC NOT NULL,
  results_carbs NUMERIC NOT NULL,
  results_fat NUMERIC NOT NULL,
  results_water NUMERIC NOT NULL,
  -- bookkeeping
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.macro_profile ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own macro profile" ON public.macro_profile;
CREATE POLICY "Users can read their own macro profile"
  ON public.macro_profile FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own macro profile" ON public.macro_profile;
CREATE POLICY "Users can insert their own macro profile"
  ON public.macro_profile FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own macro profile" ON public.macro_profile;
CREATE POLICY "Users can update their own macro profile"
  ON public.macro_profile FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own macro profile" ON public.macro_profile;
CREATE POLICY "Users can delete their own macro profile"
  ON public.macro_profile FOR DELETE
  USING (auth.uid() = user_id);
