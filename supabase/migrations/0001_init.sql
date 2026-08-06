-- FIT50 Supabase schema
-- Run this in the Supabase SQL Editor (supabase.com/dashboard > SQL > New query)

-- ============================================================================
-- TABLES
-- ============================================================================

-- profiles: one row per user, holds auth metadata + premium status
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  is_premium BOOLEAN NOT NULL DEFAULT FALSE,
  premium_purchased_at TIMESTAMPTZ,
  challenge_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- tracker_progress: which habits are checked on which day
CREATE TABLE IF NOT EXISTS public.tracker_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  day INTEGER NOT NULL CHECK (day BETWEEN 1 AND 50),
  habit_id TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT TRUE,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, day, habit_id)
);

CREATE INDEX IF NOT EXISTS idx_tracker_progress_user ON public.tracker_progress(user_id);

-- streak_protections: when a streak protection was redeemed (premium only)
CREATE TABLE IF NOT EXISTS public.streak_protections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL,
  redeemed_day INTEGER NOT NULL CHECK (redeemed_day BETWEEN 1 AND 50),
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, week_start_date)
);

CREATE INDEX IF NOT EXISTS idx_streak_protections_user ON public.streak_protections(user_id);

-- newsletter_subscribers: email-only marketing list, separate from auth
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  subscribed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Anyone can subscribe, but only the service_role can read the list
CREATE POLICY "Anyone can subscribe"
  ON public.newsletter_subscribers FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracker_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streak_protections ENABLE ROW LEVEL SECURITY;

-- profiles: users can read and update their own profile
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- tracker_progress: users can read/write their own
CREATE POLICY "Users can read own tracker"
  ON public.tracker_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tracker"
  ON public.tracker_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tracker"
  ON public.tracker_progress FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tracker"
  ON public.tracker_progress FOR DELETE
  USING (auth.uid() = user_id);

-- streak_protections: users can read their own
CREATE POLICY "Users can read own protections"
  ON public.streak_protections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own protections"
  ON public.streak_protections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================================

-- When a user signs up via Supabase auth, automatically create a profile row
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- UPDATED_AT TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_profile_updated ON public.profiles;
CREATE TRIGGER on_profile_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
