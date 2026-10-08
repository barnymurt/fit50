# Scheduled future start (survives refresh)

The user's chosen future start date persists on their profile so closing
the tab doesn't wipe the choice.

## User story

As an **active free user**, I want **my future start date to survive a
refresh**, so that **I don't have to re-pick the date every time I come
back to the app**.

## Acceptance criteria

- [ ] Given I picked a future date yesterday, when I open the app today,
      the StartSplash still shows "X days till you start" with the same
      date and finish-line message.
- [ ] Given I signed out and back in on another device, the same
      scheduled date is shown.
- [ ] `POST /api/account/scheduled-start` validates YYYY-MM-DD, rejects
      past dates and today, and returns the date on success.
- [ ] `DELETE /api/account/scheduled-start` clears the field and re-opens
      the picker on next mount.
- [ ] Migration `0050_profiles_scheduled_start_at.sql` adds the nullable
      DATE column to `public.profiles`. RLS unchanged.

## UX/UI risks

- The "X days till you start" card must render immediately on mount
  (read from the profile, not from local state), so the user doesn't
  see the picker for one frame and then the scheduled card.
- A local-override path means a just-picked future date reflects in the
  splash immediately while the server round-trip runs in the background.
- Day-1 morning: if `scheduled_start_at` is today, the splash rewrites
  itself to "Your 50 days are ready" with "Start now" as the primary
  action.
- If the API errors (network, 401), show an inline error, keep the
  picker's chosen value, do not clear local state.

## Out of scope

- The actual challenge start (handled by [start-the-challenge](./start-the-challenge.md)).
- The cron reminder (handled by
  [day-before-reminder](./day-before-reminder.md)).

## Test plan

- Manual: pick a date, force-refresh, confirm date persists.
- Manual: clear site data, sign in, confirm picker appears (not the
  scheduled card).
- Unit: `useScheduledStart` returns `{ scheduled, loaded, set, clear,
  refresh }` with the right loading semantics.
- Integration: `POST /api/account/scheduled-start` with a malformed
  date returns 400.

## Shipped

- **Commit**: `220fc72`
- **Files**: `src/hooks/useScheduledStart.ts`,
  `src/app/api/account/scheduled-start/route.ts`,
  `supabase/migrations/0050_profiles_scheduled_start_at.sql`,
  `src/components/Tracker.tsx`, `src/lib/supabase.ts`.