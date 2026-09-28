-- 0037_streak_protections_update_policy.sql
--
-- Adds the missing UPDATE policy on streak_protections so the
-- upsert in useStreakProtectionForDay() can succeed when a row
-- already exists for the (user_id, week_start_date) pair.
--
-- Why it's missing:
-- The upsert path in useTrackerState calls
--   .upsert({ user_id, week_start_date, redeemed_day },
--           { onConflict: 'user_id,week_start_date' })
-- which Supabase executes as INSERT on conflict-insert and UPDATE
-- on conflict-update. RLS only had SELECT/INSERT/DELETE policies,
-- so the UPDATE branch silently failed with
--   "new row violates row-level security policy"
-- and the user's redemption flow returned a vague "unknown error".
--
-- Two scenarios that hit this:
--   1. User clicks the button twice (one INSERT succeeds, the
--      second tries UPDATE on the existing row → blocked).
--   2. User had a redemption queued from a previous session/load —
--      any second redemption would UPDATE the existing row → blocked.
--
-- Fix: add the standard "Users can update their own protections"
-- policy. Matches the existing pattern used by every other table.

DROP POLICY IF EXISTS "Users can update own protections" ON public.streak_protections;
CREATE POLICY "Users can update own protections"
  ON public.streak_protections FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
