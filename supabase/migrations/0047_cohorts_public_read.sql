-- 0047_cohorts_public_read.sql
--
-- Loosen the cohorts table SELECT policy so the public landing
-- pages (src/app/cohorts/page.tsx and src/app/cohorts/[id]/page.tsx)
-- can render without requiring sign-in. All the columns on cohorts
-- are marketing metadata (id, name, start_date, signups_open_at,
-- cap, created_at) — no PII, so anonymous read is fine.
--
-- RLS for INSERT/UPDATE/DELETE on cohorts stays service-role-only
-- (we only create cohorts via the cron and seed migration).
--
-- cohort_memberships is unchanged — it still gates to own OR
-- cohort-mate reads, and UPDATE/DELETE to own-row only. Public
-- share URLs expose only the cohort row, never the per-user
-- membership rows.

DROP POLICY IF EXISTS "Anyone signed in can read cohorts" ON public.cohorts;
CREATE POLICY "Anyone can read cohorts"
  ON public.cohorts FOR SELECT
  USING (true);