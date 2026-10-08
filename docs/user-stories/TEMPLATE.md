# <Feature name>

One sentence. What this is, in plain English.

## User story

As a **<user type>**, I want **<goal>**, so that **<benefit>**.

Pick one user type per story. If a feature serves more than one type, write
one story per type and link them.

User types in fit50 today:

- **Anonymous visitor** — no account. Reads the marketing site.
- **New free user** — just signed up, no payment yet.
- **Active free user** — signed up, day 1–50 of the challenge.
- **Premium user** — paid the €5.99 unlock.
- **Cohort member** — opted into the monthly group challenge.
- **Solo challenge user** — no cohort, doing it alone.
- **Returning user after a break** — closed days, streak protection candidate.
- **Streak-broken user** — failed a day, deciding whether to reset or carry on.
- **Mobile user** — primary device is a phone.
- **Account-management user** — on the `/account` page, looking at progress.
- **Buddy recipient** — the giftee in a buyer's pair purchase. Always
  ends up premium (the pair webhook grants `is_premium: true` to both
  sides at creation). Two sub-scenarios — see
  [happy-path-buddy-recipient.md](./happy-path-buddy-recipient.md).

Add new user types as you discover them.

## Acceptance criteria

Each criterion is testable. Use Given/when/then or a checkbox.

- [ ] Given `<precondition>`, when `<action>`, then `<observable outcome>`.
- [ ] `<Plain-English criterion>`.
- [ ] ...

Every criterion should map to one of:

- An automated test (unit / integration / e2e).
- A manual smoke test on the device matrix.
- A visual regression check against the design system.

## UX/UI risks

List the failure modes the design must handle before the first line of code:

- **Anonymous vs signed-in**: does the surface render for a visitor? What does
  it look like if not? Where does the CTA point?
- **Free vs premium**: is anything behind the paywall? What's the upsell?
- **Mobile vs desktop**: which components change shape? Does the layout break
  at 375px? At 1920px?
- **Empty / zero state**: what does the user see if they have no data yet?
- **Loading state**: what does it look like while the hook is fetching?
- **Error state**: what does a 4xx / 5xx look like? Is it recoverable?
- **Edge of the data model**: streak already broken, no cohort yet, expired
  buddy pair, scheduled start in the past, weight log empty, no foods
  logged today, etc.
- **Design system fit**: which Section / Heading / Button / tone is this on?
  Where does the coral action sit? Is the section tone (`paper → teal →
  lavender → ink → paper → white → ink`) respected?
- **Accessibility**: keyboard-only path, screen reader labels, focus rings on
  the coral action.

## Out of scope

Explicit. List what this slice deliberately does NOT build so the next
session doesn't try to "complete" it.

- Not building X because Y.
- Not building A because B is already covered by `<other feature>`.
- ...

## Test plan

- **Unit**: which hooks / utilities get tests. Which acceptance criteria.
- **Integration / E2E**: which flow.
- **Manual**: which device matrix. Which browser quirks (Safari iOS, Firefox).
- **Visual**: which components get a design-system snapshot.

## Shipped

- **Commit**: `<sha>` — `<message>`.
- **Date**: `YYYY-MM-DD`.
- **Files**: one-line list of the components / hooks / migrations added.

Update this section when the commit lands. The story file is the spec; the
shipped section is the receipt.