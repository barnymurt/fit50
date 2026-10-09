// check-renderer.ts — run every check against every example post.
// Wired to `npm run check:renderer`. Pure data-side checks; the
// rendered check (Playwright text measurement) is added in a
// later pass when the editor's fit check is wired in.
//
// Exit code 0 = all green. 1 = any flag.

import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile, readdir } from 'node:fs/promises';
import { Post } from '../src/schema/post.js';
import { runAllChecks } from '../src/checks/index.js';
import { loadTokens } from '../src/tokens.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ENGINE_ROOT = resolve(__dirname, '..');

let failures = 0;
function report(flags: Array<{ slideId?: string; field?: string; message: string }>, postId: string) {
  if (!flags.length) {
    console.log(`  ✓ ${postId}: 0 flags`);
  } else {
    for (const f of flags) {
      console.error(`  ✗ ${postId}${f.slideId ? ` (${f.slideId})` : ''}${f.field ? `.${f.field}` : ''}: ${f.message}`);
      failures++;
    }
  }
}

async function main() {
  const tokens = await loadTokens();
  const examplesDir = resolve(ENGINE_ROOT, 'brand', 'examples');
  const files = (await readdir(examplesDir)).filter((f) => f.endsWith('.json')).sort();
  if (!files.length) {
    console.error(`No example posts found in ${examplesDir}`);
    process.exit(1);
  }
  console.log(`Renderer checks — ${files.length} example post(s):\n`);
  for (const f of files) {
    const raw = await readFile(resolve(examplesDir, f), 'utf8');
    const result = Post.safeParse(JSON.parse(raw));
    if (!result.success) {
      console.error(`  ✗ ${f}: schema failed`);
      for (const issue of result.error.issues) {
        console.error(`      ${issue.path.join('.') || '(root)'}: ${issue.message}`);
      }
      failures++;
      continue;
    }
    const flags = await runAllChecks(result.data, tokens);
    report(flags, f);
  }
  console.log('');
  if (failures) {
    console.error(`Renderer checks failed: ${failures} flag(s).`);
    process.exit(1);
  }
  console.log('Renderer checks passed.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
