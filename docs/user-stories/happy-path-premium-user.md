# Happy path — premium user

A person pays €5.99 (or is granted premium via gift-code redemption)
and gets the full toolkit: streak protection, the full account
sections (Timer, Hydration, Foods, To-do, Board), drag-reorder of
sections, the day-50 certificate, and the same cohort + buddy
features a free user gets. The premium experience is depth on top of
the free experience, not a separate app.

## User story

As a **premium user**, I want **to pay once (€5.99) and unlock the full
toolkit — streak protection, all account sections, the certificate,
and drag-reorder — so that I never lose a streak to a slip, can run
the 50 days with the deeper tracker set, and have a printable
certificate at the end that I earned**, without a subscription nagging
me to renew.

## Acceptance criteria

### Stage 1 — Convert

- [ ] From the home page's SixFeatures "Solo" CTA, the user goes
      through Stripe Checkout. The webhook
      `checkout.session.completed` sets `is_premium = true` and
      `premium_purchased_at` to now (see
      [premium-unlock.md](./premium-unlock.md)).
- [ ] On `charge.refunded`, the webhook sets `is_premium = false`.
- [ ] From `/account`'s bottom "Sign up for €5.99" CTA, the user goes
      through the same flow.
- [ ] Alternative: the user is granted premium via gift-code
      redemption (see
      [happy-path-buddy-recipient.md](./happy-path-buddy-recipient.md),
      scenario B).
- [ ] After payment, navigating back to `/account` shows all the
      premium sections (Timer, Hydration, Foods, To-do, Board) without
      a manual reload. `usePremium()` is the source of truth.

### Stage 2 — Account section reorg

- [ ] The AccountNav lists: Tracker, MyMotivator, Buddy, Cohort,
      FeedYourBrain, Timer, Workouts, MacroCalc, Hydration, Foods,
      To-do, Board.
- [ ] Each section is collapsible. Premium users can drag-and-drop to
      reorder; free users see a static order.
