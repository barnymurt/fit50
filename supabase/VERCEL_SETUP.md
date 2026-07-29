# Vercel + Domain Setup

This walkthrough takes you from "I bought a domain" to "fit50challenge.io is live in production."

## Overview

- **Production**: `fit50challenge.io` → served from the branch you've configured as Production in Vercel (currently `feature/initial-build`)
- **Preview**: every other branch gets a unique `*.vercel.app` URL automatically
- **Preview deploys don't touch the production domain** — safe to test breaking changes

---

## Step 1: Add the domain in Vercel

1. Go to https://vercel.com/dashboard
2. Select your FIT50 project
3. **Settings** → **Domains**
4. Type `fit50challenge.io` → click **Add**
5. Vercel will show you the DNS records you need to add (see Step 2)
6. Also add `www.fit50challenge.io` and set it to redirect to the apex (`fit50challenge.io`) — this is the standard SEO setup

---

## Step 2: Configure DNS at your registrar

Wherever you bought `fit50challenge.io` (Namecheap, Cloudflare, GoDaddy, etc.):

### Apex domain (`fit50challenge.io`)

Add an **A record**:
- Type: `A`
- Host: `@` (or leave blank)
- Value: `76.76.21.21`
- TTL: `3600` (or auto)

### WWW subdomain (`www.fit50challenge.io`)

Add a **CNAME record**:
- Type: `CNAME`
- Host: `www`
- Value: `cname.vercel-dns.com`
- TTL: `3600`

DNS can take 5–60 minutes to propagate. Vercel will show a green check when the domain is verified.

---

## Step 3: Set environment variables in Vercel

**Settings** → **Environment Variables** — add these three:

| Variable | Value | Apply to |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://djblhxwdsazksgubhlrn.supabase.co` | All |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_0iuywuLWYT1-mPKhWW4pWA_YZQwmzcL` | All |
| `NEXT_PUBLIC_SITE_URL` | `https://fit50challenge.io` | **Production only** |

Vercel lets you set the same variable for different environments (Production, Preview, Development). For `NEXT_PUBLIC_SITE_URL`, set it only for Production — previews will automatically use `window.location.origin` which gives the `*.vercel.app` URL.

---

## Step 4: Verify the production branch

1. **Settings** → **Git**
2. Confirm the **Production Branch** is set to `feature/initial-build` (or whatever branch you want as production)
3. Every push to this branch → deploys to `fit50challenge.io`
4. Every push to any other branch → deploys to a unique `*.vercel.app` preview URL

---

## Step 5: Update Supabase allowed redirect URLs

Production needs to be in Supabase's allowlist for magic links to work:

1. Go to https://supabase.com/dashboard/project/djblhxwdsazksgubhlrn/auth/url-configuration
2. Under **Redirect URLs**, add:
   - `http://localhost:3000/**` (dev)
   - `https://*.vercel.app/**` (all Vercel preview deployments)
   - `https://fit50challenge.io/**` (production)
   - `https://www.fit50challenge.io/**` (if you kept www)
3. Save

Without this, the magic link will return a "redirect URL not allowed" error.

---

## Step 6: Verify production works

1. Wait for DNS to propagate and Vercel to show the domain as verified
2. Visit https://fit50challenge.io
3. Scroll to the tracker, click a habit
4. Enter your email, click "Send sign-in link"
5. Check your inbox, click the magic link
6. You should land back on `https://fit50challenge.io/account` — signed in

---

## Preview workflow

When you want to test a change without affecting production:

```bash
git checkout -b feature/some-change
# make changes
git push origin feature/some-change
```

Vercel automatically:
- Builds a preview deployment
- Gives it a unique URL like `fit50challenge-git-feature-some-change-username.vercel.app`
- Posts the URL to the GitHub PR (if you open one)

The preview URL is reachable from anywhere. The magic link redirect will use the preview URL automatically (because of `window.location.origin`). You can test the full flow without touching production.

To merge to production:
```bash
git checkout feature/initial-build
git merge feature/some-change
git push origin feature/initial-build
```

---

## Production vs Preview env vars at a glance

| Variable | Local dev | Preview (Vercel) | Production (Vercel) |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `.env.local` | Vercel env var | Vercel env var |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `.env.local` | Vercel env var | Vercel env var |
| `NEXT_PUBLIC_SITE_URL` | not needed | not needed | `https://fit50challenge.io` |

The magic link redirect uses `NEXT_PUBLIC_SITE_URL` if set, otherwise `window.location.origin`. So:
- Local dev → `http://localhost:3000`
- Preview → `https://fit50challenge-xxx.vercel.app`
- Production → `https://fit50challenge.io`
