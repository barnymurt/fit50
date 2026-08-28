-- Capture the user's local timezone at signup (and refresh on every
-- sign-in) so the email dispatcher can land outreach emails between
-- 12:30 and 13:30 local time, not UTC. See docs/email-testing.md and
-- src/email/BRAND_VOICE.md for the send-window rule.
--
-- Format: IANA tz database name, e.g. 'Europe/Dublin' or
-- 'America/New_York'. Captured client-side via
-- `Intl.DateTimeFormat().resolvedOptions().timeZone` and persisted on
-- signup + every sign-in (so the value follows the user when they
-- travel).
--
-- Nullable so the column can be added to existing rows without
-- backfilling. New users get a value on first sign-in.

alter table public.profiles
  add column if not exists timezone text;

comment on column public.profiles.timezone is
  'IANA tz database name (e.g. Europe/Dublin). Captured at sign-in
   so outreach emails land in the user''s lunchtime window.';