// prompt.ts — prompt assembly for the generator.
//
// Order is fixed (per the spec) so the first four parts can be
// prompt-cache-friendly across calls. Only the brief changes
// per call. The Zod schema is included as the structured output
// format so a bad draft is rejected before any checks run.

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { BRAND } from '../tokens.js';
import type { Brief } from '../schema/brief.js';

export interface PromptContext {
  brief: Brief;
  pillarConfig: any; // PillarConfig from the brand folder; not strongly typed here.
  voice: string;       // voice.md
  lintJson: string;    // voice-lint.json
  factsJson: string;   // facts.json (only the slice this pillar needs)
  fewShot: string;     // 3–5 approved posts from the same pillar
  schemaDescription: string; // human-readable summary of the post schema
  pillarName: string;
  existingExampleIds: string[];
}

export async function loadBrandTexts() {
  const [voice, lint, facts] = await Promise.all([
    readFile(join(BRAND, 'voice.md'), 'utf8'),
    readFile(join(BRAND, 'voice-lint.json'), 'utf8'),
    readFile(join(BRAND, 'facts.json'), 'utf8'),
  ]);
  return { voice, lint, facts };
}

export async function loadPillarConfig(pillar: string) {
  const raw = await readFile(join(BRAND, 'pillars', `${pillar}.json`), 'utf8');
  return JSON.parse(raw);
}

export async function loadFewShot(pillar: string): Promise<{ examples: any[]; ids: string[] }> {
  const { readdir } = await import('node:fs/promises');
  const dir = join(BRAND, 'examples');
  const files = (await readdir(dir)).filter((f) => f.endsWith('.json'));
  // Phase 0 ships two example posts; both go into the few-shot
  // block for any pillar. Phase 6 filters by pillar.
  const examples = [];
  const ids = [];
  for (const f of files) {
    const raw = await readFile(join(dir, f), 'utf8');
    const parsed = JSON.parse(raw);
    examples.push(parsed);
    ids.push(parsed.id);
  }
  return { examples, ids };
}

// Human-readable description of the post schema. We don't pass
// the raw Zod schema (the model is poor at JSON Schema). We
// pass this prose version plus the per-template field limit
// table from voice-lint.json.
export function describeSchema() {
  return `A post JSON has:
  - id (string, kebab-case, unique)
  - type: "carousel"
  - platform: "instagram" | "facebook" | "tiktok"
  - aspect: "4:5" | "9:16"
  - pillar (string, matches a pillar name)
  - brief (string, optional)
  - status: "draft" | "review" | "approved" | "exported" (default "draft")
  - version (integer, default 1)
  - marquee (string id, e.g. "marquee_default")
  - source (object, optional — recipe_id for drinks, line_letter for workouts, etc.)
  - slides (array, 3 to 7 slides)
  - caption (object, optional — text and hashtags array)
  - checks (object, optional — {facts, voice_lint, design, fit, lastRenderedAt})

Each slide has:
  - id (string, unique within the post)
  - template: "cover" | "statement" | "list" | "numeral" | "icon-card" | "cta" | "workout-line"
  - ground: "paper" | "teal" | "lavender" | "ink" | "white" | "cream"
  - fields (object) — the per-template fields. Slide 1 is usually a "cover". Last slide is usually a "cta". Middle slides are "statement" or "list".`;
}

// Limit the facts.json to the slice the pillar needs.
// Phase 2 ships an "all facts" pass; Phase 6 narrows per
// pillar. Keeping it simple for v1.
export function factsSliceForPillar(_pillar: string, allFacts: any) {
  return allFacts;
}

// Compose the system prompt and the user prompt as separate
// strings. The system prompt is cacheable; the user prompt is
// the per-call delta.
export function composeSystemPrompt(ctx: Omit<PromptContext, 'brief'>) {
  return [
    'You are writing a post for the FIT50 content engine.',
    '',
    '## Voice rules',
    ctx.voice,
    '',
    '## Voice lint (machine-checkable)',
    ctx.lintJson,
    '',
    '## Facts (only the slice this pillar needs)',
    ctx.factsJson,
    '',
    '## Pillar config',
    JSON.stringify(ctx.pillarConfig, null, 2),
    '',
    '## Few-shot examples (approved posts in this pillar)',
    ctx.fewShot,
    '',
    '## Post schema (return JSON matching this shape)',
    ctx.schemaDescription,
  ].join('\n\n');
}

export function composeUserPrompt(brief: Brief) {
  return [
    '## Brief',
    JSON.stringify(brief, null, 2),
    '',
    'Return the post JSON only. No prose, no code fences.',
  ].join('\n\n');
}
