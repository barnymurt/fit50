# AGENTS.md

> **Read this before doing any work on this project.**
> This file tells you how the project is built, what to read first, and what the rules are.

## Required reading (in order)

1. **This file** (you're reading it)
2. `docs/design-system/DESIGN_SYSTEM.md` — the design system in markdown (always read before visual work)
3. `docs/design-system/Foundations.dc.html` — the design system with live previews (open in a browser)
4. The current code: `src/components/`, `src/app/`, `tailwind.config.js`, `src/app/globals.css`

If you have access to the `.dc.html` files, browse them — they show the full design system with live examples.

## The design system is the contract

FIT50 has a strict design system. **Do not deviate from it.** Specifically:

- Six colours only: ink, paper, coral, teal, cream, lavender (plus white for panels and rule for borders)
- Three typefaces: Fraunces (display), Inter (body), Lilita One (marquee only)
- Type scale is fixed — `display-1`, `display-2`, `h1`, `h2`, `h3`, `body`, `caption`, `numeral`
- Section tones alternate: `paper → teal → lavender → ink → paper → white → ink`
- No drop shadows (one exception: the solved-cube ring)
- Squares by default, full-radius for buttons only
- Fraunces headings are always 400 — never bold
- Coral is the only action colour, one thing per view

If you're tempted to add a new colour, font, type size, or shape, you're breaking the contract. Extend the system or ask first.

## Project structure

```
branches/initial-build/
├── src/
│   ├── app/                # Next.js App Router pages and routes
│   │   ├── page.tsx        # Homepage (Hero, Rules, Calculator, Workouts, Tracker, FAQ)
│   │   ├── account/        # Sign in / sign up / account page
│   │   ├── upgrade/        # Premium upgrade page
│   │   └── api/
│   │       ├── stripe/checkout/  # POST /api/stripe/checkout (creates Stripe Checkout Session)
│   │       └── stripe/webhook/   # POST /api/stripe/webhook (handles checkout.session.completed + charge.refunded)
│   ├── components/         # Reusable React components (Section, Heading, Button, etc.)
│   ├── contexts/           # React contexts (AuthContext)
│   ├── hooks/              # Custom hooks (useSyncTracker, usePremium, useStreakProtection)
│   └── lib/                # Supabase client and other utilities
├── supabase/
│   ├── migrations/         # SQL migrations to run in Supabase dashboard
│   ├── README.md           # Supabase setup walkthrough
│   ├── AUTH_SETUP.md       # Auth configuration (now email/password + passkey)
│   ├── STRIPE_SETUP.md     # Payment setup (Stripe Checkout)
│   ├── EMAIL_SETUP.md      # Resend SMTP for branded emails
│   └── VERCEL_SETUP.md     # Domain + DNS + production env vars
├── docs/
│   └── design-system/      # The visual contract — read DESIGN_SYSTEM.md first
│       ├── DESIGN_SYSTEM.md
│       ├── Foundations.dc.html
│       ├── Components.dc.html
│       ├── Patterns.dc.html
│       └── support.js
├── public/                 # Static assets (icons, favicon)
├── scripts/                # One-off scripts (icon conversion, seed user, etc.)
└── tailwind.config.js      # Design tokens mapped to Tailwind utilities
```

## Tech stack

- **Next.js 14** App Router + TypeScript
- **Tailwind CSS** with custom theme tokens (see `tailwind.config.js`)
- **Supabase** for auth, database, and the magic webhook
- **Stripe** for payments (hosted Checkout)
- **next/font/google** for Fraunces, Inter, Lilita One
- **Sharp** for image processing (icon conversion, favicon generation)
- **Resend** for branded emails (optional, only for password reset)

## Auth model

Email + password is the primary auth. Passkeys (Face ID, Touch ID, Windows Hello) are a free option for everyone. **Magic links are gone** — they caused every auth bug we hit.

- `signIn(email, password)` — password login
- `signUp(email, password)` — account creation (min 8 chars)
- `signInWithPasskey()` — one-tap biometric login
- `enrollPasskey()` — register this device
- `resetPassword(email)` — sends a reset link

Premium is not for *how* you sign in. It's for *what* you can do once signed in.

## Premium gating

- `is_premium: true` in `profiles` table
- `usePremium()` hook reads the flag
- All premium features (cloud sync, streak protection, daily reminders, photo proof, completion certificate, data export) are gated behind this single flag
- Streak protection: 1 free pass per week for premium users, each save visualized as a 🍌 on the certificate
- One-time payment of €5.99 via Stripe Checkout — no subscription (price of a caneca)

## Common pitfalls

- **Don't add colours.** Extend the palette by tints/opacity of the six existing colours.
- **Don't bold Fraunces headings.** Always 400.
- **Don't add drop shadows.** Use 1px rules and ground colour changes.
- **Don't add rounded corners to panels.** Squares only (full radius for buttons is the exception).
- **Don't use Lilita One for UI text.** Marquee sections only.
- **Don't put paper text on cream or lavender.** Both carry ink.

## Build / lint / verify

```bash
npm run build               # type-checks + builds
npm run lint                # ESLint
npm run verify:supabase     # checks env vars + migration files
npm run setup:supabase      # interactive Supabase setup (legacy)
node scripts/seed-test-user.js you@email.com password --premium  # create a test user
node scripts/convert-icons.js  # regenerate habit icons from PNGs
node scripts/generate-favicon.js  # regenerate the favicon
```

## Live data

- **Production URL**: https://fit50challenge.io
- **Supabase project**: https://supabase.com/dashboard/project/djblhxwdsazksgubhlrn
- **Stripe dashboard**: https://dashboard.stripe.com
- **Vercel project**: https://vercel.com/dashboard

## Remember

The design system is the contract. Read it before any visual work. When in doubt, open `Foundations.dc.html` and look.
