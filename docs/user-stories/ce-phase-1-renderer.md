# Phase 1 — Renderer

The renderer turns a post JSON into a PNG carousel. It uses the
same React components the editor will use to draw the canvas, so
what you see in the editor is exactly what exports. Every slide is
re-measured on every draw — fit, overflow and orphaned last words
are flagged, never cut off. Runs without credits.

## User story

As the content engine, I need a renderer that takes a post JSON
from `brand/examples/` and produces a PNG carousel for either
platform (Instagram 4:5, Facebook 4:5 re-export, TikTok 9:16) by
rendering the same React components the editor will use, so that
**every check from the brand folder runs at draw time and the
output matches the design system exactly**.

## Acceptance criteria

### Post schema (Zod)
- [ ] `tools/content-engine/src/schema/post.ts` exports a Zod schema
      that validates a post JSON against: id, type, platform,
      aspect, pillar, brief, version, marquee, source, slides[],
      caption, checks.
- [ ] The schema is the same one handed to the model in Phase 2 as
      its output format.
- [ ] `tools/content-engine/scripts/validate-posts.mjs` validates
      every JSON in `brand/examples/` against the schema and exits
      non-zero on failure.

### Templates (React + plain CSS, no Tailwind for these)
- [ ] `tools/content-engine/src/templates/cover.tsx` — eyebrow,
      headline (with `*emphasis*` rendered as `<em>`), sub.
- [ ] `tools/content-engine/src/templates/statement.tsx` — eyebrow,
      headline, body, bridge.
- [ ] `tools/content-engine/src/templates/list.tsx` — eyebrow,
      headline, 3–5 items (title + optional detail + icon), bridge.
- [ ] `tools/content-engine/src/templates/numeral.tsx` — eyebrow,
      number, body.
- [ ] `tools/content-engine/src/templates/icon-card.tsx` — icon,
      title, body.
- [ ] `tools/content-engine/src/templates/cta.tsx` — eyebrow,
      headline, body, button. No marquee.
- [ ] `tools/content-engine/src/templates/workout-line.tsx` — the
      giant Fraunces letter (A–D), the 5 exercises, the finisher.
- [ ] Each template accepts a `ground` prop and reads the
      correct text colour from `tokens.json#/ground_pairs`.
- [ ] Each template accepts an `aspect` prop ("4:5" or "9:16")
      and reads the right type scale from
      `tokens.json#/type_scale/<aspect>`.
- [ ] The marquee band is rendered by a single shared component
      (`Marquee.tsx`) used by every template except `cta`.

### Renderer
- [ ] `tools/content-engine/src/render/render-post.ts` takes a post
      JSON, an output dir, and produces numbered PNGs.
- [ ] `tools/content-engine/src/render/draw-canvas.ts` renders one
      slide at the right canvas size (1080×1350 or 1080×1920) at
      2× device pixel ratio.
- [ ] The renderer waits for `document.fonts.ready` before any
      screenshot. Fraunces, Inter and Lilita One are loaded from
      the `@fontsource/*` packages.
- [ ] `text-wrap: balance` for headlines, `text-wrap: pretty` for
      body text.

### Export (Playwright)
- [ ] `tools/content-engine/src/render/export.ts` launches a
      headless Chromium, mounts the canvas, screenshots each slide,
      writes `FIT50_<id>_01.png` … `FIT50_<id>_0N.png` plus a
      `caption.txt` with the caption body and hashtags.
- [ ] `npm run render -- examples/ig-drinks-hibiscus.json` outputs
      5 PNGs + caption.txt in `tools/content-engine/out/`.
- [ ] `npm run render -- examples/tiktok-workout-day5.json` outputs
      5 PNGs in 9:16.
- [ ] One browser instance is kept warm between renders so a
      5-slide post takes < 5 s after the first.

