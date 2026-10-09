# Phase 3 — Editor

The editor is where the post goes from "valid draft" to "ready
to ship". Click any field on any slide to edit it. Every save
creates a new version. When a human rewrites a field the AI
wrote, the before/after pair is captured so Phase 6's learning
loop has examples to draw from. A Rewrite button on any field
calls the small model for three options; you pick one or keep
yours. The export is the same render path Phase 1 built, plus a
zip with numbered PNGs and the caption.

## User story

As the content engine, I need an editor where I can load a
draft, edit any field by hand, see who wrote what (and lock the
ones I want to keep), undo mistakes through a version history,
capture the corrections that teach the next model call, optionally
ask the small model to rewrite a single field, and export to
PNG + caption + zip — so that **the only AI calls are the ones
I press, and every edit is reversible and auditable**.

## Acceptance criteria

### Data model (Supabase, namespaced `content_*`)
- [ ] `supabase/migrations/0051_content_engine.sql` creates:
      - `content_posts` (id, current_version_id, pillar, status,
        brief, aspect, platform, marquee, source, last_rendered_at,
        created_at, updated_at) — one row per post.
      - `content_post_versions` (id, post_id, version, doc jsonb,
        saved_by, note, created_at) — full history.
      - `content_corrections` (id, post_id, version_id, field_path,
        pillar, before jsonb, after jsonb, reason, created_at) —
        before/after pairs with an optional reason.
      - `content_generations` (id, post_id, kind, model,
        tokens_in, tokens_out, est_cost_usd, passed_checks,
        elapsed_ms, created_at) — moved from
        `out/generations.jsonl` to the DB.
- [ ] RLS: editor-only (one env-var password for v1; full auth
      deferred). The migration enables RLS and grants the
      service role full access.
- [ ] `npm run verify:supabase` passes (no broken migrations).

### API routes (under `src/app/api/ce/...`)
- [ ] `GET  /api/ce/posts` — list all posts (id, pillar, status,
      brief, last_rendered_at, updated_at). Supports
      `?status=draft|review|approved|exported`.
- [ ] `POST /api/ce/posts` — create a new post. Body: pillar,
      brief, aspect, platform, marquee, source. The first
      version is row 1 of post_versions.
- [ ] `GET  /api/ce/posts/:id` — get a post with its current
      version's doc.
- [ ] `POST /api/ce/posts/:id` — save a new version. Body: the
      full post JSON. Server validates against the Zod schema,
      runs `runAllChecks` (Phase 1), creates a new
      post_version row, updates `content_posts.current_version_id`.
      If checks fail, returns 422 with the flag list; the
      client surfaces them in the editor.
- [ ] `POST /api/ce/posts/:id/fields/:fieldPath/lock` — toggle a
      field's lock. Body: `{locked: boolean}`. Updates the
      current version's doc.
- [ ] `POST /api/ce/posts/:id/fields/:fieldPath/rewrite` — call
      the small model (Phase 6 wires Anthropic; Phase 3 ships
      a stub that returns 3 deterministic variants from the
      field's text + the brief). Returns `{options: string[]}`.
- [ ] `POST /api/ce/posts/:id/captures` — record a before/after
      pair. Body: `{field_path, before, after, reason}`. Server
      inserts a content_corrections row.
- [ ] `GET  /api/ce/posts/:id/versions` — list version history
      (id, version, saved_by, note, created_at).
- [ ] `POST /api/ce/posts/:id/revert` — body: `{version_id}`.
      Server copies that version's doc into a new current
      version, increments version number.
- [ ] `POST /api/ce/posts/:id/export` — render to PNGs (Phase 1
      path) + caption.txt + zip. Body: optional
      `{version_id}` (default: current). Returns
      `{zip_base64}`.
- [ ] `GET  /api/ce/generations` — list generation log
      (paginated, descending by created_at). Mirrors what
      was in the file-based log.

### Editor UI (route group `src/app/(content-engine)/editor/`)
- [ ] `/editor` — list page. Table of posts (id, pillar,
      status, brief, last_rendered_at). Filterable by status.
      New-post button → opens a brief form.
- [ ] `/editor/[id]` — 3-pane editor:
      - **Slide strip (left, 200px)**: thumbnail per slide,
        current slide highlighted, drag to reorder, click to
        select. The current slide's ground colours the strip
        background.
      - **Canvas (centre, fills)**: the same React components
        Phase 1's renderer uses, drawn at 540×675 (half-size
        preview). Click any text node to edit in place. The
        italic toggle button (Cmd+I) wraps the selection in
        `*…*` (the renderer's `emphasis()` regex turns this into
        `<em>` at export time).
      - **Properties (right, 320px)**: template selector
        (limited to templates allowed for this pillar ×
        platform), ground picker (filtered to legal next-
        neighbour grounds), icon picker, and a list of the
        current slide's fields. Each field shows: who wrote it
        (ai | human), a lock toggle, a Rewrite button, any
        flags. Below the field list: a "Save" button (creates a
        new version), a "Capture correction" button (records
        the before/after), a "Reset to current" button.
