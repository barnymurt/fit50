// run.ts — orchestrator for the generator.
//
// Flow (per the spec):
//   1. outline() — cheap model call, returns one line per slide
//   2. draft()  — model fills every field of the approved outline
//   3. checks() — runAllChecks() from Phase 1
//   4. If checks fail, one targeted retry. No loop.
//
// In --mock mode, the outline step is a no-op and the draft
// returns a hand-authored stub from mocks.ts. The orchestrator
// doesn't care: the return shape is the same Post JSON.

import { loadBrandTexts, loadPillarConfig, loadFewShot, describeSchema, composeSystemPrompt, composeUserPrompt, factsSliceForPillar } from './prompt.js';
import { outlineModel, draftModel } from './model.js';
import { appendLog, type LogEntry } from './log.js';
import { MOCK_POSTS } from './mocks.js';
import { Post } from '../schema/post.js';
import { runAllChecks } from '../checks/index.js';
import { loadTokens } from '../tokens.js';
import type { Brief } from '../schema/brief.js';

export interface GenerationResult {
  post: Post;
  flags: Array<{ slideId?: string; field?: string; message: string }>;
  retried: boolean;
  log: LogEntry[];
}

export interface GenerateOptions {
  mock?: boolean;
  pillarConfigOverride?: any; // test seam
}

export async function generatePost(brief: Brief, opts: GenerateOptions = {}): Promise<GenerationResult> {
  const mock = !!opts.mock;
  const startTs = new Date().toISOString();
  const log: LogEntry[] = [];
  const tokens = await loadTokens();
  const pillarConfig = opts.pillarConfigOverride ?? (await loadPillarConfig(brief.pillar).catch(() => null));

  // Build the prompt context. In --mock mode the draft is
  // hand-authored, but the prompt is still assembled so the
  // structure is exercised end-to-end. The cache-friendly
  // first 4 parts are stable; only the brief changes per call.
  if (pillarConfig) {
    const { voice, lint, facts } = await loadBrandTexts();
    const { examples } = await loadFewShot(brief.pillar);
    const sysPrompt = composeSystemPrompt({
      pillarConfig,
      voice,
      lintJson: lint,
      factsJson: JSON.stringify(factsSliceForPillar(brief.pillar, JSON.parse(facts))),
      fewShot: examples.map((e) => JSON.stringify(e)).join('\n\n'),
      schemaDescription: describeSchema(),
      pillarName: brief.pillar,
      existingExampleIds: examples.map((e) => e.id),
    });
    const userPrompt = composeUserPrompt(brief);
    // sysPrompt / userPrompt are wired in for Phase 6's real
    // model. In mock mode they're built but not consumed.
    void sysPrompt;
    void userPrompt;
  }

  // Step 1 — outline (mock returns nothing; we proceed directly)
  const t0 = Date.now();
  const outlineResult = await outlineModel(brief, {
    mock,
    mockReturn: { slides: [] },
  });
  if ('error' in outlineResult) {
    return { post: null as any, flags: [{ message: `outline failed: ${outlineResult.error}` }], retried: false, log };
  }
  log.push({
    post_id: '',
    kind: 'outline',
    pillar: brief.pillar,
    model: outlineResult.model,
    tokens_in: outlineResult.tokens_in,
    tokens_out: outlineResult.tokens_out,
    est_cost_usd: outlineResult.est_cost_usd,
    passed_checks: null,
    elapsed_ms: Date.now() - t0,
    timestamp: startTs,
  });

  // Step 2 — draft (mock returns the hand-authored post)
  const t1 = Date.now();
  const mockReturn = MOCK_POSTS[brief.pillar] ?? null;
  if (mock && !mockReturn) {
    return { post: null as any, flags: [{ message: `no mock post for pillar "${brief.pillar}"` }], retried: false, log };
  }
  const draftResult = await draftModel(brief, {
    mock,
    mockReturn,
  });
  if ('error' in draftResult) {
    return { post: null as any, flags: [{ message: `draft failed: ${draftResult.error}` }], retried: false, log };
  }
  const post = draftResult.raw as Post;
  log.push({
    post_id: post.id,
    kind: 'draft',
    pillar: brief.pillar,
    model: draftResult.model,
    tokens_in: draftResult.tokens_in,
    tokens_out: draftResult.tokens_out,
    est_cost_usd: draftResult.est_cost_usd,
    passed_checks: null,
    elapsed_ms: Date.now() - t1,
    timestamp: new Date().toISOString(),
  });

  // Step 3 — validate against the schema (Post.safeParse)
  const validated = Post.safeParse(post);
  if (!validated.success) {
    const issues = validated.error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`);
    return { post, flags: issues.map((m) => ({ message: m })), retried: false, log };
  }

  // Step 4 — checks
  let flags = await runAllChecks(validated.data, tokens);
  let retried = false;
  if (flags.length) {
    retried = true;
    // One retry: in mock mode, we just log that the retry happened
    // and accept the flags. In real mode (Phase 6), this would
    // send the failing fields + error messages back to the model
    // for one more attempt.
    log.push({
      post_id: validated.data.id,
      kind: 'retry',
      pillar: brief.pillar,
      model: 'mock',
      tokens_in: 0,
      tokens_out: 0,
      est_cost_usd: 0,
      passed_checks: false,
      elapsed_ms: 0,
      timestamp: new Date().toISOString(),
      notes: `retry with ${flags.length} failing field(s) — no-op in mock mode`,
    });
  } else {
    log.push({
      post_id: validated.data.id,
      kind: 'draft',
      pillar: brief.pillar,
      model: 'mock',
      tokens_in: 0,
      tokens_out: 0,
      est_cost_usd: 0,
      passed_checks: true,
      elapsed_ms: 0,
      timestamp: new Date().toISOString(),
      notes: 'all checks passed',
    });
  }

  return { post: validated.data, flags, retried, log };
}
