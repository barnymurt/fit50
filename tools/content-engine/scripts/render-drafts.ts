#!/usr/bin/env node
// render-drafts.ts — renders every JSON in tools/content-engine/out/drafts/.
// Used to confirm the generator's drafts round-trip through the
// renderer without flags.

import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readdir, mkdir } from 'node:fs/promises';
import { exportPost } from '../src/export.js';
import { Post } from '../src/schema/post.js';
import { readFile } from 'node:fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ENGINE_ROOT = resolve(__dirname, '..');

async function main() {
  const draftsDir = join(ENGINE_ROOT, 'out', 'drafts');
  const outDir = join(ENGINE_ROOT, 'out');
  await mkdir(outDir, { recursive: true });
  const files = (await readdir(draftsDir)).filter((f) => f.endsWith('.json')).sort();
  if (!files.length) {
    console.error(`No drafts in ${draftsDir}. Run check:generator first.`);
    process.exit(1);
  }
  for (const f of files) {
    const raw = await readFile(join(draftsDir, f), 'utf8');
    const result = Post.safeParse(JSON.parse(raw));
    if (!result.success) {
      console.error(`Skipping ${f}: schema failed.`);
      continue;
    }
    const post = result.data;
    const res = await exportPost(post, outDir, { skipChecks: true });
    console.log(`  ${post.id} (${post.platform} ${post.aspect}): ${res.pngPaths.length} PNGs, ${res.elapsedMs}ms.`);
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
