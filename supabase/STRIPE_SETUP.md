# Stripe Setup

Complete the premium checkout flow in ~10 minutes.

## What you need to do

1. Get your Stripe API keys from https://dashboard.stripe.com/apikeys
2. Create a webhook endpoint in the Stripe dashboard pointing at your deployment
3. Add two env vars to Vercel
4. Test the flow end-to-end
5. When ready for real customers, swap the test keys for live keys

## Env vars

| Variable | Purpose |
|---|---|
| `STRIPE_SECRET_KEY` | Server-side Stripe API key. `sk_test_…` for development, `sk_live_…` for production. |
| `STRIPE_WEBHOOK_SECRET` | Signing secret from the Stripe webhook endpoint. Verifies webhook authenticity. |
| `SUPABASE_SERVICE_ROLE_KEY` | Already set. Used by the webhook to update `profiles`. |

The price (€5.99 EUR, one-time) and product copy are hard-coded in `src/app/api/stripe/checkout/route.ts`, so you don't need a Stripe product ID — the Checkout Session is built on the fly with `price_data`.

---

## Step 1: Get your API keys

1. Sign in to https://dashboard.stripe.com
2. Make sure the **Test mode** toggle is on (top right) for development
3. **Developers** → **API keys**
4. Copy the **Secret key** (`sk_test_…`). This becomes `STRIPE_SECRET_KEY`.
5. The publishable key isn't needed for hosted Checkout — the redirect happens server-side.

For production, repeat with the toggle set to **Live mode** and use `sk_live_…`.

---

## Step 2: Create the webhook endpoint

1. **Developers** → **Webhooks** → **Add endpoint**
2. Configure:
   - **Endpoint URL**: `https://fit50challenge.io/api/stripe/webhook`
   - **API version**: latest (or pin to the version your `stripe` SDK matches)
   - **Events to send**: select **only these two**:
     - `checkout.session.completed` — fires on successful payment, flips `is_premium: true`
     - `charge.refunded` — fires on refund, flips `is_premium: false`
3. Save
4. Click into the new endpoint and click **Reveal signing secret**
5. Copy the `whsec_…` value — this becomes `STRIPE_WEBHOOK_SECRET`

The webhook handler short-circuits on any other event type with `{ received: true }`, so if Stripe sends extra events later, nothing breaks.

---

## Step 3: Add env vars to Vercel

**Settings** → **Environment Variables**:

| Variable | Value | Apply to |
|---|---|---|
| `STRIPE_SECRET_KEY` | `sk_test_…` | Production + Preview |
| `STRIPE_WEBHOOK_SECRET` | `whsec_…` | Production + Preview |
| `SUPABASE_SERVICE_ROLE_KEY` | (already set) | Production + Preview |

Add the same vars to local `.env.local` for testing:

```bash
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## Step 4: Test the flow

1. Deploy to Vercel (or trigger a preview deploy)
2. Sign in to your site (use your real email — Stripe will prefill it on checkout)
3. Navigate to `/` and scroll to the **Helpful tools** section
4. Click **Sign up for €5.99** — you'll be redirected to Stripe's hosted Checkout
5. Complete the test payment with card `4242 4242 4242 4242` (any future expiry, any CVC, any postcode)
6. You'll be redirected back to `/account?checkout=success`
7. Within ~30 seconds, your Supabase profile should show `is_premium: true`
8. Refresh your site — the streak protection and other premium features should now be unlocked

You can also send a test webhook directly:
1. In Stripe → Developers → Webhooks → click your endpoint
2. Click **Send test event** → select `checkout.session.completed`
3. Check the response (should be `{ received: true }`) and your Supabase profile (`is_premium` should now be `true`)

For local webhook testing, use the Stripe CLI:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

The CLI prints a `whsec_…` value for your local `.env.local`.

---

## How the flow works

1. User clicks "Sign up for €5.99" on the homepage
2. Client posts to `/api/stripe/checkout`
3. Server verifies the user is signed in (Supabase session cookie), creates a Checkout Session with `customer_email` set to the user's email and `metadata.user_id` set to their Supabase user ID
4. Server returns `{ url }` — the Stripe Checkout URL
5. Client redirects to that URL
6. User completes payment on Stripe's hosted page
7. Stripe fires `checkout.session.completed` to `/api/stripe/webhook`
8. Webhook handler verifies the signature, reads `metadata.user_id`, ensures the profile row exists, then sets `is_premium: true` and `premium_purchased_at: now`
9. User is redirected to `/account?checkout=success`
10. The session on the next page load reflects the new `is_premium` flag (auth context refetches the profile)

For refunds, Stripe fires `charge.refunded`. The handler sets `is_premium: false`. The `premium_purchased_at` timestamp is preserved so you have an audit trail.

---

## Why hosted Checkout, not Stripe Elements

- **No PCI scope**: Stripe hosts the card form. We never touch card data.
- **Less code**: ~80 lines total vs ~300 for Elements.
- **Tax handled globally**: Stripe Tax handles VAT/GST/sales tax in 190+ countries automatically (enable it in the dashboard).
- **Apple Pay / Google Pay included** at no extra cost.
- **3D Secure handled by Stripe** for EU cards (required by PSD2 SCA).

If you later want to embed the form on the page (e.g. inside the homepage's sign-up section instead of redirecting), swap `stripe.checkout.sessions.create` for Stripe Elements + `stripe.paymentIntents.create`. The webhook stays the same.

---

## Pricing notes

- **Customer pays**: €5.99
- **Stripe fee (EU cards)**: 1.5% + €0.25 (so ~€0.34 per transaction on Standard pricing)
- **Net to you**: ~€5.65 per sale
- **Stripe Tax** (optional, enable in dashboard): handles VAT/GST/sales tax globally. Without it, you're responsible for declaring in your own country.

At 100 sales, that's ~€565 net. At 1,000 sales, ~€5,650.

---

## Vercel production env vars checklist

```
✓ NEXT_PUBLIC_SUPABASE_URL
✓ NEXT_PUBLIC_SUPABASE_ANON_KEY
✓ STRIPE_SECRET_KEY                  = sk_live_…
✓ STRIPE_WEBHOOK_SECRET              = whsec_… (from the live webhook endpoint)
✓ SUPABASE_SERVICE_ROLE_KEY
```

Preview deployments should use **test** keys (`sk_test_…`, test `whsec_…`) so accidental purchases in previews don't charge real cards.