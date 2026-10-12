# Phase 6 — Learning and extras

The corrections table is already populated by the editor
(Phase 3). The last 10 corrections per pillar now feed into
the prompt assembly so the model sees what was wrong last
time. A critic pass rates the hook/bridge/payoff of a draft
on demand. A photo-top template ships for photo-led slides.
The 9:16 Story frame is already supported in tokens
(`tiktok` aspect = 1080×1920); this phase documents and
exercises the path so a Story-as-post makes sense.

## User story

As the content engine, I need the model to **learn from every
correction the editor captures**, the editor to surface a
"score this post" action that rates the structural quality of a
draft, and the pillar configs to support a photo-top template
for photo-led stories — so that **repeat corrections of the
same kind visibly drop over a month of posting**.

## Acceptance criteria

### Corrections in prompts (the "learning loop")
- [ ] `tools/content-engine/src/generate/prompt.ts` — the
      `loadFewShot` helper returns, in addition to the approved
      examples, the last 10 `content_corrections` rows for the
      pillar (most recent first). Each correction is shown to
      the model as a `before → after` pair with the optional
      reason. Mock path returns an empty list (no real
      corrections in v1 of the mocks).
- [ ] `npm run check:generator` is extended: the prompt
      assembly runs end-to-end and the corrections slot is
      empty (mock). A new ad-hoc check `npm run check:prompts`
      prints the full prompt for a drinks-recipes brief and
      asserts the corrections section is present (even when
      empty) so the wire is exercised.
- [ ] `src/lib/ce-helpers.ts` — `loadCorrections(pillar, limit)`
      helper that reads from the `content_corrections` table.

### Critic pass
- [ ] `POST /api/ce/posts/:id/critic` — body: `{ pillar,
      current_doc }`. The model returns `{ hook: 0-10,
      bridges: 0-10, payoff: 0-10, weakest_slide: '<slide_id>',
      notes: string }`. v1 ships a stub that returns
      deterministic scores based on the doc's flag list (more
      flags = lower score). The UI flow is the same; the
      model is wired in v1.1.
- [ ] `src/app/(content-engine)/editor/[id]/page.tsx` — a
      "Score this post" button next to Save. On click, it
      calls the API and shows a modal with the three scores
      (rendered as coral bars) and the weakest slide.

### Photo-top template
- [ ] `tools/content-engine/src/schema/post.ts` — `photo-top`
      is already in the template enum. The fields it accepts
      (photo src, eyebrow, headline) are documented and
      enforced.
- [ ] `tools/content-engine/src/templates/photo-top.tsx` —
      photo-led slide. The photo is a `<img>` from
      `brand/icons/` placeholder (v1 takes a path; Phase 6.1
      wires Supabase Storage). Below the photo, an eyebrow +
      headline. The ground is paper by default.
- [ ] The pillar configs reference `photo-top` in their
      `templates` list where appropriate (origin-story, member-
      progress, books-members-read, passion-projects).

### 9:16 Story frames
- [ ] `tools/content-engine/brand/tokens.json` — the
      `instagram_vs_web_deltas.instagram` block gets a new
      line: "9:16 story frame: the same canvas as `tiktok`
      (1080×1920); use aspect='9:16' with platform='instagram'
      for an IG/FB Story. Phase 6 ships a check that an
      example Story post renders to 1080×1920 cleanly."
- [ ] `tools/content-engine/brand/examples/tiktok-workout-
      day5.json` is already 9:16; the renderer is the proof
      that the path works. No new example post is needed
      (the 9:16 path is exercised by the existing TikTok
      example).

### Out of scope

- Real Anthropic API call (still stubbed; v1.1 wires it).
  The corrections-in-prompts wire is ready, just waiting on
  a real model.
- Post performance import (needs Instagram Graph API
  access; v1.1).
- Per-member RLS (v1.1).
- Per-editor approval audit for icons / submissions
  (v1.1).
- Pillar calendar (deferred from Phase 3; still deferred).
- Real photo upload for photo-top (v1 takes paths;
  Supabase Storage in v1.1).

### Verification
- [ ] `npm run check:brand && npm run check:posts &&
  npm run check:renderer && npm run check:generator` all
  pass.
- [ ] `npm run build` is clean. The new routes appear:
  - `/api/ce/posts/:id/critic`
- [ ] Manual: in the editor, open a draft, click "Score this
  post", see the modal with the three scores and the weakest
  slide.
- [ ] Manual: render a photo-top post and confirm the
  template ships in the output.

### Test plan

- **Unit** — `loadCorrections` returns the last 10 in desc
  order, filtered by pillar.
- **Integration** — `npm run build` succeeds; the critic
  route returns deterministic scores for a draft with no
  flags (all 10s, weakest slide = null) and for a draft with
  N flags (lower scores, weakest slide = the first flagged
  one).
- **Manual** — the editor's Score button shows a modal with
  the three scores; the photo-top template renders cleanly
  via `render:examples` after adding one to a fresh draft.

## Shipped
- *(empty — Phase 6 is the next phase)*
