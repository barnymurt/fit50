-- 0042_water_log_update_policy.sql
--
-- Adds the missing UPDATE policy on water_log. The water-log
-- upsert (.upsert(rows, { onConflict: 'user_id,date_key' }))
-- silently failed on the UPDATE branch because RLS had no UPDATE
-- policy — only SELECT, INSERT, DELETE.
--
-- Symptom the user reported: "earlier water entries are not saved
-- again". Reproduces like this:
--   1. User adds water Monday morning. INSERT succeeds (new row).
--   2. User adds water Monday afternoon. UPDATE fires (existing
--      row, same day). RLS denies UPDATE silently. Row stays at
--      morning's amount.
--   3. User closes app, comes back, sees only the morning amount.
--   The first entry looks "stuck" — they have to scroll and look
--   closely to realise later entries never persisted.
--
-- Fix: add the standard "Users can update own water log" policy
-- so the upsert's UPDATE branch lands.

DROP POLICY IF EXISTS "Users can update own water log" ON public.water_log;
CREATE POLICY "Users can update own water log"
  ON public.water_log FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
