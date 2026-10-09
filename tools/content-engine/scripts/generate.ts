// generate.ts — CLI entry: generate a post from a brief JSON.
//
// Usage:
//   npm run generate -- <brief.json> [--mock]
//   npm run generate -- examples/briefs/cucumber-lime.json
//
// Output: tools/content-engine/out/drafts/<post_id>.json
// Log:    tools/content-engine/out/generations.jsonl (one line per call)

import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { generatePost } from '../src/generate/run.js';
import { Brief } from '../src/schema/brief.js';
import { appendLog, LOG_PATH } from '../src/generate/log.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ENGINE_ROOT = resolve(__dirname, '..');

async function main() {
  const argv = process.argv.slice(2);
  if (!argv[0]) {
    console.error('Usage: generate <brief.json> [--mock]');
    process.exit(2);
  }
  const inputPath = resolve(process.cwd(), argv[0]);
  const mock = argv.includes('--mock');

  const raw = await readFile(inputPath, 'utf8');
  const parsed = Brief.safeParse(JSON.parse(raw));
  if (!parsed.success) {
    console.error(`Brief failed schema validation:`);
    for (const issue of parsed.error.issues) {
      console.error(`  - ${issue.path.join('.') || '(root)'}: ${issue.message}`);
    }
    process.exit(1);
  }
  const brief = parsed.data;

  console.log(`Generating ${brief.pillar} (${brief.aspect}, mock=${mock})…`);
  const res = await generatePost(brief, { mock });
  if (!res.post) {
    console.error(`Generation failed:`);
    for (const f of res.flags) console.error(`  - ${f.message}`);
    process.exit(1);
  }
  for (const e of res.log) {
    await appendLog(e, join(ENGINE_ROOT, LOG_PATH));
  }
  const outDir = join(ENGINE_ROOT, 'out', 'drafts');
  await mkdir(outDir, { recursive: true });
  const outPath = join(outDir, `${res.post.id}.json`);
  await writeFile(outPath, JSON.stringify(res.post, null, 2));
  console.log(`Draft written to ${outPath}`);
  if (res.flags.length) {
    console.log(`\nFlags (${res.flags.length}):`);
    for (const f of res.flags) {
      console.log(`  - ${f.slideId ?? '(post)'}${f.field ? `.${f.field}` : ''}: ${f.message}`);
    }
  } else {
    console.log('All checks passed.');
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
