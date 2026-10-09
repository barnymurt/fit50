// validate-posts.mjs — Zod schema validation for every post in
// brand/examples/. Wired to `npm run check:posts`. The schema
// is a thin re-export of the TS one (Phase 2 will hand the
// same shape to the model).
//
// Note: this script re-defines the schema in plain JS to keep
// `node` only (no tsx needed). The TS schema in
// src/schema/post.ts is the source of truth; both must stay in
// sync. Phase 1's check-renderer.ts uses the TS schema and is
// the authoritative run; this script is the no-tsx fast check.

import { readFile, readdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ENGINE_ROOT = resolve(__dirname, '..');

// Plain-JS shape check. Mirrors the Zod schema in
// src/schema/post.ts. Keep in sync; the TS schema is
// authoritative.
const VALID_TEMPLATES = new Set([
  'cover', 'statement', 'list', 'numeral', 'icon-card', 'cta', 'workout-line',
]);
const VALID_GROUNDS = new Set(['paper', 'teal', 'lavender', 'ink', 'white', 'cream']);
const VALID_PLATFORMS = new Set(['instagram', 'facebook', 'tiktok']);
const VALID_ASPECTS = new Set(['4:5', '9:16']);
const VALID_STATUSES = new Set(['draft', 'review', 'approved', 'exported']);

let failures = 0;
function fail(postId, path, msg) {
  console.error(`  ✗ ${postId}: ${path}: ${msg}`);
  failures++;
}

function check(post, file) {
  const id = post.id || '<missing-id>';
  if (typeof post.id !== 'string' || !post.id) fail(id, 'id', 'must be a non-empty string');
  if (post.type !== 'carousel') fail(id, 'type', `must be "carousel", got ${post.type}`);
  if (!VALID_PLATFORMS.has(post.platform)) fail(id, 'platform', `must be one of ${[...VALID_PLATFORMS].join(', ')}, got ${post.platform}`);
  if (!VALID_ASPECTS.has(post.aspect)) fail(id, 'aspect', `must be one of ${[...VALID_ASPECTS].join(', ')}, got ${post.aspect}`);
  if (typeof post.pillar !== 'string') fail(id, 'pillar', 'must be a string');
  if (post.brief !== undefined && typeof post.brief !== 'string') fail(id, 'brief', 'must be a string when present');
  if (post.status !== undefined && !VALID_STATUSES.has(post.status)) fail(id, 'status', `must be one of ${[...VALID_STATUSES].join(', ')}, got ${post.status}`);
  if (post.version !== undefined && (typeof post.version !== 'number' || post.version < 0)) fail(id, 'version', 'must be a non-negative integer');
  if (post.marquee !== undefined && typeof post.marquee !== 'string') fail(id, 'marquee', 'must be a string');
  if (!Array.isArray(post.slides)) fail(id, 'slides', 'must be an array');
  else {
    if (post.slides.length < 3 || post.slides.length > 7) {
      fail(id, 'slides', `length must be 3-7, got ${post.slides.length}`);
    }
    for (const [i, slide] of post.slides.entries()) {
      const path = `slides[${i}]`;
      if (!slide || typeof slide !== 'object') { fail(id, path, 'must be an object'); continue; }
      if (typeof slide.id !== 'string' || !slide.id) fail(id, `${path}.id`, 'must be a non-empty string');
      if (!VALID_TEMPLATES.has(slide.template)) fail(id, `${path}.template`, `must be one of ${[...VALID_TEMPLATES].join(', ')}, got ${slide.template}`);
      if (!VALID_GROUNDS.has(slide.ground)) fail(id, `${path}.ground`, `must be one of ${[...VALID_GROUNDS].join(', ')}, got ${slide.ground}`);
      if (!slide.fields || typeof slide.fields !== 'object') fail(id, `${path}.fields`, 'must be an object');
      else if (slide.template === 'list' && slide.fields.items && !Array.isArray(slide.fields.items)) {
        fail(id, `${path}.fields.items`, 'must be an array');
      }
    }
  }
  if (post.caption !== undefined) {
    if (typeof post.caption !== 'object') fail(id, 'caption', 'must be an object');
    else if (typeof post.caption.text !== 'string') fail(id, 'caption.text', 'must be a string');
    if (post.caption?.hashtags && !Array.isArray(post.caption.hashtags)) fail(id, 'caption.hashtags', 'must be an array of strings');
  }
}

async function main() {
  const examplesDir = resolve(ENGINE_ROOT, 'brand', 'examples');
  const files = (await readdir(examplesDir)).filter((f) => f.endsWith('.json')).sort();
  if (!files.length) {
    console.error(`No example posts found in ${examplesDir}`);
    process.exit(1);
  }
  console.log(`Post schema — ${files.length} file(s):\n`);
  for (const f of files) {
    const raw = await readFile(resolve(examplesDir, f), 'utf8');
    try {
      check(JSON.parse(raw), f);
      console.log(`  ✓ ${f}`);
    } catch (err) {
      fail(f, '(file)', `could not parse JSON: ${err.message}`);
    }
  }
  console.log('');
  if (failures) {
    console.error(`Post schema failed: ${failures} error(s).`);
    process.exit(1);
  }
  console.log('Post schema passed.');
}

main().catch((err) => { console.error(err); process.exit(1); });
