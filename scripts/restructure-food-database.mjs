// One-shot script to restructure FoodDatabase.tsx render order:
// 1. Move Saved meal bundles block to before DailyTotalsBar
// 2. Move Logged today block to after the FoodSearch/MyCustomFoodsPanel
//    close
// 3. Update bundle pagination to "Showing X-Y of Z (page m/n)"
//
// Uses line indices against a normalized (LF-only) version of the
// file. Bundles block is at lines 610-727 (1-indexed), logged-today
// is at 729-965. Targets come from the file's committed state.

import { readFileSync, writeFileSync } from 'node:fs';

const path = 'src/components/food-database/FoodDatabase.tsx';
const raw = readFileSync(path, 'utf8');
const lines = raw.replace(/\r\n/g, '\n').split('\n');

if (lines.length !== 1201) {
  console.warn(`Expected 1201 lines, got ${lines.length} — aborting`);
  process.exit(1);
}

// --- Locate the saved-bundles block ---
// Starts at the comment line "{/* Saved meal bundles..." and ends at
// the outer `      )}` (indent 6). Use the array index from the
// line text we already know.
const bundlesStart = 609; // 0-indexed → 0-indexed line 609 = 1-indexed 610
// Find the actual outer `      )}` after the comment block.
let bundlesEnd = -1;
for (let i = bundlesStart + 1; i < 728; i++) {
  if (lines[i] === '      )}') {
    bundlesEnd = i;
    break;
  }
}
if (bundlesEnd < 0) throw new Error('bundlesEnd not found');

// --- Locate the logged-today block ---
const loggedStart = 728; // 0-indexed → 1-indexed 729
let loggedEnd = -1;
for (let i = loggedStart + 1; i < 966; i++) {
  if (lines[i] === '      )}') {
    loggedEnd = i;
    break;
  }
}
if (loggedEnd < 0) throw new Error('loggedEnd not found');

// --- Extract both blocks (inclusive) ---
const bundles = lines.slice(bundlesStart, bundlesEnd + 1);
const logged = lines.slice(loggedStart, loggedEnd + 1);

// --- Splice them out (LATER index first so earlier indices don't shift) ---
// Remove logged (higher index), then bundles.
lines.splice(loggedStart, logged.length);
const newBundlesStart = bundlesStart;
lines.splice(newBundlesStart, bundles.length);

// --- Find new positions ---
const totalsIdx = lines.findIndex((l) => l.includes('<DailyTotalsBar totals='));
if (totalsIdx < 0) throw new Error('DailyTotalsBar not found');

const foodsearchCloseIdx = lines.indexOf('      )}', lines.findIndex((l) => l.includes('<MyCustomFoodsPanel')) + 1);
if (foodsearchCloseIdx < 0) throw new Error('MyCustomFoodsPanel close not found');

// --- Insert bundles immediately before DailyTotalsBar ---
const bundlesInsertAt = lines.findIndex((l) => l.includes('<DailyTotalsBar totals='));
lines.splice(bundlesInsertAt, 0, ...bundles, '');
const bundlesAfterAt = bundlesInsertAt;

// --- Insert logged-today immediately after the FoodSearch close ---
const foodsearchCloseIdx2 = lines.indexOf('      )}', lines.findIndex((l) => l.includes('<MyCustomFoodsPanel')) + 1);
lines.splice(foodsearchCloseIdx2 + 1, 0, ...logged, '');

// --- Update pagination text inside the bundles block (it moved with it) ---
const idx = lines.findIndex((l) => l.includes('Page {bundlePage + 1} of {totalBundlePages}'));
if (idx > 0) {
  lines[idx] = lines[idx].replace(
    'Page {bundlePage + 1} of {totalBundlePages}',
    `Showing {bundlePage * BUNDLE_TILES_PER_PAGE + 1}–{Math.min(
      (bundlePage + 1) * BUNDLE_TILES_PER_PAGE,
      visibleBundles.length
    )} of {visibleBundles.length} (page {bundlePage + 1}/{totalBundlePages})`
  );
}

const out = lines.join('\n') + '\n';
writeFileSync(path, out, 'utf8');
console.log(
  `Restructured: bundles at ${bundlesAfterAt}, logged-today after MyCustomFoodsPanel close. ` +
  `Updated pagination text.`
);
