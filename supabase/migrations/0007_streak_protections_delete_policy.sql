-- Adds the missing DELETE policy on streak_protections so the
-- Tracker's "Reset all progress" action can wipe a user's
-- redeemed protections along with the rest of their daily state.
-- Was only ever missing because the table predates 0006_*.

DROP POLICY IF EXISTS "Users can delete own protections" ON public.streak_protections;
CREATE POLICY "Users can delete own protections"
  ON public.streak_protections FOR DELETE
  USING (auth.uid() = user_id);
