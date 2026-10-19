# Debug `?date=` query param for the homepage cohort preview

A temporary, browser-only, opt-in date override that lets the developer
see the homepage cohort block ("countdown to next cohort") as it
would render against any chosen calendar date — without touching the
system clock, Chrome's Sensors panel, or the database.

> **Temporary.** This is a developer affordance for the cohort-preview
> problem; not a user feature. It is auto-disabled outside
> `process.env.NODE_ENV !== 'production'` so production visitors can
> never see or trigger it. When the cohort-preview work is done this
> param comes back out.

## User story

As an **account-management user** building cohort features, I want
**to open the homepage with `?date=2026-11-01` and see the cohort
countdown card render against that date instead of today**, so
that **I can verify the Nov 1 cohort looks right without waiting
for the calendar date to roll over or fiddling with system clocks**.

## Acceptance criteria

- [ ] Visiting `https://fit50challenge.io/?date=2026-11-01` as an
      anonymous visitor causes the cohort countdown card on the
      homepage to render against 2026-11-01 instead of today
      (2026-10-19).
- [ ] The card renders the same Nov 1 state it would on the actual
      Nov 1: eyebrow `NEXT COHORT STARTS TODAY`, numeral `Today`,
      start line `Starts Sunday, 1 November`, finish-line
      sentence `… (in 50 days) — Christmas Eve. …`.
- [ ] The same override also works for signed-in non-started users
      viewing the homepage cohort block.
- [ ] Visiting the same URL **without** `?date=` (or with an invalid
      date string like `?date=garbage`) causes the card to render
      against real today, unchanged.
- [ ] The override is **scoped to the homepage cohort block**. The
      rest of the page (Tracker, FAQ, footer) and `/account` continue
      to render against real time. The `?date=` param does not
      affect day-number, streak, or macro math anywhere.
- [ ] On a Vercel production deployment
      (`process.env.VERCEL_ENV === 'production'`), the override is
      a no-op — the URL is parsed, but the override is never applied
      to render. Visiting `?date=2026-11-01` on production produces
      the same render as visiting `/`. On Preview, Development, and
      local dev the override applies as described above.

## UX/UI risks

- **Anonymous vs signed-in.** The override applies to all viewers
  of the homepage cohort block. Anonymous visitors can also preview
  it (their countdown card is the same component) — that's fine.
- **Free vs premium.** N/A — cohorts are free.
- **Mobile vs desktop.** Same component on both.
- **Empty / loading.** The override doesn't change load order.
  Same null-return behavior when no cohort is available.
- **Error state.** Invalid `?date=` falls back to real today; no
  error UI needed.
- **Edge of the data model.** If `?date=` is set to a date in the
  past or far future, the cohort query still returns whatever the
  server has — i.e. today's eligible cohorts. The user might see
  "Next cohort starts in -30 days" or "Next cohort starts in 365
  days". Not a bug; just a visual reminder that the cohort set
  is real and the override only changes "today", not the seed.
- **Design system fit.** No new colours, fonts, or shapes. The
  override is invisible to the user — same render path.
- **Accessibility.** No new interactive element. No impact.
- **Privacy / security.** URL params are not logged. Production
  guards ensure the override can never affect what real visitors
  see.

## Out of scope

- **A persistent / localStorage-based date override.** This story
  is the lightest possible solution; persistent override would be
  a larger feature with its own UX.
- **An admin panel or `/account` debug surface.** Query param is
  the only entry point.
- **Affected components other than `CohortHomepageSection`.**
  `/account`'s `<CohortSection />` is unchanged — if you want to
  preview it under a fake date, that's a separate story.
- **The `useAvailableCohorts` server-side filter.** The cohort set
  is still whatever the server returns for *real* today. Only the
  client-side render of "now" is shifted. This means: if you set
  `?date=2027-01-01` the card might show a negative `daysAway`
  for cohorts that already passed — expected, not a bug.

## Test plan

- **Manual:** visit `/`, expect the regular card with today's
  counts (signed out, Oct 19).
- **Manual:** visit `/?date=2026-11-01`, expect the Nov 1 card
  rendering as if it were Nov 1.
- **Manual:** visit `/?date=garbage`, expect the regular card.
- **Manual:** visit `/?date=2026-11-01` on `/account` (logged in
  as the seeded test user). The homepage cohort block is hidden
  (you've started); the URL param still parses but applies to
  nothing rendered.
- **Visual:** none needed — same component, same render path.
- **Production guard:** verify by `NEXT_PUBLIC_BUILD_TARGET=prod`
  or in Vercel preview deploy that the param has no effect.

## Implementation notes (for the next session)

- **Single-file change.** `src/components/cohort/CohortHomepageSection.tsx`
  reads the param once at render time (via `useSearchParams`) and
  passes the override `Date` to a `useNow()` helper.
- **Re-use `dates.ts`.** The existing `dateKeyLocal(date: Date =
  new Date())` and `dayIndexFromStart(... now: Date = new Date())`
  helpers already accept an injected "now". Inject the override.
- **Production guard.** Wrap the override-read in
  `process.env.NODE_ENV !== 'production'` so the code is dormant
  in prod. Not a security control — it's just a precaution.
- **Reversibility.** The override path lives behind a single
  function. To remove: delete the helper and the four lines that
  read the param. No DB, no migrations, no schema.

## Cross-references

- [cohort-countdown-on-homepage.md](./cohort-countdown-on-homepage.md)
  — the surface this debug param targets.
- [preview-cohort-as-of-nov-1.md](../preview-cohort-as-of-nov-1.md) —
  the documentation that lists all the alternative preview
  methods, including this one.
