#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * For OFF rows that the seed script's category mapper would drop
 * (i.e. pnns_groups_2 == "unknown" and categories_en first token is
 * a skipped parent), dump the DISTINCT tokens at positions 1..4 of
 * categories_en. Use this to decide what to add to the maps.
 */

const fs = require('fs');
const readline = require('readline');

const SKIP_FIRST = new Set([
  'plant-based foods and beverages',
  'groceries',
  'fresh foods',
  'canned foods',
  'frozen foods',
  'farming products',
  'dried products',
  'food additives',
  'non food products',
  'labeled products',
  'products sold before year 2000',
]);

async function main() {
  const file = process.argv[2];
  if (!file) {
    console.error('Usage: node scripts/probe-off-categories-deep.js <tsv>');
    process.exit(1);
  }

  const rl = readline.createInterface({
    input: fs.createReadStream(file, { encoding: 'utf8' }),
    crlfDelay: Infinity,
  });

  let header = null;
  const countsByDepth = [new Map(), new Map(), new Map(), new Map()];
  let scanned = 0;
  let dropped = 0;

  for await (const line of rl) {
    if (!header) {
      header = line.split('\t');
      continue;
    }
    scanned++;
    const cols = line.split('\t');
    const idxP2 = header.indexOf('pnns_groups_2');
    const idxCatsEn = header.indexOf('categories_en');
    const p2 = (cols[idxP2] || '').trim().toLowerCase();
    const cats = (cols[idxCatsEn] || '').trim();

    const tokens = cats
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    // Mimic the seed's logic: drop rows where we can't find a category.
    let found = false;
    for (const t of tokens) {
      if (!SKIP_FIRST.has(t) && t) {
        // Same logic as mapCategory — if this token mapped, the row
        // would be kept. We need to identify "would-have-been-dropped"
        // rows. To do that exactly we'd reimplement the map here;
        // simpler heuristic: rows where pnns_groups_2 is "unknown"
        // AND the first token is a known SKIP_FIRST parent. That
        // captures the bulk of "no category" drops.
        break;
      }
    }

    const wouldDrop =
      (p2 === '' || p2 === 'unknown') &&
      tokens.length > 0 &&
      SKIP_FIRST.has(tokens[0]);

    if (!wouldDrop) continue;
    dropped++;

    // Emit each token from depth 1..4
    for (let d = 1; d < 5; d++) {
      const t = tokens[d];
      if (!t) continue;
      const m = countsByDepth[d - 1];
      m.set(t, (m.get(t) || 0) + 1);
    }
  }

  console.log(`Scanned: ${scanned.toLocaleString()}`);
  console.log(`Would-drop: ${dropped.toLocaleString()}`);

  for (let d = 0; d < 4; d++) {
    const out = `catsen_depth${d + 2}_counts.txt`;
    const sorted = [...countsByDepth[d].entries()].sort((a, b) => b[1] - a[1]);
    fs.writeFileSync(
      out,
      sorted.map(([k, v]) => `${v}\t${k}`).join('\n')
    );
    console.log(`Depth ${d + 2}: ${countsByDepth[d].size} distinct → ${out}`);
  }
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});