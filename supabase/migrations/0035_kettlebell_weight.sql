-- Add kettlebell weight for BMR-adjusted per-exercise kcal estimation
-- in the analytics. NULL = no KB (falls back to bodyweight MET).

ALTER TABLE public.macro_profile
  ADD COLUMN IF NOT EXISTS kettlebell_weight_kg NUMERIC;

ALTER TABLE public.macro_profile
  ADD COLUMN IF NOT EXISTS band_resistance_lbs NUMERIC;

ALTER TABLE public.macro_profile ENABLE ROW LEVEL SECURITY;

-- Existing policies already cover the user; no new policies needed.
