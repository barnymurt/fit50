# Phase 0 — Brand kit and libraries

The content engine's `brand/` folder is the single source of truth
for everything it produces. The renderer, the generator, the editor
and the icon pipeline all read from it, so a change made once
(colour rule, banned phrase, new rule name) applies everywhere.

This story builds the folder from scratch. No code is shipped; no
schema, no templates, no rendering. Just the data the rest of the
engine will read.

## User story

As the FIT50 content engine, I need a complete, versioned
`brand/` folder I can read from, so that every later phase
(renderer, generator, editor) pulls colours, facts, voice,
libraries, pillar configs and icons from a single source — not
from code, prompt, or memory.

## Acceptance criteria

### `brand/tokens.json`
- [ ] Colours from the design system: `ink`, `paper`, `coral`,
      `teal`, `cream`, `lavender`, plus `white` and `rule` for
      borders.
- [ ] Fonts: Fraunces (display), Inter (body), Lilita One
      (marquee) — each as a woff2 path under `brand/fonts/`.
- [ ] Type sizes for the 1080×1350 canvas: caption / eyebrow
      `26px`, body, sub, headline scale, numerals, marquee
      `61px` (the spec's Instagram-vs-web delta from the
      `Lilita One minimum` row).
- [ ] Type sizes for the 1080×1920 canvas (TikTok), with the
      same token names — no separate "tiktok-" prefix; the
      renderer reads the same file.
- [ ] Approved marquee lines (≥ 3) with measured pixel widths
      ≤ 1080 minus padding. New lines are only accepted if they
      fit.
- [ ] The Instagram-vs-web deltas (caption 12→26, marquee 80→61,
      etc.) documented inline so the next session doesn't
      re-derive them.

### `brand/facts.json`
- [ ] The nine habit / rule names, exactly:
      Move Your Body, Step It Up, Wet The Lips, Fuel Right,
      Chill Out, Feed Your Brain, Open Mind, Crispy Clarity,
      Fresh Lungs.
- [ ] Targets: 10,000 steps, 2.5 L water, 10 min chill-out,
      5 books or 30 minutes a day (Feed Your Brain).
- [ ] Pricing: €5.99 toolkit, €5.99 buddy add-on, €9.99 pair at
      checkout.
- [ ] Resource names (e.g. "the 40 quit-smoking services" list,
      "the 50 drinks recipes") — referenced by id, not inlined.
- [ ] British spellings: litres, colour, programme, maths.
- [ ] No invented numbers. Every value comes from the live FIT50
      app or the AGENTS.md design contract.

### `brand/voice.md`
- [ ] Eight voice rules per the spec:
      1. Short imperatives, second person, no hedging, full
         stops where you'd expect exclamation marks.
      2. Headlines are two clauses; the emphasis phrase is
         set in italic (marked `*like this*` in the data).
      3. Origin story is first person as Barny — self-
         deprecating, specific, daft.
      4. British spellings.
      5. "Passion project" not "finished thing". Rule names
         exact.
      6. Explainer posts don't compare FIT50 to 75 Hard; the
         origin story may.
      7. Feed posts don't show the price (link-in-bio /
         Stories / DMs only).
      8. Carousel structure: hook → bridge → payoff; one
         bridge per middle slide; one CTA on the last slide.
- [ ] "Congratulate briefly or not at all. 'Done. Well
      executed.' is the ceiling."
- [ ] Short enough to read in full every prompt — under 400
      lines.

### `brand/voice-lint.json`
- [ ] Banned characters: no `!`, no emoji on slides.
- [ ] Banned phrases (initial set, extendable): "unlock your
      potential", "game-changer", "journey", "transform".
- [ ] Word limits per field per template — see the spec's
      template table.
- [ ] Required bridge on every middle slide.
- [ ] Exactly one CTA per post.
- [ ] One file, valid JSON, machine-checkable, no prose.

### `brand/libraries/`
- [ ] `drinks.json` — 50 recipes. Each recipe: `id`, `name`,
      `tag` ("Zero proof · 2 minutes"), `glass`,
      `ingredients[]` (`quantity` + `item` + `icon`),
      `method[]` (up to 4 steps), `garnish`. Metric units.
- [ ] `workouts.json` — lines A–D. Each line: `letter`,
      `exercises[]` (5 items, each `name` + `sets` + `reps`),
      `finisher` (optional). Plus `kb_variants` and
      `band_variants` for premium users.
