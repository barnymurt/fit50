# Cohort high-five (5/day kudos)

A cohort member can give up to five "high fives" per day to other
members of their cohort.

## User story

As a **cohort member**, I want **to give up to 5 high fives per day to
my cohort-mates**, so that **I can encourage people who are doing the
same day I am** — the cohort exists because doing it together is the
point.

## Acceptance criteria

- [ ] The CohortSection shows a "high-five" affordance with a daily
      counter (e.g. "3 of 5 sent today").
- [ ] Tapping a cohort-mate's name (or a kudos button) records a kudos
      row in `cohort_kudos`.
- [ ] The cap is enforced server-side: a sixth kudos in the same day
      returns 429 with a "save some for tomorrow" message.
- [ ] The cap is per-user-per-day, not per-recipient — I can give all
      five to one person if I want.
- [ ] Anonymous handles are used; no email / real-name is ever shown
      to other cohort members.

## UX/UI risks

- Free vs premium: high-fives are free for everyone. Don't upsell.
- Mobile: the kudos affordance must work on a phone without breaking the
  cohort arc layout.
- Cap loading: show the remaining count inline so the user knows they
  have 2 left, not just "you can't send more".
- Anonymous handles: the handle is generated at cohort-creation, must
  not collide.
- Rate-limit state: if the API returns 429, show the message and disable
  the button for the rest of the day.

## Out of scope

- Public kudos (visible to non-cohort members).
- Custom kudos messages — we keep it to a tap.
- Kudos history beyond the current day.

## Test plan

- Integration: 6th kudos in one day returns 429.
- Integration: cap is per user, not per recipient.
- Manual: confirm handles are anonymous (no email leaked).

## Shipped

- **Commit**: `e73ccb6`
- **Files**: `src/components/cohort/CohortSection.tsx`,
  `src/hooks/useCohortKudos.ts`,
  `src/app/api/cohort/kudos/route.ts`,
  `supabase/migrations/0048_cohort_kudos.sql`.