# Day-before-start reminder email

A Vercel cron sends a branded reminder the day before the user's
challenge starts. Three variants: solo, cohort, buddy.

## User story

As an **active free user, cohort member, or solo user**, I want **to get
a reminder the day before day 1**, so that **I'm not surprised by the
challenge starting and I can do the first habit first thing in the
morning**.

## Acceptance criteria

- [ ] The cron at `30 13 * * *` (`/api/cron/challenge-day-before-reminder`)
      fires daily and finds every user whose `challenge_started_at` is
      tomorrow.
- [ ] Users are deduped by source: solo / cohort / buddy, and the
      matching email template is used.
- [ ] The dedup table `public.challenge_day_before_reminder` has a
      `(user_id, source)` PK; service role writes, user can SELECT their
      own row.
- [ ] The cron is idempotent — running it twice on the same day doesn't
      send two emails.
- [ ] Email subject shifts with the variant; body uses the same
      wordmark + CTA so all three feel like one programme.

## UX/UI risks

- Service-role key misuse: the cron must use the service-role client,
  not the user client. RLS would block the SELECT otherwise.
- Email client quirks: wordmark image must render in Apple Mail, Gmail,
  Outlook. Test before launch.
- Brand voice: cohort opener references "X of Y hit 9/9 today"; buddy
  opener names the buddy and points at doing the same first habit at
  the same time; solo opener is the most direct. Tone matches the
  site — Fraunces headlines, paper background, ink text.
- Unsubscribe: must respect the existing unsubscribe path. Don't add a
  second one.
- Failure: if Resend returns an error, log and continue — don't crash
  the cron.

## Out of scope

- SMS reminders.
- Day-of-start reminders (only day-before).
- Per-day progress emails (we send day-50 milestone via a separate
  cron).

## Test plan

- Integration: cron endpoint with a fixed date returns the right users.
- Manual: trigger the cron for a test user, confirm the email lands.
- Idempotency: run the cron twice for the same day, confirm no duplicate
  email.

## Shipped

- **Commit**: `269a236`
- **Files**: `src/app/api/cron/challenge-day-before-reminder/route.ts`,
  `src/email/day-before-reminder.tsx`,
  `supabase/migrations/0049_cohort_day_before_reminder.sql`,
  `vercel.json`.