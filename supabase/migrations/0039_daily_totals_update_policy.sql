-- 0039_daily_totals_update_policy.sql
--
-- Adds the missing UPDATE policy on daily_totals. The tracker
-- uses `.upsert(rows, { onConflict: 'user_id,day_number,habit_id' })`
-- which executes as INSERT for new rows and UPDATE for existing
-- rows. daily_totals only had SELECT / INSERT / DELETE policies,
-- so the UPDATE branch silently failed with
--   "new row violates row-level security policy"
-- when a user retoggled a habit (true → false or vice versa) —
-- which is the same pattern that bit streak_protections in
-- migration 0037.
--
-- Symptom: cross-device sync drift. Mobile flips a habit, the
-- UPDATE fails silently, the entry stays in `pendingSync` forever,
-- the server keeps the stale value. When the user opens desktop
-- (which reads daily_totals for the canonical history), they see
-- the original (pre-flip) state — explaining "mobile has day X
-- complete, desktop doesn't".
--
-- Fix: add the standard "Users can update own totals" policy.

DROP POLICY IF EXISTS "Users can update own daily totals" ON public.daily_totals;
CREATE POLICY "Users can update own daily totals"
  ON public.daily_totals FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
