# Lemon Squeezy Setup

Complete the premium checkout flow in ~20 minutes.

## What you need to do

1. Create a Lemon Squeezy account at https://www.lemonsqueezy.com
2. Create a product for the €7.99 unlock
3. Generate a webhook signing secret
4. Set up the webhook to point at your Vercel deployment
5. Add three env vars to Vercel
6. Test the flow end-to-end

---

## Step 1: Create the Lemon Squeezy account

1. Go to https://www.lemonsqueezy.com
2. Sign up
3. Complete the store setup (store name, currency = EUR, country for tax)

Lemon Squeezy acts as the Merchant of Record — they handle VAT, sales tax, invoicing globally. You get paid out via Stripe or PayPal to your bank account.

---

## Step 2: Create the product

1. **Dashboard** → **Products** → **New Product**
2. Fill in:
   - **Name**: `FIT50 Premium`
   - **Description**: `One-time unlock. Cloud sync, streak protection, daily reminders, photo proof, and the completion certificate.`
   - **Price**: `€7.99`
   - **Type**: `Single payment` (NOT subscription)
   - **Tax category**: `Digital products`
3. Save the product
4. Copy the **Product ID** (looks like `12345`) — you'll need this for the webhook payload

---

## Step 3: Get the checkout URL

1. On the product page, click **Share / Embed**
2. Copy the **Direct link** (looks like `https://fit50.lemonsqueezy.com/buy/abc-123`)
3. This is `NEXT_PUBLIC_LEMON_SQUEEZY_CHECKOUT_URL` — you'll add it to Vercel env vars

---

## Step 4: Create the webhook

1. **Settings** → **Webhooks** → **Add webhook**
2. Configure:
   - **URL**: `https://fit50challenge.io/api/lemonsqueezy/webhook`
   - **Events**: select all three:
     - `subscription_created`
     - `subscription_updated`
     - `subscription_cancelled`
3. Save
4. Copy the **Signing Secret** — this is `LEMON_SQUEEZY_WEBHOOK_SECRET`

---

## Step 5: Add env vars to Vercel

**Settings** → **Environment Variables**:

| Variable | Value | Apply to |
|---|---|---|
| `LEMON_SQUEEZY_WEBHOOK_SECRET` | your signing secret | Production + Preview |
| `NEXT_PUBLIC_LEMON_SQUEEZY_CHECKOUT_URL` | your checkout URL | Production + Preview |
| `SUPABASE_SERVICE_ROLE_KEY` | from Supabase Settings → API | Production + Preview |

The `SUPABASE_SERVICE_ROLE_KEY` is needed because the webhook updates the `is_premium` flag server-side (bypassing RLS). **Never expose this to the browser** — only use it in API routes.

Also add the same vars to your local `.env.local` for testing:

```bash
LEMON_SQUEEZY_WEBHOOK_SECRET=...
NEXT_PUBLIC_LEMON_SQUEEZY_CHECKOUT_URL=https://fit50.lemonsqueezy.com/buy/abc-123
SUPABASE_SERVICE_ROLE_KEY=...
```

---

## Step 6: Test the flow

1. Deploy to Vercel (or trigger a preview deploy)
2. Sign in to your site
3. Copy your user ID from Supabase → Authentication → Users
4. Navigate to `https://fit50.lemonsqueezy.com/buy/abc-123?checkout[custom][user_id]=YOUR_USER_ID&checkout[email]=your@email.com`
5. Complete the checkout (use a real card or Lemon Squeezy's test mode)
6. Within ~30 seconds, your Supabase profile should show `is_premium: true`
7. Refresh your site — the streak protection should now be unlocked

You can also test the webhook directly:
1. In Lemon Squeezy → Webhooks → click your webhook
2. Click **Send test event** → select `subscription_created`
3. Check the response and your Supabase profile

---

## How the webhook works

The flow is:

1. User clicks "Unlock for €7.99" on `/upgrade`
2. The site redirects to Lemon Squeezy's checkout URL with `user_id` passed as `custom_data`
3. User completes payment
4. Lemon Squeezy fires a webhook event to `https://fit50challenge.io/api/lemonsqueezy/webhook`
5. The webhook handler:
   - Verifies the HMAC SHA256 signature
   - Reads the `user_id` from `custom_data`
   - Updates `profiles.is_premium = true` in Supabase
6. Next time the user visits the site, the session refreshes and they see premium features active

For cancellations/expirations, the webhook sets `is_premium = false`.

---

## Vercel webhook configuration

Lemon Squeezy sends webhooks from their servers. Vercel accepts them automatically — no firewall changes needed. The route is at `/api/lemonsqueezy/webhook` and is a dynamic server-rendered function (handled by the Next.js API route).

---

## Pricing notes

- **Customer pays**: €7.99
- **Lemon Squeezy fee**: ~5% (so ~€0.40)
- **Payment processor fee**: ~2.9% + €0.30 (so ~€0.53)
- **Net to you**: ~€7.06 per sale

At 100 sales, that's €706. At 1,000 sales, €7,060. The MO model means you don't have to handle VAT registration in 27 EU countries — Lemon Squeezy does it.

---

## Refunds

Lemon Squeezy handles refunds through their dashboard. When you refund a customer:
1. The subscription is cancelled
2. A `subscription_cancelled` webhook fires
3. Your handler sets `is_premium = false` in Supabase

The customer loses premium access immediately. If you want a grace period, you'd need to track the refund date in your own database and not flip the flag until the period ends.

---

## What's NOT in Phase 2 yet

- ❌ Daily reminder emails (Phase 2.5 — needs Resend/Postmark setup)
- ❌ Photo proof upload (Phase 2.5 — needs Supabase storage bucket)
- ❌ Completion certificate PDF generation (Phase 3 — needs domain + storage)
- ❌ Data export (CSV) — small feature, can add anytime
- ❌ Friend accountability (share link) — Phase 3 stretch goal

The core monetization flow (paywall → checkout → webhook → premium flag) is what Phase 2 delivers. Everything else is incremental.

---

## Vercel production env vars checklist

```
✓ NEXT_PUBLIC_SUPABASE_URL
✓ NEXT_PUBLIC_SUPABASE_ANON_KEY
✓ NEXT_PUBLIC_SITE_URL              = https://fit50challenge.io (production only)
✓ LEMON_SQUEEZY_WEBHOOK_SECRET
✓ NEXT_PUBLIC_LEMON_SQUEEZY_CHECKOUT_URL
✓ SUPABASE_SERVICE_ROLE_KEY
```

Preview deployments should have all of these **except** `NEXT_PUBLIC_SITE_URL` (which stays unset so previews use their own Vercel URL via `window.location.origin`).
