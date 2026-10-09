# Phase 4 — Member submissions

Three pillars depend on what members send in: `member-progress`,
`books-members-read`, `passion-projects`. The intake form is the
single point of entry. Each submission records explicit consent
(which content, which channels, the right to withdraw at any
time) with a timestamp. Submissions are approved in the editor
review queue before they ever feed the generator. The
submission is the source of truth for any post that comes out
of it — the facts check rejects any number, date or claim that
isn't in the submission. If a member withdraws consent, every
post using that submission is flagged so it can be taken down.

## User story

As the content engine, I need a member-submission flow that
takes answers + photos + credit preference, records consent
with a timestamp, lets me approve or reject in a review queue,
auto-generates a post draft from the approved submission, and
flags every post using a withdrawn submission — so that **a
test submission goes from form to approved post, and
withdrawing consent flags that post**.

## Acceptance criteria

### Data model
- [ ] `supabase/migrations/0052_content_submissions.sql` creates
      `content_submissions` (id, member_id, type [progress |
      book | project], answers jsonb, photo_paths text[],
      credit_as ['full_name' | 'first_name' | 'anonymous'],
      consent_scope text, consent_at timestamptz, withdrawn_at
      timestamptz, status ['pending' | 'approved' | 'rejected'],
      created_at, updated_at) — one row per submission. RLS
      enabled.
- [ ] A `submission_id` column on `content_posts` (nullable)
      so withdrawal can find every post using a submission.

### API routes (under `/api/ce/...`)
- [ ] `POST /api/ce/submissions` — create a submission. Body:
      type, answers, photo_paths, credit_as, consent_scope,
      consent_at. Zod schema for the body. Status defaults to
      'pending'.
- [ ] `GET  /api/ce/submissions` — list submissions
      (filterable by `?status=pending|approved|rejected` and
      `?member_id=...`).
- [ ] `GET  /api/ce/submissions/:id` — get a single submission.
- [ ] `POST /api/ce/submissions/:id/approve` — set status to
      'approved'. Body: `{ generate_post: boolean, pillar:
      'member-progress' | 'books-members-read' |
      'passion-projects' }`. If `generate_post` is true, the
      server creates a `content_posts` row with the
      submission's id as `source.submission_id` and a stub
      post JSON (one cover + one CTA slide, plus pillar
      templates) so the editor's render path is exercised.
- [ ] `POST /api/ce/submissions/:id/reject` — set status to
      'rejected'. Body: `{ note?: string }`.
- [ ] `POST /api/ce/submissions/:id/withdraw` — set
      `withdrawn_at = now()`. The server finds every post with
      `source.submission_id = :id` and adds a `withdrawn: true`
      flag to each post's `checks` object. The editor surfaces
      these posts as "needs takedown" in the review queue.

### Intake forms (under `src/app/account/...`)
- [ ] `/account/progress` — form: 1–3 habit highlights, the
      streak number, the feeling, the credit preference, the
      consent checkbox (with a one-paragraph consent statement
      that the user accepts). POSTs to `/api/ce/submissions`.
- [ ] `/account/books` — form: book title + author, 1–3
      member ideas (in their own words), one short attributed
      line (optional, ≤ 30 words), credit preference, consent
      checkbox. POSTs to `/api/ce/submissions`.
- [ ] `/account/projects` — form: project title, 3–5
      milestones (date + one line each), the finished artefact
      (one short description), credit preference, consent
      checkbox. POSTs to `/api/ce/submissions`.
- [ ] All three forms use the same consent wording. The story
      ships a draft of that wording; the open-questions list
      still owes a GDPR check by a qualified person before the
      first member feature goes out (per the spec).

### Review queue (under `src/app/(content-engine)/editor/`)
- [ ] `/editor/submissions` — table of pending submissions
      (id, type, member_id, credit_as, created_at). Each row
      has a "View" link to /editor/submissions/[id] and
      "Approve" / "Reject" buttons.
- [ ] `/editor/submissions/[id]` — full submission view. Shows
      all the submitted fields, the consent statement the
      member agreed to, and the Approve / Reject / Withdraw
      buttons. Withdraw is also surfaced here so the editor can
      take down a post even if the member doesn't have the
      password-protected intake flow.
- [ ] Withdrawn posts show up in the existing /editor list
      with a "withdrawn" badge. The existing checker reads
      `checks.withdrawn` and the editor shows the takedown
      notice.

### Verification
- [ ] `npm run check:brand && npm run check:posts && npm run
  check:renderer && npm run check:generator && npm run build`
  all pass.
- [ ] `npm run build` includes the new routes:
  - `/account/progress`, `/account/books`, `/account/projects`
  - `/editor/submissions`, `/editor/submissions/[id]`
  - `/api/ce/submissions`, `/api/ce/submissions/:id`,
    `/api/ce/submissions/:id/approve`,
    `/api/ce/submissions/:id/reject`,
    `/api/ce/submissions/:id/withdraw`
- [ ] Manual: a member fills in the progress form, the editor
  approves it, a `content_posts` row is created with
  `source.submission_id` set, the post renders cleanly. Then
  the member (or the editor) withdraws, the post shows
  `checks.withdrawn: true`.

## UX/UI risks

- **Consent wording** — the GDPR check is owed by a qualified
  person, not the engine. The form ships a draft that's
  explicit about (a) which content the member is consenting
  to, (b) which channels (Instagram, Facebook, TikTok), (c)
  the right to withdraw at any time, (d) that withdrawal
  flags existing posts for takedown. The wording is
  intentionally a draft, not legal advice.
- **Photo upload** — v1 ships a `photo_paths` field on
  submissions. The intake form is a stub: the member pastes
  a path (or a URL) and the form records it. Real upload via
  Supabase Storage is a follow-up; the form's stub is enough
  to exercise the post-approval path.
- **Three intake forms, one consent statement** — they all
  use the same wording. The wording is in a single
  `src/components/member/ConsentStatement.tsx` so any future
  change updates all three at once.
- **Withdraw from a member's perspective** — the intake
  flow is for logged-in members; the member needs the
  editor's password to access the withdraw UI on /account.
  v1 ships the editor-side withdraw (so the editor can take
  down a post even if the member is unreachable). A
  self-serve member withdraw is a follow-up.

## Out of scope

- Real photo upload (Supabase Storage). v1 takes paths.
- Self-serve member withdraw without the editor password.
- Per-member RLS — Phase 6.
- Authorship tracking (which editor approved which
  submission). v1 records `consent_at` and the approver in
  the version note; the audit log is a follow-up.
- A GDPR-grade consent-form review by a lawyer (the open
  question from the spec).
- Auto-publishing, scheduling, reels, multi-brand.

## Test plan

- **Unit** — Zod schema for the submission body, the approve
  body, the withdraw body.
- **Integration** — `npm run build` succeeds, the new pages
  appear in the route table.
- **Manual** — the end-to-end scenario above (form → approve
  → post → withdraw → takedown badge).

## Shipped
- *(empty — Phase 4 is the next phase)*
