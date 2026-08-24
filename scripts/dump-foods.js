#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Dump the full `foods` table (and `foods_staples`) from Supabase
 * to a local JSON file. Uses the service-role key so it's not gated
 * by the public-read RLS on foods.
 *
 *   node scripts/dump-foods.js
 *   node scripts/dump-foods.js --out ./foods.json --staples-out ./staples.json
 *
 * The foods table holds ~40K rows so we paginate with the
 * `Range: low-high` header (1000 per page is the PostgREST
 * default max).
 */

const fs = require('fs');
const path = require('path');

const URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const args = process.argv.slice(2);
function arg(name, fallback) {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : fallback;
}

const OUT = arg('out', path.join(process.cwd(), 'foods.json'));
const STAPLES_OUT = arg('staples-out', path.join(process.cwd(), 'foods_staples.json'));
const PAGE = 1000;

const COLS =
  'id, name, category, subcategory, preparation, state, type, kcal, protein, carbs, fat, fiber, serving_basis, standard_serving_grams, standard_serving_label, aliases, search_text';

function rowToFood(row) {
  // Drop the tsvector from the export — it's heavy and only useful
  // for server-side search.
  const { search_text: _searchText, ...rest } = row;
  return rest;
}

async function fetchAll(table, cols) {
  const rows = [];
  for (let offset = 0; ; offset += PAGE) {
    const end = offset + PAGE - 1;
    const res = await fetch(
      `${URL}/rest/v1/${table}?select=${encodeURIComponent(cols)}`,
      {
        headers: {
          apikey: KEY,
          Authorization: `Bearer ${KEY}`,
          Range: `${offset}-${end}`,
          Prefer: 'count=exact',
        },
      }
    );
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`${table} fetch failed: ${res.status} ${body}`);
    }
    const page = await res.json();
    if (!Array.isArray(page) || page.length === 0) break;
    rows.push(...page);
    // Content-Range looks like "0-999/40000" or "*/0". If we got
    // fewer than a full page, we're done.
    const cr = res.headers.get('content-range') ?? '';
    const total = cr.match(/\/(\d+)/)?.[1];
    if (page.length < PAGE || (total && rows.length >= Number(total))) break;
    process.stdout.write(`  ${rows.length} rows…\r`);
  }
  return rows;
}

async function main() {
  console.log(`Dumping foods -> ${OUT}`);
  const foods = await fetchAll('foods', COLS);
  const cleaned = foods.map(rowToFood);
  fs.writeFileSync(OUT, JSON.stringify(cleaned, null, 0));
  console.log(`  wrote ${cleaned.length} foods`);

  console.log(`Dumping foods_staples -> ${STAPLES_OUT}`);
  const staples = await fetchAll('foods_staples', '*');
  fs.writeFileSync(STAPLES_OUT, JSON.stringify(staples, null, 2));
  console.log(`  wrote ${staples.length} staples`);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});