### Checks (run at draw time, no credits)
- [ ] `tools/content-engine/src/checks/ground-sequence.ts` — no two
      adjacent slides share a ground.
- [ ] `tools/content-engine/src/checks/text-colour.ts` — text
      colour matches the ground per `tokens.json#/ground_pairs`.
- [ ] `tools/content-engine/src/checks/coral-once.ts` — coral used
      at most once per slide.
- [ ] `tools/content-engine/src/checks/fit.ts` — measures every
      text node after layout; flags any overflow and any
      one-word last line.
- [ ] `tools/content-engine/src/checks/marquee-fit.ts` — measured
      width of the marquee ≤ canvas width − 2 × padding.
- [ ] All checks emit a list of `{slideId, field, message}` flags
      that the future editor can show next to the offending field.

### Verification
- [ ] `npm run check:brand` still passes (no regression).
- [ ] `npm run check:renderer` runs all five checks against both
      example posts, exits 0, no flags.
- [ ] `npm run render:examples` produces both carousels.
- [ ] A deliberately long headline in a one-off test post is
      **flagged**, not cut off.

## UX/UI risks

- **Fonts** — Chromium doesn't have Fraunces or Lilita One by
  default. Bundling via `@fontsource/*` is the spec's answer. If
  `document.fonts.ready` resolves before the WOFF2 is in the
  document, the screenshot will be Georgia. The renderer waits
  explicitly before every screenshot and the check phase asserts
  the loaded family names match.
- **Text wrap** — `text-wrap: balance` is supported in Chromium
  114+. The default is a 2× device pixel ratio, so wrap is
  measured at the export resolution, not at the editor's CSS
  zoom.
- **Coral on teal** — the spec's first hand-built slide hit this.
  The colour-pair table in `tokens.json` already names the
  contrast risk; the check just enforces it.
- **Marquee line wrap** — the spec measures marquee lines in
  `tokens.json#/marquee_lines` against the actual font load.
  Phase 0 shipped three lines; the renderer trusts those
  measurements and rejects unknown lines.
- **Empty / loading** — the renderer's headless context is
  non-interactive. The marquee renders statically (per the
  spec). No animations.
- **Edge of the data model** — every field on every template
  is optional in the schema, but the design rules assume a
  non-empty value. A field that arrives empty is rendered as a
  blank space, not a placeholder.
- **Design system fit** — only the 6 colours, only the 3 type
  faces, only the fixed type scale. The renderer is the
  enforcer; if a template tries to add a colour or a font, the
  design check fails.
- **Accessibility** — the renderer is for export, not screen
  readers. The editor (Phase 3) is the one that needs the
  aria labels.

## Out of scope

- Editor UI (Phase 3).
- Brief → outline → draft (Phase 2).
- Member submissions (Phase 4).
- Icon style-locked generation (Phase 5).
- Correction loop (Phase 6).
- Auto-publishing, scheduling, reels, multi-brand — never in v1.
- Conversion of the 9 webp icons to SVG. Phase 0 ships webp;
  Phase 1's renderer loads them as `<img>`. Recolouring by
  ground is a Phase 5 task. The webp icons sit on grounds that
  already work; cream / lavender / paper get the webp
  unchanged, ink / teal will get SVG recolour in Phase 5.

## Test plan

- **Unit** — each template renders to a string of HTML at the
  right canvas size for its aspect. The check functions return
  the right shape (`{slideId, field, message}[]`).
- **Integration** — `npm run render:examples` produces 10 PNGs
  (5 IG, 5 TikTok) and 2 caption.txt files. The PNGs are
  inspected by hand against the spec (fonts, marquee, ground
  sequence, text colour, coral-once).
- **Adversarial** — a one-off test post with a 200-character
  headline is rendered; the fit check flags it. The post is
  thrown away after the test.
- **Regression** — `npm run check:brand && npm run build`
  passes after the renderer lands.

## Shipped
- *(empty — Phase 1 is the next phase)*
