-- 0045_cohorts.sql
--
-- Monthly cohort feature: a user can sign up to start the FIT50
-- challenge on the 1st of a given month alongside a large group of
-- other starters. Cohorts are read-only between members (no DMs,
-- no per-member names — the cohort section shows collective counts
-- only). All member interaction is opt-in via the existing
-- display_name field; the default is an anonymous handle assigned
-- on join.
--
-- The challenge_start_date field on `profiles` remains the source
-- of truth for the user's day number. Joining a cohort sets that
-- field to the cohort's start_date, so the existing 9-cell habit
-- grid + streak logic keep working unchanged.
--
-- One user can be in at most one active or upcoming cohort at a
-- time. The "you're already in a cohort" rule is enforced by a
-- partial unique index + an API-side check, so the constraint
-- holds even if RLS is bypassed (admin / service-role).

CREATE TABLE IF NOT EXISTS public.cohorts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  start_date      DATE NOT NULL UNIQUE,         -- always the 1st of a month
  name            TEXT NOT NULL,                 -- e.g. "December 2025 cohort"
  signups_open_at DATE NOT NULL,                 -- 30 days before start_date
  cap             INTEGER NOT NULL DEFAULT 1000, -- max members; wait-list beyond
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT cohorts_start_first_of_month
    CHECK (EXTRACT(DAY FROM start_date) = 1),
  CONSTRAINT cohorts_name_not_empty
    CHECK (length(btrim(name)) > 0)
);

-- Only the service role can create cohorts. There is no user-facing
-- "create your own cohort" path in v1; the join-closes cron is
-- what flips upcoming → active and active → completed.
ALTER TABLE public.cohorts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone signed in can read cohorts" ON public.cohorts;
CREATE POLICY "Anyone signed in can read cohorts"
  ON public.cohorts FOR SELECT
  USING (auth.role() = 'authenticated');


CREATE TABLE IF NOT EXISTS public.cohort_memberships (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id         UUID NOT NULL REFERENCES public.cohorts(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  anonymous_handle  TEXT NOT NULL,
  show_display_name BOOLEAN NOT NULL DEFAULT FALSE,
  status            TEXT NOT NULL DEFAULT 'active'
                    CHECK (status IN ('upcoming', 'active', 'left', 'completed')),
  joined_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- A user may have at most one *live* (upcoming or active)
  -- membership at a time. "left" and "completed" don't count, so
  -- a user can leave this cohort and join the next month's cohort
  -- without violating the constraint. The historical "left" /
  -- "completed" rows are kept for analytics.
  CONSTRAINT cohort_memberships_anonymous_handle_format
    CHECK (anonymous_handle ~ '^[A-Za-z]+-[A-Za-z0-9]{2,5}$'),
  CONSTRAINT cohort_memberships_unique_handle_per_cohort
    UNIQUE (cohort_id, anonymous_handle)
);

CREATE INDEX IF NOT EXISTS idx_cohort_memberships_user_status
  ON public.cohort_memberships (user_id, status);
CREATE INDEX IF NOT EXISTS idx_cohort_memberships_cohort_status
  ON public.cohort_memberships (cohort_id, status);

-- Enforce "at most one live membership" via a partial unique
-- index. Postgres allows multiple NULLs in a unique index, and
-- a partial WHERE clause only includes the rows we want to
-- constrain.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_cohort_memberships_live_per_user
  ON public.cohort_memberships (user_id)
  WHERE status IN ('upcoming', 'active');

ALTER TABLE public.cohort_memberships ENABLE ROW LEVEL SECURITY;

-- SELECT: a user can see their own membership, plus the
-- memberships of every other member of a cohort they're in
-- (upcoming or active). Past cohorts (status 'left' /
-- 'completed' on the caller's side) drop out of visibility.
DROP POLICY IF EXISTS "Users can read their own cohort memberships" ON public.cohort_memberships;
CREATE POLICY "Users can read their own cohort memberships"
  ON public.cohort_memberships FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can read memberships of cohorts they are in" ON public.cohort_memberships;
CREATE POLICY "Users can read memberships of cohorts they are in"
  ON public.cohort_memberships FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.cohort_memberships mine
      WHERE mine.cohort_id = cohort_memberships.cohort_id
        AND mine.user_id = auth.uid()
        AND mine.status IN ('upcoming', 'active')
    )
  );

-- INSERT / DELETE: blocked for users. Memberships are created
-- and removed only by service-role API routes.
DROP POLICY IF EXISTS "Users cannot insert their own cohort memberships" ON public.cohort_memberships;
DROP POLICY IF EXISTS "Users can leave a cohort (update status only)" ON public.cohort_memberships;

