# Happy path — anonymous visitor

A person with no FIT50 account lands on the marketing site, browses the
9 habits, optionally starts a local-only tracker or commits to a cohort,
and converts to a paid or paired account. The conversion path goes
through either Stripe Checkout (Solo) or the buddy-pair picker (Buddy
Up) — never silently into an account.

## User story

As an **anonymous visitor**, I want **to understand the 50-day challenge,
start a local-only tracker if I want to try before signing up, and
convert to a real account when I'm ready to pay or commit to a cohort**,
so that **the barrier to entry is low but the moment I commit, my
progress is real and shared with my mate or cohort** — not a sandbox I
have to repeat.

## Acceptance criteria

### Stage 1 — Land

- [ ] Given I land on `/`, the Hero renders the headline, the
      "50 days · 9 habits · 1 finished thing" eyebrow, the 9-habit Rules
      section is below the fold, and the primary CTA "Take the
      Challenge" is visible above the fold on desktop and mobile.
- [ ] "Take the Challenge" opens the fridge-checklist modal
      (`window.dispatchEvent('open-active-modal', …)`).
- [ ] "See the rules" anchors to the `#rules` section.

### Stage 2 — Browse

- [ ] The page is composed of Hero → Story → Rules → Resources →
      Workouts → Calculator → Tracker → FAQ → SixFeatures → Newsletter,
      in that order. Each section sits on a distinct tone from the
      section-tone rotation.
- [ ] The Calculator section is functional without an account: a visitor
      can enter age/sex/height/weight/activity/goal and see the daily
      calorie and macro target breakdown without being routed to
      `/account`.

### Stage 3 — Try the tracker locally

- [ ] Scrolling to the Tracker section shows the StartSplash with two
      primary actions: "Start today" and "Pick a different day".
- [ ] "Start today" begins the 50-day countdown using localStorage.
      Progress lives on this device only. The splash copy explicitly
      says "Starting as a guest. Your progress is saved on this device."
- [ ] "Pick a different day" opens a date picker. Today starts the
      challenge immediately; a future date without an account routes
      through `/account?next=…&scheduled=YYYY-MM-DD` so the choice can
      persist on a profile (see
      [scheduled-start.md](./scheduled-start.md)).
- [ ] The StartSplash also shows an "Or start with a cohort" block
      with a countdown ("Next cohort starts in N days / Today") and a
      "Join this cohort →" button. Clicking it while anonymous routes
      through sign-in.

### Stage 4 — Convert

- [ ] Scrolling to SixFeatures shows the "€5.99 = 1 Caneca" hero, the
      six features grid, and two CTAs: "Solo" (€5.99) and "Buddy Up"
      (€9.99).
- [ ] "Solo" → POST `/api/stripe/checkout` → Stripe Checkout. On
      `checkout.session.completed`, the webhook creates the account
      and sets `is_premium = true` (see
      [premium-unlock.md](./premium-unlock.md)).
- [ ] "Buddy Up" → opens the BuddyPurchasePicker in `pair` mode. The
      visitor fills in their name + email and the buddy's name + email.
      POST `/api/buddy/purchase` with `mode: 'pair'` kicks off a
      Stripe Checkout. On success, the buyer and buddy accounts are
      created and paired (see
      [happy-path-buddy-recipient.md](./happy-path-buddy-recipient.md)
      for the buddy's side of the flow).
- [ ] The Newsletter section accepts an email and POSTs to
      `/api/newsletter/subscribe`. No account required.

### Stage 5 — Cohort discovery

- [ ] The public cohort landing `/cohorts` is reachable from the home
      page (via the share card) and is fully indexable. It lists the
      next 3–6 upcoming cohorts with start date, finish-line event, and
      a "Join this cohort" CTA. The CTA routes an anonymous visitor
      through sign-in (see
      [cohort-public-share.md](./cohort-public-share.md) and
      [join-a-cohort.md](./join-a-cohort.md)).
- [ ] Each cohort has a `/cohorts/[id]` share page with a hero, the
      finish-line coral block, the day-1 callout, and a join CTA. OG
      tags render a shareable preview.

## UX/UI risks

- **Anonymous vs signed-in** — the splash copy is explicit ("Starting
  as a guest") so the visitor doesn't expect sync. The cohort and
  future-date paths route through `/account` so we don't promise
  persistence we can't deliver.
- **Free vs premium** — every CTA on the home page ultimately lands in
  either a sign-up or a Stripe Checkout. There is no in-between "save
  my progress" step the visitor can get stuck on.
- **Mobile vs desktop** — Hero CTA, splash picker, and the
  SixFeatures CTAs are all reachable on a 375px viewport. The Hero's
  decorative "50" scales with `clamp(14rem, 26vw, 22rem)`.
- **Empty / loading** — first paint of the splash before
  `useScheduledStart` loads doesn't flash the picker; it shows neutral
  copy until hydration.
- **Error state** — Stripe Checkout errors return a message that's
  shown inline on the SixFeatures card; the page doesn't navigate
  away silently.
- **Edge of data model** — the cohort countdown only renders if
  `upcomingCohorts.length > 0`; if no cohorts are currently open, the
  "Or start with a cohort" block is hidden, not broken.
- **Design system fit** — Hero is on `tone="paper"`, SixFeatures is on
  teal. The Coral CTA lives in one place per view.
- **Accessibility** — Hero CTAs are real buttons (the modal trigger) or
  anchor links (the rules jump). No fake divs. The splash picker's
  `type="date"` input uses the native mobile picker.

## Out of scope

- Anything on `/account` — anonymous never sees the account page
  except the sign-in form.
- MyMotivator, certificate, premium features (streak protection,
  hydration, food log, board, timer).
- Cohort membership — anonymous can browse and intent to join, but
  the actual `buddy_pairs` / `cohorts` row is created after sign-in.

## Test plan

- **Manual** — visit `/` on a fresh incognito window. Tap "Take the
  Challenge" (modal opens). Scroll to tracker, tap "Start today"
  (local day counter appears). Pick a future date (redirects to
  /account). Tap "Solo" (Stripe opens). Tap "Buddy Up" (form renders,
  both emails required).
- **Manual** — visit `/cohorts` anonymously. Confirm a future cohort
  shows with start date and finish-line event.
- **Visual** — at 375px and 1920px, confirm Hero CTAs are not cut off
  and SixFeatures grid stacks correctly.
- **Unit** — StartSplash date validation rejects past dates and
  malformed strings; cohort fetch only fires if `upcomingCohorts`
  is empty.

## Cross-references (per-feature stories in this journey)

- [start-the-challenge.md](./start-the-challenge.md) — "Start today" /
  "Pick a different day" behaviour.
- [scheduled-start.md](./scheduled-start.md) — future-date persistence
  on `/account?next=…&scheduled=…`.
- [join-a-cohort.md](./join-a-cohort.md) — the join API the splash
  CTA hits.
- [cohort-public-share.md](./cohort-public-share.md) — `/cohorts` and
  `/cohorts/[id]` share pages.
- [cohort-finish-line-message.md](./cohort-finish-line-message.md) —
  the finish-line event that makes a cohort pick meaningful.
- [premium-unlock.md](./premium-unlock.md) — the Solo CTA's destination.
- [happy-path-buddy-recipient.md](./happy-path-buddy-recipient.md) —
  the Buddy Up CTA's destination for the buddy's account.