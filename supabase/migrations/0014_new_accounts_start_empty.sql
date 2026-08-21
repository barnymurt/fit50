-- New accounts should land on the "Start the 50 days" splash, not
-- on day 1 of a challenge they never consciously started. The
-- original schema defaulted challenge_started_at to NOW(), which
-- meant every signup was auto-counted as having started a
-- challenge on signup day.
--
-- Change the default to NULL and explicitly insert NULL in the
-- trigger so the Start splash renders for new accounts until they
-- pick a start date.

ALTER TABLE public.profiles
  ALTER COLUMN challenge_started_at SET DEFAULT NULL;

-- Drop NOT NULL so the trigger can insert a literal NULL. Existing
-- rows are unaffected — users already in the middle of a challenge
-- keep their real start date.
ALTER TABLE public.profiles
  ALTER COLUMN challenge_started_at DROP NOT NULL;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, challenge_started_at)
  VALUES (NEW.id, NEW.email, NULL);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;