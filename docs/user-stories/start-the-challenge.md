# Start the challenge

A free user picks when day 1 is. Today starts the tracker immediately; a
future date schedules it.

## User story

As an **active free user**, I want **to choose when day 1 is**, so that
**I can line the challenge up with a moment that fits my life** (Monday,
a holiday, after a holiday, etc.) instead of being forced to commit the
moment I sign up.

## Acceptance criteria

- [ ] Given I'm signed in and haven't started, the StartSplash shows a
      picker with "Start today" and "Pick a different day".
- [ ] Given I tap "Start today", the tracker starts immediately and
      `challenge_started_at` is set to today.
- [ ] Given I pick a future date, the tracker does NOT start; instead a
      coral "scheduled start" card shows "X days till you start" with
      "Start now anyway" and "Change date" actions.
- [ ] Given the persisted scheduled date is today (morning of day 1), the
      card rewrites itself to "Your 50 days are ready" with a single
      "Start now" primary action.
- [ ] YYYY-MM-DD input validation. Rejects past dates, today uses the
      regular path.

## UX/UI risks

- Anonymous user must be prompted to sign in before the picker is shown.
- Mobile: the date input must use `type="date"` so the native picker
  appears.
- Empty state: if `loaded === false`, don't flash the picker; show a
  neutral splash until the profile hydrates.
- Edge case: user picks a date, refreshes, comes back. Without persistence
  the choice is lost — handled by the [scheduled-start](./scheduled-start.md)
  story.
- Coral is the only action colour. The "Start now anyway" CTA is coral.
  Nothing else on the splash is.

## Out of scope

- Persistence of the scheduled date (handled in scheduled-start.md).
- Reminders for the scheduled date (handled in
  [day-before-reminder.md](./day-before-reminder.md)).

## Test plan

- Manual: pick a date 7 days in the future, refresh, confirm it sticks.
- Manual: pick today, confirm immediate start.
- Unit: date validation accepts YYYY-MM-DD, rejects past, rejects malformed.

## Shipped

- **Commit**: `220fc72` (depends on `e6d59e1`)
- **Files**: `src/components/Tracker.tsx`, `src/hooks/useScheduledStart.ts`,
  `src/app/api/account/scheduled-start/route.ts`,
  `supabase/migrations/0050_profiles_scheduled_start_at.sql`.