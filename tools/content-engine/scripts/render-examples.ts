// render-examples.ts — render both example posts. Wired to
// `npm run render:examples`. Output goes to
// tools/content-engine/out/.

import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile, readdir } from 'node:fs/promises';
import { Post } from '../src/schema/post.js';
import { exportPost } from '../src/export.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ENGINE_ROOT = resolve(__dirname, '..');

async function main() {
  const examplesDir = resolve(ENGINE_ROOT, 'brand', 'examples');
  const outputDir = resolve(ENGINE_ROOT, 'out');
  const files = (await readdir(examplesDir)).filter((f) => f.endsWith('.json')).sort();
  if (!files.length) {
    console.error(`No example posts found in ${examplesDir}`);
    process.exit(1);
  }
  for (const f of files) {
    const raw = await readFile(resolve(examplesDir, f), 'utf8');
    const result = Post.safeParse(JSON.parse(raw));
    if (!result.success) {
      console.error(`Skipping ${f}: schema failed.`);
      continue;
    }
    const post = result.data;
    console.log(`Rendering ${post.id} (${post.platform}, ${post.aspect})…`);
    const res = await exportPost(post, outputDir);
    console.log(`  ${res.pngPaths.length} PNGs, ${res.elapsedMs}ms${res.flags.length ? `, ${res.flags.length} flags` : ''}.`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
