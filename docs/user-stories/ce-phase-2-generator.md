# Phase 2 — Generator

The generator turns a one-line brief into a finished post JSON.
Three model calls in sequence — outline, draft, one retry — all
gated by the same check pipeline Phase 1 already runs. The
generator is the only place in the engine that spends credits.
Every step is logged so the next session can see where the money
went.

## User story

As the content engine, I need a generator that takes a brief
(pillar, goal, message, slide count, call to action, must-include
facts) and produces a finished post JSON that passes every check,
so that **one brief per library-backed pillar produces a draft I'd
post after light edits** — and the model never invents facts,
never breaks the brand voice, and never spends more than one
retry on a bad draft.

## Acceptance criteria

### Prompt assembly (in stable order, cacheable)
- [ ] `tools/content-engine/src/generate/prompt.ts` builds the
      prompt in the order the spec demands:
      1. `voice.md` + the per-template field limits
      2. `facts.json` (only the facts the pillar needs)
      3. 3–5 approved posts from the same pillar (Phase 0 ships
         two — the engine uses what's there; Phase 6 grows the
         bank from approved outputs)
      4. The brief or the approved outline
      5. The Zod schema as the model's structured output format
- [ ] Cache-friendly: the first four parts are the same for every
      call in a session; only the brief changes per call.

### Brief
- [ ] `tools/content-engine/src/schema/brief.ts` (Zod): pillar
      (string), goal ('reach' | 'saves' | 'link-clicks'), message
      (string), slide_count (3–7), call_to_action ('link-in-bio' |
      'comment-keyword'), must_include_facts (string[]), aspect
      ('4:5' | '9:16').

### Generation flow
- [ ] `tools/content-engine/src/generate/run.ts` exports
      `generatePost(brief)`. Three steps:
      1. **Outline** — cheap model call, returns one line per
         slide: `{template, ground, job}`. Pillar rules applied.
         If outline fails schema validation, retry once with the
         error appended.
      2. **Draft** — model fills every field of the approved
         outline. Pillar templates and field limits in the prompt.
         The model returns JSON that matches the post schema.
      3. **Checks** — `runAllChecks(post, tokens)` from Phase 1.
         Pass → return the post. Fail → one targeted retry that
         sends only the failing fields and the error messages.
         Whatever still fails after one retry is returned with
         the `checks.*` set to "fail" and a `flags` array
         listing what tripped.
- [ ] No loop. One retry per generation, ever.

### Cost controls
- [ ] `tools/content-engine/src/generate/model.ts` exposes
      `outline()` and `draft()` as the only two model calls. Both
      use the same API key (`ANTHROPIC_API_KEY` env). No model
      calls outside this file.
- [ ] The script accepts a `--mock` flag that bypasses the model
      entirely and returns a hand-authored stub. Used for
      check:generator and CI; no API key needed for those runs.

### Generation log
- [ ] `tools/content-engine/out/generations.jsonl` appends one
      line per generation: `{post_id, kind: 'outline' | 'draft' |
      'retry', pillar, model, tokens_in, tokens_out, est_cost_usd,
      passed_checks, elapsed_ms, timestamp}`.
- [ ] `npm run check:brand && npm run check:posts && npm run
      check:renderer` all pass without reading the log.

### CLI
- [ ] `npm run generate -- <brief.json>` writes a draft post
      to `tools/content-engine/out/drafts/<post_id>.json` and
      appends to the log.
- [ ] `npm run check:generator` runs the brief smoke test below.

### Verification
- [ ] `npm run check:brand && npm run check:posts && npm run
      check:renderer && npm run build` all pass. ✓
- [ ] `npm run check:generator` — for each of the five
      library-backed pillars (drinks-recipes, workouts,
      origin-story, quit-smoking, challenge-explainers), the
      brief is run with `--mock`, the draft passes every check
      (facts, voice-lint, design, fit, marquee-fit), and the
      resulting post JSON validates against the Zod schema.
- [ ] The mocked drafts reference real `recipe_id` and
      `line_letter` values from the libraries.
- [ ] The log records each generation, and `cat
      tools/content-engine/out/generations.jsonl | wc -l` is
      at least 5 (one per library-backed pillar).

## UX/UI risks

- **Cost** — five mock generations is free. The first real run
  (one brief per pillar) is the budget baseline; the log
  records it so we can see whether the cache cuts it down.
- **Hallucinated facts** — the post-draft facts check
  (Phase 1) is the guardrail. The prompt assembly includes
  the relevant facts for the pillar; the check rejects any
  number or rule name that isn't in the file.
- **Voice drift** — the same eight voice rules, plus the
  banned-phrase list from voice-lint.json, are in the prompt
  every time. The lint rejects any draft that lands on a
  banned phrase.
- **Schema mismatch** — the Zod schema is in the prompt as
  the model's structured output format. A bad draft is
  rejected before any checks run.
- **Retry loop risk** — the spec is explicit: one retry, no
  loop. The retry sends only failing fields and the error
  messages. After one retry, the result is returned with
  whatever flags remain; the user fixes by hand.
- **Few-shot drift** — the 3–5 approved examples in the prompt
  come from the same pillar. If the bank is empty, the prompt
  omits the few-shot block and the model is more likely to
  drift. Phase 0 ships two examples (IG hibiscus, TikTok line
  A); Phase 6 grows the bank from approved outputs.
- **Mock vs real** — the mock returns a stub post that
  doesn't go through the model. Tests that depend on the
  model being called (token counts, retry logic) are out of
  scope for Phase 2. They run when the user supplies an API
  key.

## Out of scope

- Editor UI (Phase 3).
- Single-field Rewrite (Phase 3 — uses the small model).
- Member submissions (Phase 4).
- Icon style-locked generation (Phase 5).
- Correction loop (Phase 6).
- Cache wiring (Phase 6 — the prompt is structured to be
  cache-friendly, but the Anthropic prompt cache is wired in
  Phase 6 when we have real spend to optimise).
- Image generation (never in v1).
- Auto-publishing, scheduling, reels, multi-brand — never in v1.

## Test plan

- **Mock smoke** — `npm run check:generator` runs five briefs
  (one per library-backed pillar) through the mock path.
  Each produces a draft that validates, passes every check,
  and references real library entries. The log records five
  generations.
- **Hand inspection** — the five drafts are inspected
  by hand against the spec: bridge on every middle slide,
  one CTA on the last slide, ground sequence alternates,
  every fact and quantity is in facts.json or the library,
  no banned phrases, no `!` on slides.
- **Render** — the five drafts are passed through the Phase
  1 renderer. The PNGs are checked by hand against the
  brand kit. (No automated pixel diff in v1.)
- **Regression** — `npm run check:brand && npm run check:posts
  && npm run check:renderer && npm run build` pass.

## Shipped
- *(empty — Phase 2 is the next phase)*
