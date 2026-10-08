# Happy path — free user

A person signs up with email + password, starts the 50-day challenge
(possibly via a cohort), ticks the 9 daily habits, sees their streak
and (if they bought or were gifted a buddy) their pair's progress, and
hits the certificate upsell at day 50. The free experience is
deliberately complete enough to finish the challenge without paying;
premium is a depth-of-experience upsell, not a paywall.

## User story

As a **free user** (new or active, solo or in a cohort), I want **to
sign up, start the 50 days, tap the 9 habits every day, see my streak,
and finish the challenge**, so that **I can prove the 50 days works
before I decide whether to pay for the deeper toolkit** (streak
protection, hydration, food log, board).

## Acceptance criteria

### Stage 1 — Sign up

- [ ] Given I land on `/account` while signed out, I see the auth
      card with three modes: "Sign in", "Create account", and "Reset
      password" (toggleable).
- [ ] "Create account" requires email + password (min 8 chars). On
      success I'm signed in and the account nav appears.
- [ ] A signed-in user can also sign in with a passkey (Face ID /
      Touch ID / Windows Hello) via the existing flow.
- [ ] I can stay signed in for 7 days by leaving "Remember me" checked.

### Stage 2 — Pick a cohort or go solo

- [ ] On `/account`, the Cohort section is visible (cohorts are
      free + premium). If I haven't joined one, the CohortJoinCard
      shows the next cohort with a "Join this cohort" CTA.
- [ ] Tapping "Join this cohort" POSTs to `/api/cohort/join` and
      `challenge_started_at` is set to the cohort's start date. The
      CohortSection replaces the join card (see
      [join-a-cohort.md](./join-a-cohort.md)).
- [ ] Alternatively, from the Tracker StartSplash, I can "Start
      today" (immediate, localStorage + sync) or "Pick a different
      day" (see [start-the-challenge.md](./start-the-challenge.md) and
      [scheduled-start.md](./scheduled-start.md)).
- [ ] The day-before-start reminder cron emails me the morning before
      day 1 in either the solo or cohort template (see
      [day-before-reminder.md](./day-before-reminder.md)).

### Stage 3 — Day 1 to day 49

- [ ] The Tracker section shows: "Day N of 50 · <date>" eyebrow, the
      "X days in a row" headline with "best: Y days in a row", the
      50-day chip strip, and the 9-cell habit grid.
- [ ] Tapping a habit flips it from cream/20 to teal with paper text
      and fires a small confetti. The 9th tap of the day fires a
      bigger confetti.
- [ ] The 50-day chip strip shows: today in coral, completed days in
      coral/15, past-incomplete days in ink/5, future days locked.
      Clicking a past day opens the backfill modal.
- [ ] Free users see the coral "🍌 Streak protection — Unlock the full
      toolkit" upsell card in the Tracker header, replacing the streak
      protection panel.
- [ ] Free users see "Reset all progress" as a quiet link. Tapping it
      opens a destructive confirm.
- [ ] The MyMotivator section shows the buddy's 9-cell grid if I'm
      paired (see
      [happy-path-buddy-recipient.md](./happy-path-buddy-recipient.md)).
- [ ] If I'm in a cohort, the CohortSection shows the finish-line card
      and the day-by-day high-five button (5/day cap, see
      [cohort-high-five.md](./cohort-high-five.md) and
      [cohort-finish-line-message.md](./cohort-finish-line-message.md)).
- [ ] Premium-only sections (Timer, Hydration, Foods, To-do, Board)
      are filtered out of the AccountNav and not rendered.
- [ ] Below the collapsible sections, the "Unlock premium" CTA in the
      ink-tone section lists the 6 features and a "Sign up for €5.99"
      link to `/upgrade` (which currently redirects to `/#sign-up`,
      see Known gaps below).

### Stage 4 — A missed day

- [ ] Given I miss a day, the chip turns to ink/5 and the streak
      counter resets to 0.
