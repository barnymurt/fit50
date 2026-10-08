# Cohort countdown + 9-tile group log on the home page

The cohort programme is part of the home page now, not a separate
landing. Anonymous and signed-in users see a countdown to the next
cohort (always the 1st of the month) alongside the date picker / start
splash. Signed-in users who have joined a cohort but the cohort
hasn't started yet also see a 9-tile group log on the home page so
they can see how their future cohort is shaping up. Once the cohort
is running (day 1+), the home-page section hides — the cohort
experience moves to `/account`.

`/cohorts` and `/cohorts/[id]` are gone. The cohort feature is no
longer a destination — it's a slot in the home page next to the
existing "pick your date" decision.

## User story

As a **visitor to the home page**, I want **to see the next cohort's
start date, finish-line event, and a clear path to join**, so that
**the cohort programme is discoverable without a separate landing
page** — and once I've joined, the same area shows me how my cohort
is shaping up before day 1.

## Acceptance criteria

### State A — Anonymous visitor

- [ ] The cohort section renders on the home page, immediately after
      the Tracker section, in its own `<Section>` wrapper with the
      same max-width and section-tone rotation as the rest of the
      home page.
- [ ] The countdown card shows: "Next cohort starts in N days" or
      "Today", the start date (always the 1st of a month, per
      `cohort-events.ts`), the finish-line sentence from
      `finishLineSentence(startDate)`, and a single primary CTA.
- [ ] The CTA says "Sign in to join" and routes to
      `/account?next=/#cohort-on-homepage` (or similar anchor).
- [ ] The 9-tile group log does **not** render.
- [ ] The existing "Or start with a cohort" CTA inside the
      `StartSplash` is **removed** to avoid two competing CTAs for
      the same decision in the same view.
- [ ] `/cohorts` and `/cohorts/[id]` return 404. No server-rendered
      cohort landing pages exist.

### State B — Signed in, no live cohort, not joined

- [ ] The countdown card renders the same way as for anonymous
      visitors, but the CTA says "Join this cohort →" and posts to
      `POST /api/cohort/join` (see
      [join-a-cohort.md](./join-a-cohort.md)).
- [ ] The 9-tile group log does **not** render.
- [ ] On successful join, the card morphs to State C without a page
      reload (re-fetch on the
      `fit50-cohort-membership-changed` window event, which
      `useCurrentCohort` already listens for).

### State C — Signed in, joined a cohort, cohort not started yet

- [ ] The countdown card morphs into the in-cohort view: a 2-column
      header (countdown timer on the left, finish line on the right),
      identity (anonymous handle), and the "Leave cohort" / "Show my
      display name" / "High-five the cohort" affordances. This is
      effectively the existing `CohortCard` component.
- [ ] The 9-tile group log renders below the card, showing today's
      per-habit completion count for the cohort (X of Y members hit
      each habit today). This is the existing `CohortTodayPanel`
      component.
- [ ] The 50-day arc renders below the 9-tile log (existing
      `CohortArc` component).
- [ ] The whole block sits in the home-page cohort section in the
      same tone as the rest of the page.

### State D — Signed in, started a challenge (solo or cohort)

- [ ] The cohort section is hidden. The home page no longer
      references the cohort programme.
- [ ] Cohort members continue to see their full cohort experience on
      `/account` (existing `CohortSection` component, untouched).

### State E — Past cohort (left or completed)

- [ ] Same as State B: countdown card only, no 9-tile log, "Join this
      cohort" CTA (which leads to the next monthly cohort).

### Placement

- [ ] The cohort section is rendered as a sibling of `<Tracker />` in
      `src/app/page.tsx`, immediately after it. Same max-width,
      same section-tone rotation.
- [ ] On mobile, the 2-column header collapses to a single column.
- [ ] On desktop, the section aligns with the rest of the home page
      (1200px container).

## UX/UI risks

- **Anonymous vs signed-in** — the CTA is the only differentiator.
  "Sign in to join" for anonymous, "Join this cohort →" for
  signed-in not joined. The countdown text and finish-line sentence
  are identical for both. The 9-tile log only renders for cohort
  members in the brief pre-start window (State C).
- **Free vs premium** — cohorts are free. The CTA must not look like
  a paywall. Premium upsell stays in its existing slot (Tracker
  header / bottom CTA on /account), not duplicated here.
