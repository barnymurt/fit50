# Premium unlock (€5.99 one-time)

Free user pays once to unlock the premium surface: cloud sync, streak
protection, daily reminders, photo proof, completion certificate, data
export.

## User story

As a **new free user**, I want **to pay once (€5.99) and unlock
everything**, so that **I'm not stuck in a recurring subscription for a
50-day challenge** ("price of a caneca" — one-and-done).

## Acceptance criteria

- [ ] Given I'm a free user on the account page, I see a clear CTA
      pointing at `/upgrade`.
- [ ] The `/upgrade` page explains what's gated, the price (€5.99), and
      that it's one-time, not a subscription.
- [ ] "Unlock" kicks off Stripe Checkout via
      `POST /api/stripe/checkout`.
- [ ] On `checkout.session.completed`, the webhook sets
      `profiles.is_premium = true`.
- [ ] On `charge.refunded`, the webhook flips `is_premium = false`.
- [ ] After payment, the account page reflects the new premium state on
      next navigation (no manual reload).

## UX/UI risks

- Anonymous user clicking the upgrade CTA must be routed through sign-in
  first — don't lose the intent.
- Mobile: Stripe's hosted Checkout handles its own mobile UX. We only
  own the CTA card.
- If Stripe returns an error, show the error inline, do not silently
  reload.
- Refund: if a premium-only hook tries to load data after refund, RLS on
  the gated tables must reject the request — not just hide the UI.
- Section tone: the upgrade page sits on a tone that's distinct from the
  home and account pages so it feels like a destination, not a modal.

## Out of scope

- Subscriptions. We are one-time only. Do not introduce recurring billing.
- Promotional codes (not built yet — would be a separate story).
- Gift purchases (not built yet).

## Test plan

- Manual: full Stripe test-mode flow end to end, including webhook
  signature verification.
- Manual: refund path flips the UI on next navigation.
- Unit: webhook handler signature verification rejects bad signatures.

## Shipped

- **Files**: `src/app/upgrade/page.tsx`,
  `src/app/api/stripe/checkout/route.ts`,
  `src/app/api/stripe/webhook/route.ts`,
  `src/hooks/usePremium.ts`, account page upsell copy.