# Happy path — buddy recipient

A person whose mate bought them a seat in the 50-day challenge. They
receive an email with a token link, set a password, and end up with a
**premium** account paired with the buyer. The pair purchase webhook
creates both the buyer and the buddy as `is_premium: true` from the
moment of payment — the "free account" path that earlier code
suggested was deprecated; today every buddy ends up premium.

## Two scenarios

The codebase has two activation paths that converge on the same
outcome (premium, paired):

- **Scenario A — Standard pair (primary):** buyer paid €9.99 for the
  pair. Both the buyer and the buddy are created by the webhook with
  `is_premium: true` and `activation_status: 'pending_activation'`.
  Both receive an email with a token link to set their password.
  Buddy has 14 days to activate.
- **Scenario B — Gift-code redemption (secondary):** buyer's 14-day
  window expired. The seat was converted to a gift code emailed to
  the buyer. Buddy redeems the code at `/redeem` (a public page) and
  gets a premium account.

---

## Scenario A — Standard pair

### A.0 — Pre-purchase (buyer)

- [ ] The buyer is on the home page or the account page, fills in
      BuddyPurchasePicker with their name + email and the buddy's
      name + email (plus an optional personal note).
- [ ] The picker validates: emails are valid, names are non-empty,
      purchaser_email ≠ buddy_email, and the buddy's email is NOT
      already a FIT50 user (otherwise the API returns
      409 with "That email is already a FIT50 user").
- [ ] On submit, `POST /api/buddy/purchase` with `mode: 'pair'`
      creates a Stripe Checkout session: 2 line items of €5.99 each
      minus a €1.99 `FIT50-BUDDY-PAIR` coupon = €9.99 total.
- [ ] The Stripe metadata carries `purchaser_email`, `purchaser_name`,
      `buddy_email`, `buddy_name`, `personal_note`, and (if signed in)
      `purchaser_existing_user_id`.

### A.1 — Webhook creates the buyer (if anonymous)

- [ ] On `checkout.session.completed`, the Stripe webhook handler
      checks `meta.purchaser_existing_user_id`.
- [ ] If the buyer was anonymous at checkout, the webhook creates the
      buyer via `admin.createUser` with `email_confirm: true` and
      metadata `display_name`, `created_by_buddy_purchase: true`.
- [ ] The buyer's profile is upserted with `is_premium: true`,
      `premium_purchased_at: now`, `activation_status: 'pending_activation'`,
      an `activation_token`, and `activation_expires_at: now + 14 days`.
- [ ] If the buyer was signed in, the webhook ensures the profile
      exists and calls `setPremium(..., true, ...)` (skipped if
      `purchaser_was_premium` was already true via the loyalty path).
- [ ] The buyer receives a "Your buddy pair is live — set your
      password" email with an activation link of the shape
      `https://fit50challenge.io/activate/buddy/<token>`.

### A.2 — Webhook creates the buddy (always, in the new path)

- [ ] The webhook creates the buddy via `admin.createUser` with the
      buddy's email + display_name and `created_by_buddy_purchase: true`.