- [ ] The "🍌 Streak protection" upsell card stays visible but the
      action is the €5.99 unlock, not a "Use my protection" button
      (free users don't have a protection).
- [ ] I can backfill a missed day by clicking its chip in the strip
      and ticking the habits I actually did. Backfill doesn't count
      against the streak calc for the missing day.

### Stage 5 — Day 50

- [ ] Given `currentDay >= 50`, the certificate banner renders above
      the day counter. The free user sees: ink-tone, paper text, the
      headline "Claim your certificate.", the body "Premium finishers
      get a printable certificate with every stat. €5.99, yours
      forever.", and a coral CTA "Unlock — €5.99 →" pointing at
      `/upgrade`.
- [ ] Tapping the CTA → `/upgrade` → which currently redirects to
      `/#sign-up` (the SixFeatures section). **This is a known gap**
      — see "Known gaps" below.

### Stage 6 — Post-completion (free)

- [ ] The free user can keep their account active indefinitely. The
      tracker keeps counting, the chip strip keeps responding, the
      cohort arc keeps progressing (if applicable).
- [ ] The free user can upgrade to premium at any time to claim the
      certificate (and unlock the deeper toolkit). The upgrade flow
      is `/upgrade` → Stripe Checkout → webhook → `is_premium = true`.
- [ ] The free user can `signOut` from the account page. Progress is
      kept on the server (it's already in `daily_totals`); the
      password reset flow uses Resend email.

## UX/UI risks

- **Anonymous vs signed-in** — the sign-up form is the only entry. No
  "continue as guest" path leads to a stuck state; the splash's
  "Starting as a guest" is the closest thing, and it doesn't pretend
  to sync.
- **Free vs premium** — every premium feature on the home page (the 6
  features) is gated by `is_premium`. The free user sees the upsell
  consistently in three places: the Tracker header card, the bottom
  "Unlock premium" CTA, and the day-50 certificate banner. The
  certificate upsell is the highest-intent moment.
- **Mobile vs desktop** — the account page collapses section titles
  cleanly under 640px. The 9-cell habit grid is 3 cols on mobile, 9
  on desktop.
- **Empty / loading** — `useTrackerState().loaded` gates the splash
  to a "Loading…" neutral state. Hydration race for first-time users
  is handled by the `useScheduledStart` hook.
- **Error state** — sign-in errors show inline with a hint if
  available. Stripe Checkout errors show inline. The cohort-join
  error shows inline below the join button.
- **Edge of data model** — past-incomplete days are clickable to
  backfill. Future days are locked. Protected days show 🍌. Days
  where `completedCount === 0` show the day number, not a check.
- **Design system fit** — sections alternate tones. The free upsell
  card is coral on cream/20. The "Unlock premium" bottom CTA sits on
  `tone="ink"` to make the upgrade feel like a real destination.
- **Accessibility** — every CTA is a real button. The reset confirm
  uses a `role="alert"` for the destructive confirmation. Chip
  buttons have explicit `aria-label`s describing the day, date, and
  completion.

## Out of scope

- Streak protection (premium only — see
  [streak-protection.md](./streak-protection.md)).
- The full macro / hydration / food / board / timer toolkit (premium
  only).
- Drag-reorder of account sections (premium only).

## Known gaps

- **`/upgrade` is currently a one-line redirect** to `/#sign-up`. The
  intent is a dedicated upgrade page (see
  [premium-unlock.md](./premium-unlock.md)). Until that lands, the
  free user's day-50 upsell CTA goes through the home page, which is
  a slight detour. Not a blocker, but flagged for the next pass.

## Test plan

- **Manual** — sign up as a new user, start a challenge, tap 9
  habits, confirm the day counter increments. Sign out, sign back in,
  confirm the day is preserved on the server.
- **Manual** — sign up, join a cohort, confirm the CohortSection
  replaces the CohortJoinCard.
- **Manual** — as a free user, miss a day, confirm the chip turns
  ink/5 and the streak resets. Confirm the upsell card stays.
- **Manual** — at day 50, confirm the certificate banner shows the
  "Unlock — €5.99 →" CTA, not the "View certificate →" CTA.
- **Unit** — sign-in / sign-up error messages round-trip from the
  Supabase auth response.

## Cross-references (per-feature stories in this journey)

- [start-the-challenge.md](./start-the-challenge.md) — the day-1
  commitment.
- [scheduled-start.md](./scheduled-start.md) — future-date choice
  that survives refresh.
- [join-a-cohort.md](./join-a-cohort.md) — joining the monthly group.
- [cohort-high-five.md](./cohort-high-five.md) — the daily 5-cap kudos.
- [cohort-finish-line-message.md](./cohort-finish-line-message.md) —
  the finish-line anchor in the CohortSection.
- [day-before-reminder.md](./day-before-reminder.md) — the morning
  before day 1.
- [streak-protection.md](./streak-protection.md) — what free users
  don't have, and what they're upsold on.
- [premium-unlock.md](./premium-unlock.md) — the day-50 conversion
  path.