- [ ] The Tracker header now shows the streak-protection panel
      (coral/10 border, "🛡 Streak protection" eyebrow, "1 protection
      available" or "Used. Resets in N days"). Free users see the
      upsell card in the same slot.

### Stage 3 — Day 1 to day 49

- [ ] The premium user gets the same daily tracker experience as the
      free user (chip strip, 9-cell grid, confetti, toasts) plus:
- [ ] **Timer** — workout timer for KB / band variants.
- [ ] **Hydration** — water counter; the 2.5 L goal auto-ticks the
      `wet-lips` habit on the tracker and fires a "Mmmm tasty tasty
      agua" toast.
- [ ] **Foods** — premium-gated food database (PremiumGate component),
      photo-scan (BYOK LLM), macro rollup against daily targets.
- [ ] **To-do** — capture list.
- [ ] **Board** — drag-between-columns kanban with renameable columns.
- [ ] **Streak protection** — 1 protection every 25 days, used on a
      missed day (current or past), the 🍌 appears on that day in the
      chip strip and on the certificate (see
      [streak-protection.md](./streak-protection.md)).

### Stage 4 — A missed day (premium)

- [ ] Given I miss a day, the chip turns to ink/5. The streak
      protection panel says "Used. Resets in N days" or "1 protection
      available".
- [ ] I can use the protection by either:
      (a) tapping the "Use my streak protection" button on the panel
      (acts on today, instant), or
      (b) opening the day-editor modal for a past missed day and
      tapping "Use my streak protection for day N" in the modal (acts
      on the specific past day).
- [ ] The 25-day cooldown is enforced client-side (cooldown message
      inline) and server-side (RLS-protected write).
- [ ] On successful save, the chip becomes cream with a 🍌 and the
      streak counter treats the day as complete.

### Stage 5 — Day 50 (premium)

- [ ] Given `currentDay >= 50` and `is_premium = true`, the
      certificate banner renders in coral/10 with the headline "Your
      certificate is ready.", the body "Every book, every workout,
      every zero-proof day — locked in.", and a coral CTA "View
      certificate →" pointing at `/certificate`.
- [ ] `/certificate` renders a printable certificate with per-exercise
      inventory, the date range anchored to actual progress, brand-voice
      "What now?" paths, and a 🍌 count equal to the number of
      protections used.

### Stage 6 — Post-completion (premium)

- [ ] The premium user keeps the account indefinitely. All sections
      remain visible, drag-reorder persists, the timer / hydration /
      food / board / to-do stay usable.
- [ ] The cohort arc keeps progressing (if applicable) — high-fives,
      milestones, finish-line.
- [ ] The MyMotivator keeps showing the buddy's progress if paired.
- [ ] If the user requests a refund via Stripe, the webhook flips
      `is_premium = false`. The certificate is no longer accessible;
      the upsell banner re-appears.

## UX/UI risks

- **Anonymous vs signed-in** — premium is gated behind sign-in (the
  Stripe webhook creates the account, but the buyer must be signed in
  to see the unlocked sections).
- **Free vs premium** — every premium feature is wrapped in either
  `PremiumGate` (with a feature-specific description), `isPremium ?`
  ternary, or filtered out of the layout. There is no half-state.
- **Mobile vs desktop** — the account page collapses sections cleanly
  under 640px. Drag-reorder on mobile uses the up/down arrow buttons
  (desktop uses drag). The hydration / food / board pages are
  touch-friendly.
- **Empty / loading** — every section waits on its own hook before
  rendering. No section renders empty for free users (filtered out,
  not blank).
- **Error state** — Stripe errors are inline. Webhook failures are
  logged server-side. `usePremium` falls back to false on error, so
  the user sees the free UI, not a broken premium UI.
- **Edge of data model** — section drag handles stay disabled at the
  ends of the list. Streak protection shows a countdown, not "N/A",
  during the cooldown. Certificate at day 50+ stays visible past day
  50; doesn't disappear on day 51.
- **Design system fit** — sections alternate tones. The streak
  protection panel is coral/10 on paper. The certificate banner is
  coral/10 on paper. The "Unlock premium" CTA at the bottom is on
  `tone="ink"` and is not rendered for premium users.
- **Accessibility** — drag has keyboard equivalents (up/down arrows on
  the section header). Every CTA is a real button. The streak
  protection button is disabled during save, not removed.

## Out of scope

- Subscriptions. One-time only.
- Multi-pass streak protection plans.
- Cohort admin / moderation tools (premium doesn't unlock these; we
  don't have them at all).
- A separate "premium-only" mobile app.

## Test plan

- **Manual** — pay €5.99 via Stripe test mode. Confirm `/account`
  shows all sections. Sign out, sign back in, confirm premium state
  persists (it's a profile column, not a cookie).
- **Manual** — at day 50, confirm the "View certificate →" CTA
  renders, not the "Unlock — €5.99 →" CTA. Tap, confirm
  `/certificate` loads.
- **Manual** — use a streak protection on day 10. Wait the cooldown
  (or set a 25-day future date for testing). Confirm the panel flips
  from "Used" back to "1 protection available" on day 35.
- **Manual** — issue a refund in Stripe test mode. Confirm
  `is_premium` flips to false on next webhook delivery and the
  account page hides premium sections.
- **Unit** — `usePremium` returns `{ isPremium, loaded }` and reacts
  to profile changes.

## Cross-references (per-feature stories in this journey)

- [premium-unlock.md](./premium-unlock.md) — the conversion itself.
- [streak-protection.md](./streak-protection.md) — the 25-day
  cooldown rule and the 🍌 count.
- [start-the-challenge.md](./start-the-challenge.md) — day 1.
- [scheduled-start.md](./scheduled-start.md) — future start.
- [join-a-cohort.md](./join-a-cohort.md) — joining the monthly group.
- [cohort-high-five.md](./cohort-high-five.md) — daily 5-cap kudos.
- [cohort-finish-line-message.md](./cohort-finish-line-message.md) —
  the finish-line anchor.
- [day-before-reminder.md](./day-before-reminder.md) — the morning
  before day 1.
- [happy-path-buddy-recipient.md](./happy-path-buddy-recipient.md),
  scenario B — gift-code redemption as an alternative entry.