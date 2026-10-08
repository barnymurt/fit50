# Join the monthly cohort

Any signed-in user can opt into the next monthly cohort challenge and
see collective progress alongside their own.

## User story

As a **new free user (or active free user)**, I want **to join the next
monthly cohort with one tap**, so that **I'm doing the 50 days with
other people** — not alone — which is what the cohort programme exists
for.

## Acceptance criteria

- [ ] Given I'm signed in and have no live cohort, the account page
      shows a CohortJoinCard with the next cohort's start date, finish
      line event, and a "Join this cohort" CTA.
- [ ] Tapping the CTA posts to `POST /api/cohort/join` and the user's
      profile gets a `cohort_id`.
- [ ] After joining, the CohortSection on the account page replaces the
      join card and shows progress (X/50 days done by the cohort).
- [ ] If the cohort has already started, the CTA shows "Join late" and
      explains the cost.
- [ ] Joining a cohort does not require premium.

## UX/UI risks

- Anonymous: hide the join CTA, show a "Sign in to join" link instead.
- Mobile: the join card collapses to a single column under 640px.
- Loading: while `POST /api/cohort/join` is in flight, disable the CTA
  and show a spinner.
- Error state: if the cohort is full / closed, surface the message
  inline, don't navigate away.
- Edge: user already in a cohort — don't show the join card; show the
  CohortSection instead.

## Out of scope

- Cohort-to-cohort migration (joining a second cohort after finishing
  the first is allowed by RLS but not yet specced).
- Payment / paid cohorts. Cohorts are free.
- Cohort-admin tools. We seed cohorts, we don't expose a CMS.

## Test plan

- Manual: sign in as a free user, join the next cohort, confirm
  CohortSection appears.
- Manual: try to join twice, confirm second call returns idempotently or
  with a clear "already joined" error.
- Integration: RLS check — user in cohort A can't read cohort B's data.

## Shipped

- **Commit**: `b31258e`
- **Files**: `src/components/cohort/CohortJoinCard.tsx`,
  `src/components/cohort/CohortSection.tsx`,
  `src/app/api/cohort/join/route.ts`,
  `supabase/migrations/0045_cohorts.sql`,
  `supabase/migrations/0046_cohorts_seed.sql`.