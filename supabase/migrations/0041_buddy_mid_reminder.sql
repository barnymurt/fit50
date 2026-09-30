-- 0041_buddy_mid_reminder.sql
--
-- Add a timestamp column to buddy_purchases so the mid-window
-- reminder (cron fires once per purchase, 3 days before expiry)
-- can be sent exactly once even though the daily cron might
-- match the same purchase for 2-3 consecutive days.
--
-- Without this column the giftee would get 2-3 reminders in the
-- days leading up to expiry (one per cron run while expires_at
-- is still inside the window). With it the cron skips rows whose
-- mid_reminder_sent_at is already set.
--
-- Idempotent: ADD COLUMN IF NOT EXISTS + DEFAULT NULL means
-- re-running this migration on an already-upgraded database is a
-- no-op.

ALTER TABLE public.buddy_purchases
  ADD COLUMN IF NOT EXISTS mid_reminder_sent_at TIMESTAMPTZ;
