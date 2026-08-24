#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Load the cleaned fit50-food-corpus.json into the `foods` table
 * via the Supabase REST API. Idempotent (upsert on `id`).
 *
 *   node scripts/load-corpus.js                       # uses C:/Users/bmurt/Downloads/fit50-food-corpus.json
 *   node scripts/load-corpus.js --file path.json     # custom path
 *
 * Source path is read by fs and POST'd in batches of 500 to
 * /rest/v1/foods with Prefer: resolution=merge-duplicates.
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

const FILE = arg(
  'file',
  path.join('C:', 'Users', 'bmurt', 'Downloads', 'fit50-food-corpus.json')
);
const BATCH = 500;

function rowFromFood(f) {
  return {
    id: f.id,
    name: f.name,
    category: f.category,
    subcategory: f.subcategory ?? null,
    preparation: f.preparation ?? null,
    state: f.state ?? null,
    type: f.type,
    kcal: f.kcal,
    protein: f.protein,
    carbs: f.carbs,
    fat: f.fat,
    fiber: f.fiber,
    serving_basis: f.serving_basis,
    standard_serving_grams: null,
    standard_serving_label: f.standard_serving_label ?? null,
    aliases: f.aliases ?? [],
    brand: f.brand ?? null,
    regions: f.regions ?? ['uk-ie', 'us', 'worldwide'],
    language: f.language ?? 'en',
    tier: f.tier ?? null,
  };
}

async function postBatch(rows) {
  const res = await fetch(`${URL}/rest/v1/foods`, {
    method: 'POST',
    headers: {
      apikey: KEY,
      Authorization: `Bearer ${KEY}`,
      'content-type': 'application/json',
      Prefer: 'resolution=merge-duplicates',
    },
    body: JSON.stringify(rows),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`upsert failed: ${res.status} ${body}`);
  }
}

async function main() {
  console.log(`Reading ${FILE}...`);
  const data = JSON.parse(fs.readFileSync(FILE, 'utf8'));
  const foods = data.foods;
  console.log(`  ${foods.length} foods, ${data.tier_counts['1']} staples, ${data.tier_counts['2']} curated, ${data.tier_counts['3']} branded`);

  console.log('Upserting to /foods in batches of ' + BATCH);
  for (let i = 0; i < foods.length; i += BATCH) {
    const slice = foods.slice(i, i + BATCH).map(rowFromFood);
    await postBatch(slice);
    const done = Math.min(i + BATCH, foods.length);
    process.stdout.write(`  ${done.toLocaleString()} / ${foods.length.toLocaleString()}\r`);
    if (done === foods.length) process.stdout.write('\n');
  }

  console.log('Done.');
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});