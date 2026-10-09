// check-generator.ts — runs the brief smoke test for the 5
// library-backed pillars. For each pillar, run a hand-authored
// brief through the mock path, validate the draft against the
// Zod schema, and run the Phase 1 checks. Every draft must
// pass with zero flags and reference real library entries.
//
// Wired to `npm run check:generator`. Exits 0 on success, 1
// on any flag or schema failure.

import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { generatePost } from '../src/generate/run.js';
import { Brief } from '../src/schema/brief.js';
import { appendLog, LOG_PATH } from '../src/generate/log.js';
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ENGINE_ROOT = resolve(__dirname, '..');

const BRIEFS: Array<{ pillar: string; aspect: '4:5' | '9:16'; platform: 'instagram' | 'facebook' | 'tiktok'; message: string; pin_recipe_id?: string; pin_line_letter?: string }> = [
  { pillar: 'drinks-recipes', aspect: '4:5', platform: 'instagram', message: 'Cucumber lime agua fresca. 8 minutes. Two cues.', pin_recipe_id: 'cucumber-lime' },
  { pillar: 'workouts',        aspect: '9:16', platform: 'tiktok',    message: 'Line B. Upper body, push. 5 moves, no kit.',     pin_line_letter: 'B' },
  { pillar: 'origin-story',    aspect: '4:5', platform: 'instagram', message: 'The Woolies basket. Day 1 of the ruleset.' },
  { pillar: 'quit-smoking',    aspect: '4:5', platform: 'facebook',  message: 'Three UK quit smoking services. Names exactly.' },
  { pillar: 'challenge-explainers', aspect: '4:5', platform: 'instagram', message: 'Day 1 of FIT50. The nine rules. No price.' },
];

let failures = 0;
function fail(msg: string) {
  console.error(`  ✗ ${msg}`);
  failures++;
}
function pass(msg: string) {
  console.log(`  ✓ ${msg}`);
}

async function main() {
  // Clear the log + drafts directory for a clean run.
  const outDir = join(ENGINE_ROOT, 'out');
  const draftsDir = join(outDir, 'drafts');
  const logPath = join(outDir, 'generations.jsonl');
  await rm(logPath, { force: true });
  await rm(draftsDir, { recursive: true, force: true });
  await mkdir(draftsDir, { recursive: true });

  console.log(`Generator check — ${BRIEFS.length} pillar(s):\n`);

  for (const b of BRIEFS) {
    console.log(`[${b.pillar}]`);
    const brief = Brief.parse({
      pillar: b.pillar,
      goal: 'reach',
      message: b.message,
      slide_count: 5,
      call_to_action: 'link-in-bio',
      must_include_facts: [],
      aspect: b.aspect,
      platform: b.platform,
      pin_recipe_id: b.pin_recipe_id,
      pin_line_letter: b.pin_line_letter,
    });
    const res = await generatePost(brief, { mock: true });
    if (!res.post) {
      fail(`${b.pillar}: no post produced`);
      for (const f of res.flags) fail(`  ${f.message}`);
      continue;
    }
    const validated = (await import('../src/schema/post.js')).Post.safeParse(res.post);
    if (!validated.success) {
      fail(`${b.pillar}: schema failed`);
      for (const i of validated.error.issues) fail(`  ${i.path.join('.') || '(root)'}: ${i.message}`);
      continue;
    }
    if (res.flags.length) {
      fail(`${b.pillar}: ${res.flags.length} check flag(s)`);
      for (const f of res.flags) fail(`  ${f.slideId ?? '(post)'}${f.field ? `.${f.field}` : ''}: ${f.message}`);
      continue;
    }
    pass(`${b.pillar}: schema valid, all checks passed`);

    // Cross-check that library references are real.
    if (b.pillar === 'drinks-recipes' && b.pin_recipe_id) {
      const drinks = JSON.parse(await (await import('node:fs/promises')).readFile(join(ENGINE_ROOT, 'brand', 'libraries', 'drinks.json'), 'utf8'));
      const recipe = drinks.recipes.find((r: any) => r.id === b.pin_recipe_id);
      if (!recipe) fail(`  recipe_id "${b.pin_recipe_id}" not in drinks.json`);
      else pass(`  recipe_id "${b.pin_recipe_id}" found in drinks.json`);
    }
    if (b.pillar === 'workouts' && b.pin_line_letter) {
      const workouts = JSON.parse(await (await import('node:fs/promises')).readFile(join(ENGINE_ROOT, 'brand', 'libraries', 'workouts.json'), 'utf8'));
      const line = workouts.lines.find((l: any) => l.letter === b.pin_line_letter);
      if (!line) fail(`  line_letter "${b.pin_line_letter}" not in workouts.json`);
      else pass(`  line_letter "${b.pin_line_letter}" found in workouts.json`);
    }

    // Persist log + draft
    for (const e of res.log) await appendLog(e, logPath);
    await writeFile(join(draftsDir, `${validated.data.id}.json`), JSON.stringify(validated.data, null, 2));
  }

  console.log('');
  const { existsSync, readFileSync } = await import('node:fs');
  const logOk = existsSync(logPath);
  const logCount = logOk ? readFileSync(logPath, 'utf8').split('\n').filter(Boolean).length : 0;
  if (logCount >= 5) {
    pass(`generation log has ${logCount} entries`);
  } else {
    fail(`generation log has ${logCount} entries (expected ≥ 5)`);
  }

  console.log('');
  if (failures) {
    console.error(`Generator check failed: ${failures} failure(s).`);
    process.exit(1);
  }
  console.log('Generator check passed.');
}

main().catch((err) => { console.error(err); process.exit(1); });
