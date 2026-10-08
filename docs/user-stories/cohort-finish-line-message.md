# Cohort finish-line anchor message

The user sees a concrete finish date and the cultural event near it, so
"when do I finish?" has a real answer from day one.

## User story

As a **cohort member (or someone picking a cohort)**, I want **to see
the exact date I finish and what's happening in the world around that
day**, so that **the finish line is concrete, not abstract** — "you
finish on Dec 24 — Christmas Eve" hits different from "you finish in 50
days".

## Acceptance criteria

- [ ] Given a cohort start date, the finish-line sentence is computed
      as `start + 50 days` and matched against `cohort-events.ts`.
- [ ] The sentence appears in four places: `/cohorts` landing,
      `/cohorts/[id]` share card, CohortSection finish-line card, and
      the StartSplash cohort pick.
- [ ] Region-aware only for the December cohort (Dec 1 → MLK Day in the
      US, Dry Jan end elsewhere).
- [ ] 12 hand-curated events cover the upcoming 12 months.

## UX/UI risks

- Mobile: the finish-line card collapses cleanly under 640px.
- Empty state: a future month with no curated event must still show the
  finish date, just without the event name.
- Tone: the finish-line block is coral on the cohort card, paper on the
  public landing — match the surrounding tone, don't introduce new
  colours.
- Copy: the sentence must be human, not a date format. "Friday, 20
  December 2025" not "2025-12-20".

## Out of scope

- User-customised events.
- Multi-region beyond the December exception.
- Holiday calendars beyond the 12 we curate.

## Test plan

- Unit: `finishLineSentence(start, region)` returns the right event
  per month per region.
- Visual: render the cohort card on the four surfaces, confirm the
  sentence matches across them.

## Shipped

- **Commit**: `269a236`
- **Files**: `src/lib/cohort-events.ts`, `src/app/cohorts/page.tsx`,
  `src/app/cohorts/[id]/page.tsx`,
  `src/components/cohort/CohortSection.tsx`,
  `src/components/Tracker.tsx`.