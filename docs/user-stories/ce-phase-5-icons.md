# Phase 5 — Icons

The 9 habit icons reused from the live app are webp. The
renderer loads them as `<img>` and the ground-based recolouring
in Phase 0 only works on grounds that are already cream-on-paper
or similar (the icons don't recolour on ink / teal). Phase 5
moves the originals to SVG so the renderer can recolour them
on any ground, and lays the data model and approval flow for new
icons.

## User story

As the content engine, I need the 9 habit icons available as
SVG (so the renderer can recolour them on every ground), and a
data model + approval flow for adding new icons — so that
**icon library search returns the right icon, the renderer
recolours correctly, and any new icon goes through an
approval flow before it enters the library**.

## Acceptance criteria

### SVG conversion of the 9 originals
- [ ] `tools/content-engine/brand/icons/*.svg` — hand-authored
      SVG versions of the 9 habit icons. Each uses
      `currentColor` for the stroke and fill, so the renderer
      sets `color` to the appropriate ink/paper value per
      ground. The shapes are minimal but recognisable — ice
      cubes, book stack, lungs, fuel pump, runner, brain,
      feet, lips with straw, sparkles for chill-out.
- [ ] `brand/icons/manifest.json` extended with a `svg_path`
      field per icon (alongside the existing webp `files`).
- [ ] The webp files stay on disk as a fallback. The renderer
      prefers SVG when present.

### Renderer: currentColor recolouring
- [ ] `tools/content-engine/src/templates/cover.tsx`,
      `statement.tsx`, `list.tsx`, `numeral.tsx`, `icon-card.tsx`,
      and `workout-line.tsx` all render the icon as inline SVG
      when an SVG is available. The currentColor pattern is
      `color: tokens.colours.ink` for ink-text grounds
      (paper, lavender, white, cream) and
      `color: tokens.colours.paper` for paper-text grounds
      (ink, teal).
- [ ] The editor's preview (src/app/(content-engine)/editor/
      [id]/page.tsx) also recolours icons by ground.

### Library search + approval data model
- [ ] `supabase/migrations/0053_content_icons.sql` creates
      `content_icons` (id, tags text[], description, source
      ['live-app' | 'generated'], approval_status
      ['pending' | 'approved' | 'rejected'], svg_path, png_path,
      created_at, approved_at). Approved icons are the
      renderer-visible library; pending and rejected icons are
      draft state.
- [ ] The 9 originals are inserted into `content_icons` with
      approval_status='approved' as part of the seed.

### API routes
- [ ] `GET  /api/ce/icons` — list approved icons. Supports
      `?q=lemon` (search by tag / description) and
      `?tag=citrus`.
- [ ] `GET  /api/ce/icons/:id` — get a single icon (returns
      the SVG content as text).
- [ ] `POST /api/ce/icons` — add a candidate icon. Body: tags,
      description, svg. Status defaults to 'pending'. v1 doesn't
      generate candidates automatically; the API is wired for
      Phase 6's real generation step.
- [ ] `POST /api/ce/icons/:id/approve` — set status to
      'approved'. The icon enters the library and is selectable
      in the editor's icon picker.
- [ ] `POST /api/ce/icons/:id/reject` — set status to
      'rejected'. The icon never enters the library.

### Editor: icon approval queue
- [ ] `/editor/icons` — table of icons (id, description,
      tags, source, approval_status, created_at). Filter by
      status. Each row links to the SVG preview and has
      Approve / Reject buttons (when pending).
- [ ] `/editor/icons/[id]` — full SVG preview at 200px with
      the background swap test (paper, teal, lavender, ink,
      white, cream) so the editor can confirm the icon
      recolours cleanly on every ground.

### Verification
- [ ] `npm run build` is clean.
- [ ] `npm run check:brand && npm run check:posts && npm run
  check:renderer && npm run check:generator` all pass.
- [ ] Manual: render the two example posts (`render:examples`).
  The PNGs show the icons recoloured correctly on every ground
  (paper, teal, lavender, ink, white, cream). Specifically:
  the list items' icons (wet-lips, fresh-lungs) on the
  lavender slide are now visible, the move-body icon on
  the teal slide is paper-coloured, etc.
- [ ] Manual: visit /editor/icons, confirm 9 approved icons
  show up, the SVG preview works, recolouring is correct.

## UX/UI risks

- **SVG quality** — hand-authoring 9 SVGs is a real
  authoring job. The shapes are minimal (the renderer scales
  them to 140–220px so detail is forgiving) but they need to
  read as the right subject. v1 ships the minimum that
  passes the recolour check; Phase 5.1 (or Phase 6) can
  replace any with traced versions from the original webps.
- **Recraft API** — the spec mentions Recraft as the
  generation source. v1 doesn't wire it; the candidate-icon
  endpoint is stubbed. Phase 6 picks this up.
- **Collab vs single-editor** — v1 is single-editor, like
  Phase 3. The approval queue is a single-user flow. Phase 6
  adds per-editor audit.
- **Webp fallback** — if an SVG is missing for an icon, the
  renderer falls back to the webp (which works on cream /
  lavender / paper / white only). The icon-card template in
  particular should still look acceptable on any ground.

## Out of scope

- Real Recraft integration for candidate generation.
- Auto-tracing of webp → SVG (Phase 5.1 / Phase 6).
- Icon upload via Supabase Storage (v1 stores SVGs in
  `tools/content-engine/brand/icons/` in git).
- Per-editor approval audit.
- Icon usage analytics (which icons are most used in
  approved posts).

## Test plan

- **Unit** — the renderer's icon component accepts an `svg`
  prop and renders the inline SVG with the currentColor
  pattern.
- **Integration** — `npm run build` succeeds, the new routes
  appear in the route table, the example posts render
  cleanly.
- **Manual** — the two example posts render with icons
  visible on every ground. The /editor/icons page shows the
  9 approved icons. The SVG preview at /editor/icons/[id]
  shows the icon recoloured on every ground.

## Shipped
- *(empty — Phase 5 is the next phase)*
