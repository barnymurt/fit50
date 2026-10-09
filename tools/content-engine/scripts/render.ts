// render.ts — CLI entry: render a single post JSON to PNGs.
//
// Usage:
//   npm run render -- <path-to-post-json> [output-dir]
//   npm run render -- examples/ig-drinks-hibiscus.json
//
// Output goes to tools/content-engine/out/ by default.

import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
import { Post } from '../src/schema/post.js';
import { exportPost } from '../src/export.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ENGINE_ROOT = resolve(__dirname, '..');

async function main() {
  const argv = process.argv.slice(2);
  if (!argv[0]) {
    console.error('Usage: render <post.json> [output-dir]');
    process.exit(2);
  }
  const inputPath = resolve(process.cwd(), argv[0]);
  const outputDir = argv[1] ? resolve(process.cwd(), argv[1]) : resolve(ENGINE_ROOT, 'out');

  const raw = await readFile(inputPath, 'utf8');
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    console.error(`Could not parse ${inputPath}:`, (err as Error).message);
    process.exit(1);
  }
  const result = Post.safeParse(parsed);
  if (!result.success) {
    console.error(`Post failed schema validation:`);
    for (const issue of result.error.issues) {
      console.error(`  - ${issue.path.join('.') || '(root)'}: ${issue.message}`);
    }
    process.exit(1);
  }

  const post = result.data;
  console.log(`Rendering ${post.id} (${post.platform}, ${post.aspect}, ${post.slides.length} slides)…`);
  const res = await exportPost(post, outputDir);
  console.log(`Done in ${res.elapsedMs}ms.`);
  for (const p of res.pngPaths) console.log(`  ${p}`);
  if (res.captionPath) console.log(`  ${res.captionPath}`);
  if (res.flags.length) {
    console.log(`\nFlags (${res.flags.length}):`);
    for (const f of res.flags) {
      console.log(`  - ${f.slideId ?? '(post)'}${f.field ? `.${f.field}` : ''}: ${f.message}`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
