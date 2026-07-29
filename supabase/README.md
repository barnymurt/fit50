# Supabase Setup

This is the quickest way to get the FIT50 backend running.

## What the script does

`npm run setup:supabase` will:
1. Check for the Supabase CLI (installs via `npx` if needed)
2. Log you in to Supabase (opens browser)
3. Link to your FIT50 project
4. Push the database migration (creates tables, RLS, triggers)
5. Write your API keys to `.env.local`

## Step-by-step

### 1. Create the Supabase project

You already have a Supabase account. Create a new project just for FIT50:

1. Go to https://supabase.com/dashboard
2. Click **New project**
3. Name: `fit50`
4. Database password: pick a strong one, save it somewhere
5. Region: pick one close to your users (e.g., `eu-west-1` for Portugal/UK)
6. Click **Create new project** (takes ~1 minute)

### 2. Run the setup script

```bash
npm run setup:supabase
```

The script will walk you through:
- Logging in to Supabase (browser popup)
- Pasting your project reference (from the dashboard URL)
- Pasting your API keys (from Settings → API)

### 3. Find your project reference

When your project is created, the dashboard URL looks like:

```
https://supabase.com/dashboard/project/abcdefghijkl
```

The `abcdefghijkl` part is your project reference. The script will ask for it.

### 4. Get your API keys

In the Supabase dashboard:
1. Go to **Project Settings** (gear icon) → **API**
2. Copy **Project URL** (under "Project API keys")
3. Copy **anon / public** key (the long `eyJ...` string)

Paste both into the script when prompted.

### 5. Verify

```bash
npm run verify:supabase
```

This checks:
- `.env.local` is set with real values
- The migration file is present
- The Supabase packages are installed
- All the code wiring is in place

### 6. Add to Vercel

The script writes to `.env.local` for local dev. You also need to add the same vars to Vercel:

1. Go to your Vercel project → **Settings** → **Environment Variables**
2. Add:
   - `NEXT_PUBLIC_SUPABASE_URL` = your Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your anon key
3. Redeploy

### 7. Test

```bash
npm run dev
```

Visit http://localhost:3000, scroll to the tracker, click a habit. The email modal should pop up. Enter your email, click "Send sign-in link", check your email, click the link. You should be signed in and back on the site. The "Sign in" link in the nav should now say "Account".

## What's in the database

Three tables, all with RLS:

- **`profiles`** — one row per user, holds `is_premium` flag and challenge dates
- **`tracker_progress`** — `(user_id, day, habit_id, completed)` rows, one per habit check
- **`streak_protections`** — `(user_id, week_start_date, redeemed_day)` for premium users, max 1 per week

Plus two triggers:
- Auto-create a profile row when a user signs up
- Auto-update `updated_at` on profile changes

## Vercel-specific notes

- The env vars are `NEXT_PUBLIC_*` so they're available in the browser
- After adding them, trigger a redeploy (Vercel → Deployments → Redeploy)
- The magic link redirect goes to `NEXT_PUBLIC_SITE_URL` (defaults to `http://localhost:3000` in dev — set this to your production URL in Vercel)
