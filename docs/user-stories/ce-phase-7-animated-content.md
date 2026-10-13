# Phase 7 — Animated content

The content engine already produces static PNG carousels
(Phase 1) and the brief → draft → corrections → critic pipeline
(Phases 2–6). The editor's "Animate" button extends the same
draft to a procedural MP4 in the user's chosen style, then
exports every format from one piece — 9:16 for TikTok /
Instagram Reels / YouTube Shorts, 1:1 and 4:5 for the IG feed,
16:9 for Facebook. The animate repo's tools (build.mjs,
export.mjs, voice.mjs) are wrapped as subprocesses; the editor
owns the piece directory and reads the output paths back into
`content_animations`.

## User story

As the content engine, I need an "Animate" action in the
editor that takes a static post and produces an MP4 in every
platform format from one piece, so that **the same brief that
produces a 4:5 carousel also produces a 9:16 TikTok / Reels /
Shorts video and a 1:1 / 16:9 Facebook cut, with one click, in
the same brand style** — without duplicating copy or re-cutting
the piece.

## Acceptance criteria

### Repo
- [ ] `tools/animate/` is the cth9191/animate repo (already
      cloned, depth 1, MIT). `.gitignore`d from the editor
      route's `tsconfig.json` exclude (already covered by the
      existing `tools/**` exclude).

### Data model
- [ ] `supabase/migrations/0054_content_animations.sql` creates
      `content_animations` (id, post_id, status ['idle' |
      'building' | 'ready' | 'failed'], piece_dir, formats jsonb,
      mp4_paths jsonb, frames_dir, error, created_at, updated_at).
      RLS enabled.

### API
- [ ] `POST /api/ce/posts/:id/animate` — body: `{ style: 'cut
      paper' | 'crosshatch' | 'riso' | 'sketchbook' | 'math' |
      'pixel' | 'isometric', formats: ['9:16','1:1','4:5','16:9'],
      voice?: { text: string }, music?: string }`. The server:
      1. Loads the post's current version's doc.
      2. Writes a `piece.json` under
         `tools/animate/pieces/<post_id>/piece.json` with the
         brief + the slides mapped to storyboard beats.
      3. Runs `node tools/animate/plugins/animate/skills/animate/tools/build.mjs <dir>`
         to assemble the index.html.
      4. Runs `node .../export.mjs <dir> --formats <list> --share`
         (with `--no-mux` skipped — we want the MP4).
      5. Polls the result; on success, inserts a
         `content_animations` row with the mp4 paths and
         `status: 'ready'`. On failure, sets `status: 'failed'`
         with the error message.
- [ ] `GET /api/ce/posts/:id/animation` — returns the most
      recent `content_animations` row for the post.
- [ ] `POST /api/ce/posts/:id/animation/cancel` — kills a
      running build (sends SIGTERM to the subprocess).

### Editor
- [ ] `src/app/(content-engine)/editor/[id]/page.tsx` — new
      "Animate" button next to Save / Score / Export. Opens a
      modal with: style picker, format checkboxes (default
      all four: 9:16, 1:1, 4:5, 16:9), optional voice / music
      fields. On submit, polls the API until status is
      'ready' or 'failed', then shows a video preview with
      platform tabs.
- [ ] Video preview uses a native `<video controls>` element
      (no third-party player). The four formats are tabs; the
      chosen tab is the source for the export zip.

### Export
- [ ] The existing `POST /api/ce/posts/:id/export` (Phase 3)
      picks up the latest `content_animations` row and bundles
      the MP4s alongside the PNGs. Each MP4 is named
      `FIT50_<id>_<format>.mp4` (e.g.
      `FIT50_drinks-cucumber-lime_9x16.mp4`).

### Verification
- [ ] `npm run build` clean.
- [ ] `npm run check:brand && npm run check:posts &&
  npm run check:renderer && npm run check:generator &&
  npm run check:prompts` all pass.
- [ ] Manual: in the editor, open the
  `drinks-cucumber-lime` post, click Animate, pick
  `cut paper` + all four formats, submit. After ~30 s the
  modal shows four video tabs. Click Export; the zip contains
  the 5 PNGs + 4 MP4s + caption.txt.
- [ ] Manual: open the same post in a browser at the piece
  URL (`file://.../tools/animate/pieces/<id>/index.html`) and
  verify the canvas renders.

## UX/UI risks

- **Build time** — a piece with 4 formats is 30–60 s on
  local hardware. The editor shows a spinner + status text
  ("building… → muxing… → done"). Failure surfaces the
  error in the modal.
- **Storage** — the rendered MP4s land under
  `tools/animate/pieces/<id>/renders/`. v1 doesn't push them
  to Supabase Storage; the editor's "Export" reads them from
  disk. Phase 7.1 adds Supabase Storage + a CDN.
- **FFmpeg dependency** — the animate repo's build / export
  requires ffmpeg on PATH. The story's test plan will surface
  this; v1 assumes ffmpeg is installed.
- **Style prompts** — the model isn't asked to write
  style-specific code in v1; the post's existing cover/headline
  copy is the "look" the animate repo renders. Phase 7.1
  adds a brief field for the LLM to write style-specific copy.

## Out of scope

- Voice-over generation (the animate repo's tools/voice.mjs
  is wired but the editor doesn't surface the UI in v1).
- Beat-mapped music (same — the data structure is there, the
  UI ships in 7.1).
- Storyboard check-ins (the LLM-driven back-and-forth from
  the animate skill's README). The editor's "Animate" is
  one-click in v1; storyboard iterations are a 7.1 feature.
- Supabase Storage for the rendered MP4s.
- CDN-cached playback links.
- Per-platform caption generation (TikTok vs IG Reels have
  different safe areas). The renderer uses the post's
  `caption.text` as a single source; per-platform tuning is
  7.1.

## Test plan

- **Unit** — `runAllChecks` runs on the new piece.json shape
  (it's just a JSON; the existing schema doesn't touch it).
- **Integration** — the route spawns the subprocess and
  reads the result; a mock-friendly interface (`getSpawnedResult()`)
  makes the script testable without ffmpeg.
- **Manual** — the end-to-end scenario above.

## Shipped
- *(empty — Phase 7 is the next phase)*