- [ ] **Version history (right pane, below properties)**:
      timeline of versions (most recent on top). Each entry:
      version, saved_by, note, timestamp. "View" loads the doc
      read-only into the canvas. "Revert" creates a new version
      from that one.
- [ ] **Top bar**: post id, pillar, aspect, status badge, Save
      button, Export button (calls the export route, downloads
      the zip).

### Rewrite flow
- [ ] Click Rewrite on a field → modal with 3 options, each in
  its own row with a "Use this" button. The first option is
  the field's current text. The other two are model outputs.
- [ ] "Use this" replaces the field, marks it `by: 'human'`,
  captures the before/after pair (with reason if provided).
- [ ] Modal shows a free-text reason field. The reason goes
  into content_corrections.reason and feeds Phase 6's
  prompt assembly.

### Export flow
- [ ] Export button calls POST /api/ce/posts/:id/export, gets
  `{zip_base64}`, decodes, and triggers a browser download of
  `FIT50_<id>.zip`. The zip contains:
  - `FIT50_<id>_01.png` … `FIT50_<id>_0N.png` (numbered in
    upload order)
  - `FIT50_<id>_caption.txt`
- [ ] The export is the same render path Phase 1 uses. No
  separate code path.

### Auth gate (no Supabase auth, v1)
- [ ] `src/app/(content-engine)/editor/layout.tsx` checks
  `process.env.EDITOR_PASSWORD` (or reads a cookie set on a
  simple sign-in form). If unset, the editor shows a 1-field
  password form. If set, the cookie must match. No cookies on
  the public FIT50 app.

### Tests
- [ ] `npm run check:brand && npm run check:posts && npm run
  check:renderer && npm run check:generator` still pass.
- [ ] `npm run build` is clean. The new pages appear in the
  build output under `/(content-engine)/editor/...`.
- [ ] Manual: visit /editor, log in with the env-var password,
  load a draft, edit a field, save (creates a new version),
  capture a correction, run Rewrite on a field, export the
  zip, verify the PNGs match the example posts' design.

## UX/UI risks

- **Editor scope creep** — the spec lists a lot. This story
  ships the core: edit / save / version / lock / correction /
  rewrite / export. The pillar calendar is deferred to a
  later pass. Real-time collaboration is out of scope for v1
  (single editor only).
- **Click-to-edit on the canvas** — the canvas re-renders on
  every keystroke. We use a debounced save (300ms) so the
  canvas doesn't lag. The save is a single POST that
  creates one new version; no autosave storms.
- **Rewrite model stub** — Phase 3 doesn't wire the real
  Anthropic call. The stub returns 3 deterministic variants
  by mutating the field's current text (e.g. "X", "X.", "X
  — the sharper version"). The UI flow is the same; the
  model swaps in Phase 6.
- **Correction capture** — only the *first* edit of a
  field's current draft triggers a capture prompt. Subsequent
  edits on the same draft don't re-prompt (we'd capture
  every keystroke otherwise). The pair is stored against the
  current version_id, not the field, so the timeline is
  auditable.
- **Auth** — env-var password is fine for v1. Phase 6
  swaps in Supabase auth + a single editor user.
- **Zip download size** — the zip is base64 in the response.
  5 PNGs at 1080×1350 is ~700 KB; the base64 string is ~1
  MB. Fine for v1. If posts grow, Phase 6 switches to a
  streamed download.

## Out of scope

- Pillar calendar (deferred — Phase 3 v1 doesn't ship it;
  the list page filters by status instead).
- Real-time multi-user editing.
- Story-frame (9:16) layout for the canvas preview (the
  editor renders 4:5 only for the preview; the renderer
  produces 9:16 from the same data when exporting).
- Auto-publishing, scheduling, reels, multi-brand.
- Full Supabase auth.
- Prompt cache wiring on the real Anthropic call.

## Test plan

- **Unit** — Zod schema is unchanged from Phase 1. The
  new API routes use the same schema.
- **Integration** — the migration runs cleanly, RLS works,
  the editor flow above completes end to end.
- **Manual** — the manual test in the Acceptance criteria
  section.

## Shipped
- *(empty — Phase 3 is the next phase)*
