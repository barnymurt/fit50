# Migrations

SQL files run **in order** by filename prefix. The Supabase SQL Editor only lets you paste one query at a time, so these are designed to be pasted in order.

## If your project is fresh (or has no FIT50 tables)

Run `0000_reset_and_init.sql` first. It drops everything (if anything exists) and creates the full schema.

Then run `0001_newsletter.sql` to add the newsletter table.

Then your server-side `SUPABASE_SERVICE_ROLE_KEY` will work because the schema matches what the code expects.

## If your project has leftover tables from a previous project

Same steps — `0000_reset_and_init.sql` does `DROP TABLE IF EXISTS ... CASCADE` for all four FIT50 tables before recreating them. This wipes whatever was there with matching names.

If the leftover tables have different column names, the migration still works (it creates fresh tables, not alter). Your code queries (`profiles.is_premium`, `tracker_progress.day`, etc.) will start working once the schema matches.

## What's in the schema

Four tables:

- **`profiles`** — one row per auth user. Holds email, `is_premium` flag, `premium_purchased_at`, `challenge_started_at`.
- **`tracker_progress`** — `(user_id, day, habit_id, completed)` rows. Unique on `(user_id, day, habit_id)`.
- **`streak_protections`** — `(user_id, week_start_date, redeemed_day)` rows. Unique on `(user_id, week_start_date)`. Premium-only feature.
- **`newsletter_subscribers`** — email + subscribed_at. Marketing list, public insert, service_role read.

Two triggers:

- **`on_auth_user_created`** — creates a `profiles` row when a user signs up.
- **`on_profile_updated`** — bumps `profiles.updated_at` on every update.

Full RLS:

- Users can read/update their own `profiles`.
- Users can read/insert/update/delete their own `tracker_progress`.
- Users can read/insert their own `streak_protections`.
- Anyone can insert into `newsletter_subscribers`. Service role reads it (no public read policy).

## How the code reads/writes

| Code path | Operation | RLS check |
|---|---|---|
| `useAuth.refreshProfile` | `select id, email, display_name, is_premium, challenge_started_at from profiles where id = user.id` | User reads own profile |
| Tracker sync (`useSyncTracker`) | `upsert tracker_progress on (user_id, day, habit_id)` | User writes own tracker |
| `useStreakProtection.redeemProtection` | `insert streak_protections` | User writes own protection |
| Creem webhook | `update profiles set is_premium = true where id = user.id` | Service role bypasses RLS |
| Newsletter signup (Footer) | `upsert newsletter_subscribers on email` | Anyone can insert |
