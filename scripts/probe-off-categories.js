#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * One-off: stream the OFF TSV and dump distinct pnns_groups_2 values
 * and the first token of categories_en, with counts. Use this to
 * decide what to add to the category map.
 *
 * Usage: node scripts/probe-off-categories.js --file <tsv>
 * Writes `pnns2_counts.txt` and `catsen_first_tokens.txt` to cwd.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

function parseArgs(argv) {
  const args = { file: null };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--file' && i + 1 < argv.length) {
      args.file = argv[i + 1];
      i++;
    } else if (!args.file) {
      args.file = argv[i];
    }
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv);
  if (!args.file) {
    console.error('Usage: node scripts/probe-off-categories.js --file <tsv>');
    process.exit(1);
  }

  const rl = readline.createInterface({
    input: fs.createReadStream(args.file, { encoding: 'utf8' }),
    crlfDelay: Infinity,
  });

  let header = null;
  const pnns2Counts = new Map();
  const catsenCounts = new Map();
  let rows = 0;

  for await (const line of rl) {
    if (!header) {
      header = line.split('\t');
      continue;
    }
    rows++;
    const cols = line.split('\t');
    const idxPnns2 = header.indexOf('pnns_groups_2');
    const idxCatsEn = header.indexOf('categories_en');
    const p2 = (cols[idxPnns2] || '').trim();
    const cats = (cols[idxCatsEn] || '').trim();
    if (p2) pnns2Counts.set(p2, (pnns2Counts.get(p2) || 0) + 1);
    if (cats) {
      const first = cats.split(',')[0].trim();
      if (first) catsenCounts.set(first, (catsenCounts.get(first) || 0) + 1);
    }
  }

  const pnns2Out = path.join(process.cwd(), 'pnns2_counts.txt');
  const catsenOut = path.join(process.cwd(), 'catsen_first_tokens.txt');
  const sortDesc = (m) => [...m.entries()].sort((a, b) => b[1] - a[1]);

  fs.writeFileSync(pnns2Out, sortDesc(pnns2Counts).map(([k, v]) => `${v}\t${k}`).join('\n'));
  fs.writeFileSync(catsenOut, sortDesc(catsenCounts).map(([k, v]) => `${v}\t${k}`).join('\n'));
  console.log(`Read ${rows} rows`);
  console.log(`Distinct pnns_groups_2: ${pnns2Counts.size} → ${pnns2Out}`);
  console.log(`Distinct categories_en first tokens: ${catsenCounts.size} → ${catsenOut}`);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});