- [ ] The buddy's profile is upserted with **the same `is_premium:
      true`** and `activation_status: 'pending_activation'`, an
      `activation_token`, and `activation_expires_at: now + 14 days`.
- [ ] The buddy receives a "buddy-invite" email (the
      `renderBuddyInviteEmail` template) with their own activation
      link. The link carries the personal note and the buyer's name.
- [ ] **The pair rows in `buddy_pairs` are NOT created yet.** The
      webhook waits for the buddy to activate so the giftee's
      `challenge_started_at` is set before they appear in the
      buyer's MyMotivator.

### A.3 — Both activate (buyer + buddy)

- [ ] Each side follows their respective activation link to
      `/activate/buddy/[token]`. The page renders a "Set a password"
      form. Both must set a password (min 8 chars, confirm matches).
- [ ] On submit, `POST /api/buddy/activate` validates the token,
      checks `activation_status = 'pending_activation'`, and rejects
      expired tokens.
- [ ] On success, the API sets the password via
      `admin.updateUserById`, sets `activation_status = 'active'`,
      nulls the activation token.
- [ ] **Only the buddy's activation creates the pair rows.** Two
      `buddy_pairs` rows are inserted: one `(buyer, buddy, hidden_at=null)`
      and one `(buddy, buyer, hidden_at=null)`. Each side can hide
      independently.
- [ ] The `buddy_purchases` row is marked `status: 'activated'`.
- [ ] The API returns a magic link. The client follows it so the
      activated user is signed in immediately, landing on
      `/account?activated=1`.
- [ ] Fallback: if `SUPABASE_SERVICE_ROLE_KEY` is missing, the API
      returns 503 with `needs_service_role: true`. The client flips
      into "Send me a sign-in link" mode and uses the OTP path
      (`/api/buddy/activate/otp`) to complete activation.

### A.4 — Pair relationship (RLS)

- [ ] Both sides are now `is_premium: true` and `activation_status:
      'active'`. They each have their own account, paired.
- [ ] `buddy_pairs` has two rows. The RLS policy on `daily_totals`
      (`user_id IN (SELECT target_id FROM public.get_buddy_pair_ids())`)
      lets each side read the other's daily totals.
- [ ] MyMotivator on each side shows the other's name, current day,
      streak, and 9-cell grid.
- [ ] Each side can hide the pair by setting `hidden_at` on their own
      row; the other side still sees the pair until they hide too.

### A.5 — Start the 50 days

- [ ] Each side lands on `/account?activated=1`. The StartSplash (or
      the running tracker if the other side already started) renders.
- [ ] Each side taps "Start today" or "Pick a different day" — their
      own `challenge_started_at` is set independently. The system
      does NOT auto-align their start dates; pair members can start on
      the same day or on different days.
- [ ] The day-before-start reminder cron emails each side in the
      "buddy" template the morning before day 1 (see
      [day-before-reminder.md](./day-before-reminder.md)).

### A.6 — Daily use

- [ ] Both sides get the full **premium** experience (see
      [happy-path-premium-user.md](./happy-path-premium-user.md)) — all
      sections visible, drag-reorder, streak protection, hydration,
      food log, board, timer.
- [ ] Plus the pair relationship: each side sees the other's progress
      on MyMotivator.
- [ ] If both also joined the same cohort, the cohort arc + high-fives
      add another layer (cohort is a separate opt-in).

### A.7 — Day 50

- [ ] Both sides are premium, so the day-50 certificate banner points
      at `/certificate` and the real certificate unlocks at day 50.

### A.8 — Pair window expiry (14 days)

- [ ] The buddy has 14 days from purchase to activate. After 14 days
      the Vercel Cron `buddy-expiry` runs and:
- [ ] Creates a `gift_codes` row with a `FIT50-XXXX-XXXX` code.
- [ ] Deletes the buddy's pending profile + auth user (GDPR: no
      consent was given yet, no data retained).
- [ ] Updates the `buddy_purchases` row to
      `status: 'expired_gifted'`.
- [ ] Emails the buyer the gift code (subject: "Your buddy didn't
      activate their FIT50 seat — here's the gift code").
- [ ] The buyer can then forward the code to anyone (Scenario B).

---

## Scenario B — Gift-code redemption

### B.1 — Receive the gift code

- [ ] The buyer received the gift code via Scenario A.8 above (or via
      any future pair window expiry).
- [ ] The buyer forwards the code to the recipient.

### B.2 — Redeem the code

- [ ] The recipient opens `/redeem` (linked from the Footer as
      "Redeem code"). The form has 3 fields: Gift code, Email, Set a
      password.
- [ ] The code is uppercased as the user types. Minimum 4 chars.
- [ ] Password minimum 8 chars. Email is auto-uppercased then
      lowercased server-side.
- [ ] If the user is already signed in, the email field pre-fills.
- [ ] On submit, `POST /api/buddy/redeem`:
- [ ] Validates the code is exactly the right shape, not yet redeemed.
- [ ] Creates a new auth user via `admin.createUser` with
      `email_confirm: true`.
- [ ] Upserts the profile with `is_premium: true`,
      `premium_purchased_at: now`, `challenge_started_at: today`,
      `activation_status: 'active'`.
- [ ] Inserts two `buddy_pairs` rows to pair with the original buyer
      (idempotent on the unique constraint).
- [ ] Marks the gift code `redeemed_by_user_id: <new id>` and
      `redeemed_at: now`.
- [ ] Returns a magic link. The client follows it so the buddy is
      signed in immediately, landing on `/account?activated=1`.

### B.3 — Pair + premium (RLS)

- [ ] The buddy is now `is_premium: true`, paired with the original
      buyer. The day-after-50 certificate unlocks.

### B.4 — Day 50

- [ ] Same as Scenario A.7 — premium certificate.

---

## UX/UI risks (both scenarios)

- **Anonymous vs signed-in** — the activation page is the only entry
  for the buddy. They get a fresh auth user with their own email
  (the buyer's email is on the purchase, not the buddy's).
- **Free vs premium** — both scenarios end up premium. There is no
  current code path that gives the buddy a free account. A free
  user can sign up directly or join a cohort, but a pair-purchase
  buddy is always premium.
- **Mobile vs desktop** — the activation page and `/redeem` page are
  single-column on both. The activation form has full-width buttons.
- **Empty / loading** — the activation page shows "Loading…" while
  the token is validated. The first sign-in lands on `/account`
  which shows "Loading…" until the auth context hydrates.
- **Error state** — every error path has a user-readable message:
  expired link, password too short, password mismatch, code already
  used, missing service-role key, code not found, buddy email
  already a user.
- **Edge of data model** — the pair window is enforced by
  `activation_expires_at` (and the cron that follows up). The pair
  is enforced by RLS via `get_buddy_pair_ids()`. Hiding one side
  doesn't hide the other.
- **Design system fit** — both pages are on `tone="paper"`. The
  MyMotivator card sits on paper-on-paper with the partner's name
  in display-2.
- **Accessibility** — the activation form has explicit labels, an
  `aria-live` for the success message, and a "Sign me in with a link
  instead" toggle that preserves keyboard focus.

## Out of scope

- Cohort auto-join. The buddy is not auto-added to the buyer's
  cohort; cohort is a separate opt-in.
- Multiple buddies per buyer. The pair is one-to-one (the
  `UNIQUE (user_id, buddy_user_id)` constraint on `buddy_pairs`
  enforces this; multiple seats mean multiple pair rows, not a
  group).
- Group challenges. That's cohorts, not pairs.

## Test plan

- **Scenario A** — buy a pair in Stripe test mode (anonymous buyer).
  Confirm two emails go out: a "purchaser-welcome" to the buyer and a
  "buddy-invite" to the buddy. Click each link. Set a password on
  each. Confirm both have `is_premium: true` and `activation_status:
  'active'`. Open the buyer's MyMotivator and confirm the buddy
  shows up. Open the buddy's MyMotivator and confirm the buyer shows
  up.
- **Scenario A — signed-in buyer** — repeat with a signed-in buyer.
  Confirm the buyer doesn't receive a welcome email (their account
  is already active); only the buddy does.
- **Scenario A — expiry** — buy a pair, manually set
  `activation_expires_at` to yesterday on the buddy's profile, run
  the cron, confirm the gift code email goes to the buyer and the
  buddy's profile + auth user is deleted.
- **Scenario A — fallback** — unset `SUPABASE_SERVICE_ROLE_KEY`.
  Click an activation link. Confirm the UI flips to magic-link mode
  and the OTP path completes activation.
- **Scenario B** — manually create a `gift_codes` row. Open
  `/redeem`. Enter the code, an email, a password. Confirm the
  account is created with `is_premium: true` and the pair rows
  are inserted.
- **Scenario B — duplicate** — redeem the same code twice. Confirm
  the second call returns "This code has already been used.".
- **Hide one side** — set `hidden_at` on the buyer's pair row.
  Confirm the buyer no longer sees the buddy on MyMotivator, but the
  buddy still sees the buyer.

## Cross-references (per-feature stories in this journey)

- [happy-path-anonymous.md](./happy-path-anonymous.md) — the buyer's
  side of the pair flow.
- [happy-path-premium-user.md](./happy-path-premium-user.md) — both
  scenarios' daily life (both end up premium).
- [premium-unlock.md](./premium-unlock.md) — the premium grant.
- [streak-protection.md](./streak-protection.md) — premium perk
  available from day 1.
- [cohort-high-five.md](./cohort-high-five.md) — if the buddy joins
  the same cohort as the buyer.
- [day-before-reminder.md](./day-before-reminder.md) — the buddy
  template of the day-before email.