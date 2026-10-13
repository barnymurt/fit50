# Phase 7b — Brief-driven video creation

Phase 7's "Animate" button takes an already-written static
post and converts it to a video. That's the wrong shape: the
whole point of the animate repo is that the *user provides a
content idea* and the model (the animate skill's LLM) writes
the scenes, copy, visual style and voice. Phase 7b replaces
"Animate on an existing post" with **"New video from a brief"**:
the marketing team types an idea + message goal + the platforms
they want to post to; the engine generates the scenes, picks
the right aspect for each platform, runs the animate pipeline,
and lands the MP4s in the editor for review.

## User story

As the content engine, I need a "New video" form that takes
an idea + message goal + target platforms and produces a
finished MP4 for each platform, so that **the marketing team
can go from "I want to push a new workout on TikTok" to a
finished 9:16 MP4 with one form submit and one click** — the
animate skill handles the storyboard, the rendering, the
voice, the music, and the multi-format export.

## Acceptance criteria

### UI
- [ ] `/editor/new-video` — new editor page. Form: idea
  (textarea, required), message goal (radio: reach / saves /
  signups / link-clicks), target platforms (multi-checkbox:
  TikTok · Reels · Shorts · Facebook feed · Instagram feed).
  Submit button.
- [ ] On submit: a loading state ("Generating…") polls the
  server; the page redirects to `/editor/[id]` for the new
  post. The post's edit page shows the animation in progress
  (or ready) via the existing Animate modal.
- [ ] A "New video" link in the editor list page top bar,
  next to "New post" (the existing static-carousel flow).

### API
- [ ] `POST /api/ce/new-video` — body: `{ idea, message_goal,
  platforms }`. The server:
  1. Picks the dominant platform → aspect (TikTok / Reels /
     Shorts → 9:16; Instagram feed → 4:5; Facebook feed →
     1:1; default → 9:16).
  2. Creates a `content_posts` row with a `pillar:
     'animated-reel'` (new pillar config), `aspect`, `platform`,
     and a `source.brief = { idea, message_goal, platforms }`.
  3. Inserts a first `content_post_versions` row with a
     skeleton post (cover + 2-3 slides stub + cta) so the
     editor's existing fields render.
  4. Calls `runAnimation({ post, style, formats })` with
     formats derived from the platforms (one MP4 per platform,
     or all four for safety).
  5. On success, inserts a `content_animations` row with
     `status: 'ready'`. On failure, `status: 'failed'` + error.

### Pillar config (new)
- [ ] `brand/pillars/animated-reel.json` — slide pattern
  (cover + 1-3 content slides + cta) + voice rules (1
  line per slide, < 3 words/s) + format priority (9:16 first
  for vertical platforms).

### Verification
- [ ] `npm run build` clean.
- [ ] `npm run check:brand && npm run check:posts &&
  npm run check:renderer && npm run check:generator &&
  npm run check:prompts` all pass.
- [ ] Manual: visit /editor/new-video, type an idea like
  "New 5-minute Line B workout, fresh for the new cohort",
  pick "TikTok", submit. Land in the editor view for the
  new post. The Animate modal shows status: 'ready' with a
  9:16 MP4.

## UX/UI risks

- **Generation time** — the existing static-images-as-video
  path takes 30–60 s for one format. For 4 formats it's 2-4
  min. The form has a polling loader with status text. The
  user can navigate away and come back; the Animate modal
  re-checks status on mount.
- **Stubbed LLM** — the model that writes scenes, copy and
  voice is stubbed in v1 (the post's slides are the same
  as the existing static post). Phase 7.1 wires the real
  Anthropic call so the brief → scenes → voice flow is
  end-to-end LLM-driven.
- **Multi-platform aspect mismatch** — a single piece can
  be re-targeted to multiple aspect ratios by ffmpeg cropping
  + padding, but text positioned for 9:16 may clip in 1:1.
  v1 keeps the same composition and pads; 7.1 adds
  per-platform layout.

## Out of scope

- Real Anthropic call (still stubbed; 6.1 wires it).
- Voice-over generation (animate repo's tools/voice.mjs).
- Beat-mapped music.
- Storyboard check-ins (the animate skill's LLM-driven
  back-and-forth; 7.1).
- Per-platform text layout (text re-positioning per aspect).
- Multi-language voice synthesis.

## Test plan

- **Unit** — the platform → aspect mapping is correct
  (tiktok / reels / shorts → 9:16; instagram-feed → 4:5;
  facebook-feed → 1:1).
- **Integration** — the route spawns the animate pipeline and
  returns a post id; the editor view at /editor/[id] for the
  new post shows the Animate modal in 'ready' state.
- **Manual** — the end-to-end scenario above.

## Shipped
- *(empty — Phase 7b is the next phase)*
