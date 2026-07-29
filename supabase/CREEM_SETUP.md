# Creem Setup

Complete the premium checkout flow in ~10 minutes.

## What you need to do

1. Create a Creem account at https://creem.io
2. Create a product for the €7.99 unlock (test mode is fine)
3. Get the test checkout URL and webhook signing secret
4. Set up the webhook to point at your Vercel deployment
5. Add three env vars to Vercel
6. Test the flow end-to-end
7. When ready for real customers, repeat in **live mode** and swap the env vars

## Env vars

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_CREEM_CHECKOUT_URL` | The direct checkout link. User clicks → goes to Creem. |
| `CREEM_WEBHOOK_SECRET` | Signing secret from Creem → Developers → Webhooks. Verifies webhook authenticity. |
| `SUPABASE_SERVICE_ROLE_KEY` | Already set for Phase 1. Used by the webhook to update profiles. |

Your current test checkout URL is:
```
https://www.creem.io/test/payment/prod_2AqEn1pz8kOMtpuu2Mlj4d
```

For production, you'll create a new product in live mode and get a URL like:
```
https://www.creem.io/payment/prod_LIVE_xxxx
```

---

## Step 1: Create the Creem account

1. Sign up at https://creem.io
2. Toggle into **Test mode** (switch in the dashboard top bar) — this lets you test with `4242 4242 4242 4242` and no real charges
3. Stripe/PayPal/Apple Pay all work in test mode

---

## Step 2: Create the product

1. **Products** → **New Product**
2. Fill in:
   - **Name**: `FIT50 Premium`
   - **Price**: `€7.99`
   - **Type**: One-time payment (not recurring — this is a single unlock)
   - **Tax category**: Digital products
3. Save the product
4. Copy the **checkout URL** — appears in the product detail page. Format:
   - Test mode: `https://www.creem.io/test/payment/{product_id}`
   - Live mode: `https://www.creem.io/payment/{product_id}`

---

## Step 3: Set up the webhook

1. **Developers** → **Webhooks** → **Add webhook**
2. Configure:
   - **URL**: `https://fit50challenge.io/api/creem/webhook`
   - **Events**: select all of these:
     - `checkout.completed`
     - `subscription.active`
     - `subscription.paid`
     - `subscription.trialing`
     - `subscription.update`
     - `subscription.canceled`
     - `subscription.expired`
     - `subscription.paused`
     - `subscription.scheduled_cancel`
     - `subscription.past_due`
     - `refund.created`
3. Save
4. Copy the **Signing Secret** — this is `CREEM_WEBHOOK_SECRET`

---

## Step 4: Add env vars to Vercel

**Settings** → **Environment Variables**:

| Variable | Value | Apply to |
|---|---|---|
| `NEXT_PUBLIC_CREEM_CHECKOUT_URL` | your checkout URL | Production + Preview |
| `CREEM_WEBHOOK_SECRET` | your signing secret | Production + Preview |
| `SUPABASE_SERVICE_ROLE_KEY` | (already from Phase 1) | Production + Preview |

Add the same vars to local `.env.local` for testing:

```bash
NEXT_PUBLIC_CREEM_CHECKOUT_URL=https://www.creem.io/test/payment/prod_2AqEn1pz8kOMtpuu2Mlj4d
CREEM_WEBHOOK_SECRET=whsec_...
SUPABASE_SERVICE_ROLE_KEY=...  (already set)
```

---

## Step 5: Test the flow

1. Deploy to Vercel (or trigger a preview deploy)
2. Sign in to your site (use your real email — the webhook matches by email)
3. Navigate to `/upgrade`
4. Click "Unlock for €7.99" — you'll be redirected to Creem's checkout
5. Complete the test payment with card `4242 4242 4242 4242` (any future expiry, any CVC)
6. Within ~30 seconds, your Supabase profile should show `is_premium: true`
7. Refresh your site — the streak protection should now be unlocked

You can also test the webhook directly:
1. In Creem → Developers → Webhooks → click your webhook
2. Click **Send test event** → select `checkout.completed`
3. Check the response and your Supabase profile

---

## How the webhook works

The flow is:

1. User clicks "Unlock for €7.99" on `/upgrade`
2. The site redirects to Creem's checkout URL
3. User completes payment with their email
4. Creem fires a webhook event to `https://fit50challenge.io/api/creem/webhook`
5. The webhook handler:
   - Verifies the `creem-signature` header using HMAC SHA256
   - Reads the customer email from the event
   - Looks up the matching user in Supabase by email
   - Updates `profiles.is_premium = true` on `checkout.completed`, `subscription.active`, or `subscription.paid`
   - Updates `profiles.is_premium = false` on cancellations, expirations, or refunds

For cancellations/expirations, the webhook sets `is_premium = false`. The customer loses premium access immediately.

---

## Identifying users

Creem allows passing custom data via the checkout, but the simplest approach is to match by email. Since the user is already signed in to your site, their email is known. The webhook handler:

1. Reads `customer.email` from the webhook payload
2. Searches Supabase `auth.users` for a matching email
3. Updates the corresponding profile

This works because:
- The user is signed in before starting checkout
- The email they use at Creem checkout matches their sign-in email
- No need to pass custom data through the checkout URL

---

## Vercel webhook configuration

Creem sends webhooks from their servers. Vercel accepts them automatically — no firewall changes needed. The route is at `/api/creem/webhook` and is a dynamic server-rendered function.

Add a Vercel firewall exception if you use Cloudflare or another WAF in front of Vercel (Creem doesn't provide static source IPs).

---

## Test mode vs Live mode

| | Test mode | Live mode |
|---|---|---|
| **Checkout URL** | `https://www.creem.io/test/payment/{id}` | `https://www.creem.io/payment/{id}` |
| **Webhook secret** | Test secret | Different live secret |
| **Card** | `4242 4242 4242 4242` | Real card |
| **Charges** | None | Real money |
| **Tax** | Simulated | Real (Creem handles globally) |

**Run the full flow in test mode first**, confirm the dashboard shows the transaction and your Supabase profile shows `is_premium: true`, then switch to live mode and update the env vars.

---

## Pricing notes

- **Customer pays**: €7.99
- **Creem fee**: 3.9% + €0.40 (so ~€0.71 per transaction)
- **Net to you**: ~€7.28 per sale

At 100 sales, that's €728. At 1,000 sales, €7,280. Creem handles VAT/GST/sales tax in 190+ countries — you don't need to register anywhere.

---

## Vercel production env vars checklist

```
✓ NEXT_PUBLIC_SUPABASE_URL
✓ NEXT_PUBLIC_SUPABASE_ANON_KEY
✓ NEXT_PUBLIC_SITE_URL              = https://fit50challenge.io (production only)
✓ NEXT_PUBLIC_CREEM_CHECKOUT_URL
✓ CREEM_WEBHOOK_SECRET
✓ SUPABASE_SERVICE_ROLE_KEY
```

Preview deployments should have all of these **except** `NEXT_PUBLIC_SITE_URL` (which stays unset so previews use their own Vercel URL via `window.location.origin`).