- [ ] `story-bank.md` — 5–8 origin story episodes. First-
      person Barny voice. Specific scenes ("the Woolies
      basket", "Like an idiot", "three beers later"). The
      one pillar that may mention 75 Hard.
- [ ] `quit-resources.json` — 40 cessation services. Each:
      `id`, `name`, `country`, `type` (phone / chat / app /
      in-person), `url`, `last_checked` (ISO date). Monthly
      link check lives in Phase 5; this file is the seed.

### `brand/pillars/` (8 files)
- [ ] `drinks-recipes.json` — sources: `libraries/drinks.json`.
      Templates: `recipe`, `cover`, `cta`. Extra rule:
      quantities come from the library, never invented.
- [ ] `workouts.json` — sources: `libraries/workouts.json`.
      Templates: `workout-line`, `list`, `cover`. Extra rule:
      exercise names and reps exactly as on the site; no
      injury or medical claims.
- [ ] `origin-story.json` — sources: `libraries/story-bank.md`.
      Templates: `cover`, `statement`, `photo-top`. Extra
      rule: first person as Barny; only episodes in the bank.
- [ ] `quit-smoking.json` — sources:
      `libraries/quit-resources.json`. Templates: `list`,
      `statement`, `cta`. Extra rule: supportive never
      shaming; no health-outcome claims.
- [ ] `member-progress.json` — sources: approved member
      submissions. Templates: `before-after`, `quote`,
      `statement`. Extra rule: consent on file before
      generation; show habits + streak + how they feel, not
      only the body.
- [ ] `books-members-read.json` — sources: submissions +
      book metadata. Templates: `book-card`, `list`. Extra
      rule: at most one short attributed line from the book,
      never long passages.
- [ ] `passion-projects.json` — sources: submissions. Templates:
      `project-timeline`, `photo-top`, `statement`. Extra rule:
      milestones and dates from the submission only.
- [ ] `challenge-explainers.json` — sources: `facts.json`.
      Templates: `cover`, `list`, `statement`, `cta`. Extra
      rule: no price in feed posts.

### `brand/icons/`
- [ ] `STYLE.md` — house style: black ink on white, no colour
      or grey fills, thick wobbly outer contour, thinner inner
      lines, sparse hatching, one subject centred, no text,
      occasional energy marks, occasional enclosing circle.
- [ ] `manifest.json` — 9 entries for the 9 habit icons. Each:
      `id`, `tags[]`, `description`, `source` ("live-app"),
      `approval_status` ("approved"). Reused from the live
      app's `public/icons/`.
- [ ] The 9 SVG files copied from the live app, each at
      ≥ 140px on the 1080 canvas.

### `brand/examples/`
- [ ] `ig-drinks-hibiscus.json` — Instagram 4:5 carousel for a
      hibiscus iced tea. Five slides. Every field's
      quantities / names / numbers cross-referenced with
      `facts.json` and `libraries/drinks.json`. No invented
      values.
- [ ] `tiktok-workout-day5.json` — TikTok 9:16 carousel for
      a day-5 workout. Five slides. Same validation. Recipe
      of the form: hook slide, three exercise slides, one
      CTA slide.

### `brand/fonts/`
- [ ] Fraunces, Inter, Lilita One — installed via the
      `@fontsource/*` npm packages; renderer-side only.
      Verifiable by a one-line `node -e` check that prints
      the loaded family names.

## UX/UI risks

- **Type sizes** — the spec gives Instagram numbers (caption
  26px, marquee 61px) but no TikTok numbers. TikTok sizing
  is derived from the 4:5 numbers using the 9:16 aspect
  ratio. Lock preference now if you have one.
- **Icon copying** — the live app's `public/icons/` are PNGs.
  Phase 0 ships the PNGs as-is. Phase 5 converts them to SVG
  with potrace so the renderer can recolour by ground.
- **Drinks library** — 50 recipes is a real authoring job.
  The "hand-author from the live app" decision means the
  live app's food data is re-authored in a recipe-shaped
  format. This is the bottleneck of Phase 0.
- **Banned phrases** — the initial set in voice-lint.json is
  not exhaustive. The first few real posts will add to it;
  Phase 6's learning loop formalises that.
- **Marquee widths** — the 3 approved lines need their
  pixel widths measured against the actual font load. Done
  in Phase 0 with a Playwright probe (read-only at this
  point), even though the renderer is Phase 1.

## Out of scope

- Schema (Zod) — Phase 1.
- Template React components — Phase 1.
- Playwright render pipeline — Phase 1.
- Brief → outline → draft — Phase 2.
- Editor UI — Phase 3.
- Supabase tables for posts / versions / corrections —
  Phase 3.
- Member submissions flow — Phase 4.
- Icon style-locked generation — Phase 5.
- Critique pass and corrections-in-prompts — Phase 6.
- Auto-publishing, scheduling, reels, multi-brand — never
  in v1.

## Test plan

- **Schema smoke** — a one-page `node` script (no test
  framework) loads each `*.json` in `brand/` and asserts it
  parses. Lives in `tools/content-engine/scripts/`.
- **Cross-reference check** — the script also asserts every
  rule name in the two example posts appears in
  `facts.json`; every quantity in `ig-drinks-hibiscus.json`
  appears in `libraries/drinks.json`.
- **No invented numbers** — the script greps every numeric
  value in the example posts and fails if it isn't in
  `facts.json` or the matching library.
- **Voice-lint smoke** — the script loads
  `voice-lint.json`, runs it against both example posts, and
  asserts no `!`, no emoji, all fields under their limits,
  required bridges present, exactly one CTA.
- **Font load** — a separate script loads the three
  `@fontsource` packages, calls `document.fonts.ready` in
  JSDOM, and asserts each family is registered.
- **Visual by hand** — open both example JSON files and
  walk through every slide. No invented numbers, no
  on-brand violations, no copy that doesn't fit the voice.

## Shipped

- *(empty — Phase 0 is the first phase)*
