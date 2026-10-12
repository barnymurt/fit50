// check-prompts.ts — Phase 6 ad-hoc check. Builds the prompt
// assembly for a drinks-recipes brief and prints it so the
// corrections slot is exercised end-to-end. Wired to
// `npm run check:prompts`.

import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
import { composeSystemPrompt, composeUserPrompt, loadBrandTexts, loadPillarConfig, loadFewShot, formatCorrections } from '@/ce-content-engine/generate/prompt';
import { describeSchema } from '@/ce-content-engine/generate/prompt';
import { Brief } from '@/ce-content-engine/schema/brief';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ENGINE_ROOT = resolve(__dirname, '..', '..');

async function main() {
  console.log('Phase 6 — prompt assembly check\n');

  const { voice, lint, facts } = await loadBrandTexts();
  const pillarConfig = await loadPillarConfig('drinks-recipes');
  const { examples } = await loadFewShot('drinks-recipes');
  const brief = Brief.parse({
    pillar: 'drinks-recipes',
    goal: 'reach',
    message: 'Cucumber lime agua fresca. 8 minutes. Two cues.',
    slide_count: 5,
    call_to_action: 'link-in-bio',
    must_include_facts: [],
    aspect: '4:5',
    platform: 'instagram',
    pin_recipe_id: 'cucumber-lime',
  });

  const correctionsBlock = formatCorrections([]);
  const sysPrompt = composeSystemPrompt({
    pillarConfig,
    voice,
    lintJson: lint,
    factsJson: facts,
    fewShot: examples.map((e) => JSON.stringify(e)).join('\n\n'),
    corrections: correctionsBlock,
    schemaDescription: describeSchema(),
    pillarName: 'drinks-recipes',
    existingExampleIds: examples.map((e) => e.id),
  });
  const userPrompt = composeUserPrompt(brief);

  const allInOne = sysPrompt + '\n\n---\n\n' + userPrompt;

  // Write to /tmp/ce-prompt.txt (gitignored) so the user can
  // inspect the full prompt.
  const outPath = join(ENGINE_ROOT, 'out', 'ce-prompt.txt');
  const fs = await import('node:fs/promises');
  await fs.mkdir(dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, allInOne, 'utf8');

  // Print the corrections slot in particular (it should be
  // present even when empty).
  const hasCorrectionsBlock = sysPrompt.includes('Recent corrections');
  const hasEmptyCorrections = sysPrompt.includes('(no recent corrections for this pillar yet)');

  console.log(`Prompt length: ${allInOne.length} chars`);
  console.log(`Wrote to ${outPath}`);
  console.log(`Has "Recent corrections" block: ${hasCorrectionsBlock ? 'yes' : 'NO'}`);
  console.log(`Empty corrections placeholder: ${hasEmptyCorrections ? 'yes' : 'NO'}`);

  let failures = 0;
  if (!hasCorrectionsBlock) { console.error('Missing corrections block!'); failures++; }
  if (!hasEmptyCorrections) { console.error('Missing empty corrections placeholder!'); failures++; }
  if (allInOne.length < 1000) { console.error('Prompt suspiciously short!'); failures++; }
  if (!allInOne.includes('Cucumber lime agua fresca')) { console.error('Brief not in user prompt!'); failures++; }
  if (!allInOne.includes('marquee_default')) { console.error('Pillar marquee not in prompt!'); failures++; }

  if (failures) {
    console.error(`\nPrompts check failed: ${failures} issue(s).`);
    process.exit(1);
  }
  console.log('\nPrompts check passed.');
}

main().catch((err) => { console.error(err); process.exit(1); });
