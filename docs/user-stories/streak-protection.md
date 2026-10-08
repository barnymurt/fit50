# Streak protection (1 free pass / week, premium)

Premium users can save one broken day per week from resetting the
streak. Each save shows as a 🍌 on the completion certificate.

## User story

As a **premium user who missed a day**, I want **to save one broken day
per week**, so that **a single slip doesn't end my 50-day streak** —
because the point of the challenge is the streak, and life happens.

## User story (secondary)

As a **streak_broken user**, I want **to see whether protection is
available and how to use it**, so that **I can decide whether to spend
my weekly pass now or save it for later**.

## Acceptance criteria

- [ ] Given I'm premium and missed a day, the streak card offers a "save"
      action when I have a pass available for the week.
- [ ] Given I use my weekly pass, the streak continues unbroken from the
      last completed day, and the pass count for that week drops to zero.
- [ ] Given my week has rolled over (Monday / Sunday — pick one in the
      spec), I get a fresh pass.
- [ ] The pass count is per-week, not global — using one pass on
      Wednesday doesn't burn the next week's pass.
- [ ] Each save records a row in `streak_protections` (one per saved
      day) so the certificate can render a 🍌 per row.

## UX/UI risks

- Free user: the upsell on the streak card points at `/upgrade`. Don't
  just hide the save button.
- Mobile: the save button is large enough to hit without zooming
  (~44px).
- Visual feedback on click: the pass count flips immediately (read from
  local v2 store), not after a Supabase round-trip.
- Error state: if the save API fails, revert the optimistic flip and
  show an inline error.
- Section tone: the streak card sits in the tracker section; respect the
  current tone, don't introduce a new colour.

## Out of scope

- Multi-pass plans. One per week only.
- Buying extra passes. Only the weekly grant.
- Showing pass history beyond the current week.

## Test plan

- Unit: `useStreakProtection` returns the right `{ available, used,
  save, loading, error }` shape per week.
- Integration: save endpoint enforces RLS — a free user can't save by
  calling the API directly.
- Manual: use a pass, confirm streak holds; let week roll over; confirm
  fresh pass.

## Shipped

- **Files**: `src/hooks/useStreakProtection.ts`,
  `supabase/migrations/0007_streak_protections_delete_policy.sql`,
  `supabase/migrations/0037_streak_protections_update_policy.sql`,
  `supabase/migrations/0038_streak_protections_per_day.sql`,
  `src/components/Tracker.tsx`.