- **Mobile vs desktop** — the 2-column header collapses cleanly. The
  9-tile grid uses the same 9-col layout as the Tracker habit grid
  (so the visual is consistent across the page).
- **Empty / loading** — when the cohort fetch is in flight, the card
  shows a neutral "Loading…" state. When there are no upcoming
  cohorts (e.g. the seed migration hasn't run, or the data is
  stale), the countdown card is hidden rather than showing "0 days".
- **Error state** — if `POST /api/cohort/join` fails (network,
  already-in-a-cohort, full), the error message renders inline below
  the CTA, doesn't navigate away.
- **Edge of the data model** — the cohort is "upcoming" until its
  start_date, "active" during the 50 days, then "completed" or
  "left". The card morphs through these states. State C is the
  "upcoming" cohort a user has joined; State D is the "active" cohort
  the user is mid-way through. The 9-tile log only renders for the
  "upcoming joined" state, not the "active" state (active members
  see it on /account).
- **Design system fit** — the existing `CohortCard`, `CohortTodayPanel`,
  and `CohortArc` components are reused verbatim. No new colours,
  fonts, or shapes. Coral is the only action colour; the countdown
  highlight uses the existing coral/05 background.
- **Accessibility** — the countdown has `aria-live="polite"` so
  screen readers announce the "Today" / "N days" change when the
  page loads. The 9-tile grid is a `role="group"` with an
  `aria-label` describing "Today's habit completion by your cohort".
  The join CTA is a real button with `disabled` while in flight.

## Out of scope

- `/cohorts` and `/cohorts/[id]` are deleted. The
  [cohort-public-share.md](./cohort-public-share.md) story is now
  obsolete — the share use case is solved by the home-page card and
  the user's own social share of the page itself. (Mark that story
  as superseded; don't keep it in the catalogue as current.)
- `usePublicCohort.ts` and `usePublicCohorts.ts` are deleted if
  they're no longer imported anywhere after the page deletions.
- Cohort-to-cohort migration (joining a second cohort after
  finishing the first is allowed by RLS but not specced for this
  refactor).
- Cohort admin / CMS / moderation tools.
- Paid cohorts.

## Test plan

- **Manual — anonymous** — open the home page in an incognito
  window. Confirm the cohort countdown card renders after the
  Tracker section. Tap "Sign in to join", confirm the route lands on
  `/account`.
- **Manual — signed-in not joined** — sign in as a free user, open
  the home page, confirm the card shows "Join this cohort →". Tap,
  confirm the join succeeds and the card flips to the in-cohort view
  without a reload.
- **Manual — joined but not started** — sign in as a user who joined
  a cohort that starts in 7 days, open the home page, confirm the
  in-cohort card + 9-tile log + arc all render.
- **Manual — started** — sign in as a user mid-challenge (day 5+),
  open the home page, confirm the cohort section is hidden. Open
  `/account` and confirm the cohort experience still lives there.
- **Manual — `/cohorts` is dead** — visit `/cohorts` and
  `/cohorts/[id]` in a browser, confirm 404.
- **Manual — mobile** — repeat the above at 375px width, confirm the
  2-column header collapses and the 9-tile grid stays 9 cols.
- **Visual** — screenshot the home page in 5 states (anonymous,
  signed-in not joined, joined not started, mid-challenge, past
  cohort) and confirm the cohort section respects the design system.

## Cross-references

- [join-a-cohort.md](./join-a-cohort.md) — the join API the CTA hits.
- [cohort-high-five.md](./cohort-high-five.md) — the high-five CTA
  inside the in-cohort card.
- [cohort-finish-line-message.md](./cohort-finish-line-message.md) —
  the finish-line sentence the countdown card renders.
- [day-before-reminder.md](./day-before-reminder.md) — the cohort
  variant of the day-before email.
- [cohort-public-share.md](./cohort-public-share.md) — **superseded**
  by this story; the share use case is the home page now.
- [happy-path-anonymous.md](./happy-path-anonymous.md) — update Stage
  5 ("Cohort discovery") to point at the home-page section instead
  of `/cohorts`.
- [happy-path-free-user.md](./happy-path-free-user.md) — update
  Stage 2 to note the cohort picker is on the home page, not just
  the StartSplash / account page.