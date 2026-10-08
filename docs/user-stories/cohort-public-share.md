# Public cohort share landing pages

Anonymous visitors can land on `/cohorts` and `/cohorts/[id]` to see
what a cohort is and share a specific cohort with a friend.

## User story

As an **anonymous visitor**, I want **to land on a cohort page and
understand what I'd be joining**, so that **someone can share a link
with me and I can decide to sign up and join without context**.

## Acceptance criteria

- [ ] `/cohorts` lists the next 3–6 upcoming cohorts, each with start
      date, finish line, and finish-line event.
- [ ] Each cohort has its own `/cohorts/[id]` share page with a hero
      line, finish-line coral block, "what you do on day 1" callout,
      and a join CTA.
- [ ] The page is server-rendered, indexable, and shareable on social
      with a proper OG image.
- [ ] The join CTA on a share page routes an anonymous user through
      sign-up and then auto-joins the cohort.

## UX/UI risks

- Anonymous: the join CTA must not 404 or 500 — sign-in then join is
  the path.
- Mobile: share page must look good as a link preview, not just in the
  browser.
- Tone: the share page uses the same section-tone rotation as the home
  page. Don't introduce a new colour.
- Empty state: if no cohorts are upcoming, the landing still explains
  what cohorts are and offers a "tell me when the next one opens"
  newsletter.
- SEO: meta description, OG title, OG image all derived from the cohort.

## Out of scope

- Cohort admin / CMS.
- Editing cohort copy from the browser.
- Cohort search / filter.

## Test plan

- Manual: open the share page in an anonymous browser, confirm the
  hero + finish-line + CTA render.
- Manual: share the URL on Twitter / Slack / iMessage, confirm the
  preview looks right.
- Lighthouse: score on mobile and desktop.

## Shipped

- **Commit**: `c23a6e5`
- **Files**: `src/app/cohorts/page.tsx`,
  `src/app/cohorts/[id]/page.tsx`,
  `src/hooks/usePublicCohorts.ts`, `src/hooks/usePublicCohort.ts`,
  `supabase/migrations/0047_cohorts_public_read.sql`.