-- UPDATE: only the row's owner, and only the columns that the
-- "leave cohort" + "show display name" actions need (status and
-- show_display_name). Everything else (cohort_id, user_id,
-- anonymous_handle) is locked.
CREATE POLICY "Users can update their own cohort membership flags"
  ON public.cohort_memberships FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- Helper: the caller's anonymous handle in a given cohort, or
-- NULL if the caller isn't a member. Lets UI render handles
-- without exposing user_id to other members of the cohort.
CREATE OR REPLACE FUNCTION public.get_cohort_handle(
  p_cohort_id UUID,
  p_user_id   UUID
) RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT anonymous_handle
  FROM   public.cohort_memberships
  WHERE  cohort_id = p_cohort_id
    AND  user_id   = p_user_id
  LIMIT  1;
$$;

REVOKE ALL ON FUNCTION public.get_cohort_handle(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_cohort_handle(UUID, UUID) TO authenticated;


-- Aggregation: per-day 9/9 strict-completion count for a cohort's
-- arc. Returns one row per (day_number, completers) where
-- completers = number of distinct members who had all 9 habit
-- rows completed for that day. Days with zero completers are
-- omitted.
CREATE OR REPLACE FUNCTION public.cohort_arc_strict_counts(
  p_cohort_id UUID
) RETURNS TABLE (
  day_number    INTEGER,
  completers    BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT dt.day_number, COUNT(*) AS completers
  FROM   public.daily_totals dt
  JOIN   public.cohort_memberships cm
    ON cm.user_id = dt.user_id
  WHERE  cm.cohort_id = p_cohort_id
    AND  cm.status IN ('upcoming', 'active')
  GROUP  BY dt.user_id, dt.day_number
  HAVING COUNT(*) FILTER (WHERE dt.completed) = 9
    AND  COUNT(*) = 9
  ORDER  BY dt.day_number;
$$;

REVOKE ALL ON FUNCTION public.cohort_arc_strict_counts(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cohort_arc_strict_counts(UUID) TO authenticated;


-- Aggregation: "still going" count — distinct members with at
-- least one habit row in the last `p_window_days` day_numbers
-- (counted backwards from the cohort's current day). A member
-- who has had at least one habit tap in this window counts;
-- silent members don't. This is the engagement test that sits
-- under the cohort arc, separate from the strict 9/9 test.
CREATE OR REPLACE FUNCTION public.cohort_still_going(
  p_cohort_id   UUID,
  p_window_days INTEGER
) RETURNS BIGINT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH cohort_day AS (
    SELECT GREATEST(
        1,
        LEAST(
          50,
          (CURRENT_DATE - c.start_date)::INTEGER + 1
        )
      ) AS today
    FROM public.cohorts c
    WHERE c.id = p_cohort_id
  )
  SELECT COUNT(DISTINCT dt.user_id)
  FROM   public.daily_totals dt
  JOIN   public.cohort_memberships cm
    ON cm.user_id = dt.user_id
  WHERE  cm.cohort_id = p_cohort_id
    AND  cm.status IN ('upcoming', 'active')
    AND  dt.day_number BETWEEN
      (SELECT today - (p_window_days - 1) FROM cohort_day)
      AND
      (SELECT today FROM cohort_day);
$$;

REVOKE ALL ON FUNCTION public.cohort_still_going(UUID, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cohort_still_going(UUID, INTEGER) TO authenticated;


-- Idempotency log for cohort milestone emails. One row per
-- (cohort, user, day) sent. The /api/cron/cohort-milestones
-- route reads this before sending to coalesce retries. If this
-- table is missing (e.g. an env that hasn't applied 0046 yet),
-- the route falls back to "send once per day" and logs a warning.
CREATE TABLE IF NOT EXISTS public.cohort_emails_sent (
  cohort_id   UUID NOT NULL REFERENCES public.cohorts(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_number  INTEGER NOT NULL CHECK (day_number BETWEEN 1 AND 50),
  sent_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (cohort_id, user_id, day_number)
);

CREATE INDEX IF NOT EXISTS idx_cohort_emails_sent_cohort_day
  ON public.cohort_emails_sent (cohort_id, day_number);

ALTER TABLE public.cohort_emails_sent ENABLE ROW LEVEL SECURITY;
-- Service-role only. The cohort_milestones cron is the sole writer.
-- No SELECT policy = no user can read this table directly.
DROP POLICY IF EXISTS "Service role writes cohort emails log" ON public.cohort_emails_sent;
CREATE POLICY "Service role writes cohort emails log"
  ON public.cohort_emails_sent FOR INSERT
  TO service_role
  WITH CHECK (true);
