#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Seed public.foods_staging from an Open Food Facts TSV dump.
 *
 * Usage:
 *   SUPABASE_URL=https://xxx.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ... \
 *   node scripts/seed-foods-off.js \
 *     --file "C:/path/to/en.openfoodfacts.org.products.tsv"
 *
 * It streams the TSV (line-by-line, never buffers the whole file),
 * filters rows that lack a usable kcal/protein/carbs/fat, normalizes
 * the category into our 25-enum, and writes batches of 500 to
 * foods_staging tagged by run id.
 *
 * When done, run in Supabase SQL editor:
 *   select promote_foods_run('<run_id printed at the end>');
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const BATCH_SIZE = 500;
const PROGRESS_EVERY = 10_000;

// Sanity bounds for per-100g nutrition. Anything outside is dropped.
const RANGES = {
  kcal: [0, 900],
  protein: [0, 100],
  carbs: [0, 100],
  fat: [0, 100],
  fiber: [0, 50],
};

// Our 25-category enum. Anything not in this list gets dropped.
const ALLOWED_CATEGORIES = new Set([
  'Meat & Poultry',
  'Fish & Seafood',
  'Eggs',
  'Dairy',
  'Milk & Milk Alternatives',
  'Grains',
  'Bread & Bakery',
  'Pasta & Noodles',
  'Rice & Rice Dishes',
  'Legumes & Beans',
  'Vegetables',
  'Fruits',
  'Nuts & Seeds',
  'Oils & Fats',
  'Condiments & Sauces',
  'Snacks',
  'Sweets & Desserts',
  'Breakfast Foods',
  'Ready Meals',
  'Soups',
  'Salads',
  'Sandwiches & Wraps',
  'Pizza & Fast Food',
  'Beverages',
  'Protein Foods',
]);

// pnns_groups_1 (10 values) → our enum. Covers the broad strokes;
// pnns_groups_2 is used to refine for the ambiguous ones.
const PNNS1_MAP = {
  'Beverages': 'Beverages',
  'Cereals and potatoes': 'Grains',
  'Fruits and vegetables': 'Vegetables', // pnns_groups_2 refines fruit vs veg
  'Composite foods': 'Ready Meals',
  'Sugary snacks': 'Sweets & Desserts',
  'Salty snacks': 'Snacks',
  'Fat and sauces': 'Condiments & Sauces',
  'Milk and dairy products': 'Dairy',
  'Fish Meat Eggs': 'Meat & Poultry', // pnns_groups_2 refines
};

// pnns_groups_2 → our enum. Used to disambiguate broad pnns_groups_1
// rows (Fish Meat Eggs, Fruits and vegetables) and for any row where
// pnns_groups_1 is missing/unknown.
const PNNS2_MAP = {
  // Beverages
  'Fruit juices': 'Beverages',
  'Non-sugared beverages': 'Beverages',
  'Sweetened beverages': 'Beverages',
  'Artificially sweetened beverages': 'Beverages',
  'Alcoholic beverages': 'Beverages',
  'Waters and flavored waters': 'Beverages',
  // Cereals & potatoes
  'Bread': 'Bread & Bakery',
  'Breakfast cereals': 'Breakfast Foods',
  'Cereals': 'Grains',
  'Potatoes': 'Vegetables',
  'Pastries': 'Sweets & Desserts',
  // Fruits & veg
  'Vegetables': 'Vegetables',
  'Legumes': 'Legumes & Beans',
  'Fruits': 'Fruits',
  'Soups': 'Soups',
  'Salty and fatty products': 'Snacks',
  'Dried fruits': 'Fruits',
  // Composite
  'One-dish meals': 'Ready Meals',
  'Pizza pies and quiche': 'Pizza & Fast Food',
  'Sandwich': 'Sandwiches & Wraps',
  'Pizza': 'Pizza & Fast Food',
  'Fish and seafood': 'Fish & Seafood',
  'Meat': 'Meat & Poultry',
  'Eggs': 'Eggs',
  // Sugary
  'Biscuits and cakes': 'Sweets & Desserts',
  'Sweets': 'Sweets & Desserts',
  'Chocolate products': 'Sweets & Desserts',
  'Ice cream': 'Sweets & Desserts',
  'Fruit yogurts and similar desserts': 'Sweets & Desserts',
  // Salty snacks
  'Appetizers': 'Snacks',
  'Salty snacks': 'Snacks',
  // Fat and sauces
  'Dressings and sauces': 'Condiments & Sauces',
  'Fats': 'Oils & Fats',
  'Cheese': 'Dairy',
  // Dairy
  'Milk and yogurt': 'Dairy',
  'Yogurts': 'Dairy',
  'Milk': 'Milk & Milk Alternatives',
  'Plant-based milk substitutes': 'Milk & Milk Alternatives',
  // Fish Meat Eggs
  'Processed meat': 'Meat & Poultry',
  'Meat substitutes': 'Protein Foods',
  'Surimi': 'Fish & Seafood',
  'Fish': 'Fish & Seafood',
  'Seafood': 'Fish & Seafood',
  // Nuts
  'Nuts': 'Nuts & Seeds',
};

// Fallback: look at the first token of categories_en.
const CATEGORIES_EN_FALLBACK = {
  'fruits': 'Fruits',
  'dried fruits': 'Fruits',
  'vegetables': 'Vegetables',
  'salads': 'Salads',
  'meats': 'Meat & Poultry',
  'poultry': 'Meat & Poultry',
  'beef': 'Meat & Poultry',
  'pork': 'Meat & Poultry',
  'chicken': 'Meat & Poultry',
  'turkey': 'Meat & Poultry',
  'fish': 'Fish & Seafood',
  'seafood': 'Fish & Seafood',
  'shellfish': 'Fish & Seafood',
  'dairy': 'Dairy',
  'milks': 'Milk & Milk Alternatives',
  'yogurts': 'Dairy',
  'cheeses': 'Dairy',
  'butters': 'Dairy',
  'eggs': 'Eggs',
  'cereals': 'Grains',
  'rices': 'Rice & Rice Dishes',
  'pastas': 'Pasta & Noodles',
  'noodles': 'Pasta & Noodles',
  'breads': 'Bread & Bakery',
  'baking': 'Bread & Bakery',
  'sandwiches': 'Sandwiches & Wraps',
  'wraps': 'Sandwiches & Wraps',
  'pizzas': 'Pizza & Fast Food',
  'fast foods': 'Pizza & Fast Food',
  'burgers': 'Pizza & Fast Food',
  'prepared meals': 'Ready Meals',
  'ready meals': 'Ready Meals',
  'one-dish meals': 'Ready Meals',
  'soups': 'Soups',
  'snacks': 'Snacks',
  'appetizers': 'Snacks',
  'sweets': 'Sweets & Desserts',
  'desserts': 'Sweets & Desserts',
  'candies': 'Sweets & Desserts',
  'chocolates': 'Sweets & Desserts',
  'biscuits': 'Sweets & Desserts',
  'cakes': 'Sweets & Desserts',
  'ice creams': 'Sweets & Desserts',
  'sauces': 'Condiments & Sauces',
  'condiments': 'Condiments & Sauces',
  'dressings': 'Condiments & Sauces',
  'mayonnaises': 'Condiments & Sauces',
  'ketchups': 'Condiments & Sauces',
  'spreads': 'Condiments & Sauces',
  'fats': 'Oils & Fats',
  'oils': 'Oils & Fats',
  'olive oils': 'Oils & Fats',
  'beverages': 'Beverages',
  'sodas': 'Beverages',
  'juices': 'Beverages',
  'waters': 'Beverages',
  'coffees': 'Beverages',
  'teas': 'Beverages',
  'wines': 'Beverages',
  'beers': 'Beverages',
  'spirits': 'Beverages',
  'nuts': 'Nuts & Seeds',
  'seeds': 'Nuts & Seeds',
  'legumes': 'Legumes & Beans',
  'beans': 'Legumes & Beans',
  'breakfasts': 'Breakfast Foods',
  'protein foods': 'Protein Foods',
};

function mapCategory(pnns1, pnns2, catsEn) {
  if (pnns2 && PNNS2_MAP[pnns2]) return PNNS2_MAP[pnns2];
  if (pnns1 && PNNS1_MAP[pnns1]) return PNNS1_MAP[pnns1];
  if (catsEn) {
    const first = catsEn.split(',')[0].trim().toLowerCase();
    if (CATEGORIES_EN_FALLBACK[first]) return CATEGORIES_EN_FALLBACK[first];
  }
  return null;
}

function mapType(category) {
  if (category === 'Beverages') return 'beverage';
  if (category === 'Sweets & Desserts') return 'dessert';
  if (category === 'Snacks') return 'snack';
  return 'ingredient';
}

// ---------------------------------------------------------------------------
// Supabase REST helpers
// ---------------------------------------------------------------------------

function envRequired(name) {
  const v = process.env[name];
  if (!v) {
    console.error(`Missing env var: ${name}`);
    process.exit(1);
  }
  return v;
}

async function restInsert(supabaseUrl, serviceKey, table, rows) {
  const res = await fetch(`${supabaseUrl}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates',
    },
    body: JSON.stringify(rows),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`POST ${table} failed: ${res.status} ${body}`);
  }
  return res;
}

async function restPatch(supabaseUrl, serviceKey, table, idColumn, id, fields) {
  const res = await fetch(
    `${supabaseUrl}/rest/v1/${table}?${idColumn}=eq.${id}`,
    {
      method: 'PATCH',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(fields),
    }
  );
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`PATCH ${table} failed: ${res.status} ${body}`);
  }
  return res;
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

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

function parseNumber(v) {
  if (v === undefined || v === null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function inRange(n, [lo, hi]) {
  return n >= lo && n <= hi;
}

function normalizeName(s) {
  return s
    .replace(/\s+/g, ' ')
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .trim();
}

function buildAliases(name, brand) {
  const aliases = new Set();
  const lowerName = name.toLowerCase();
  // First significant word as alias (e.g., "Chicken" for "Chicken Breast Raw")
  const first = lowerName.split(' ')[0];
  if (first && first.length > 2) aliases.add(first);
  // First brand token
  if (brand) {
    const firstBrand = brand
      .split(/[,;]/)[0]
      .trim()
      .toLowerCase();
    if (firstBrand && firstBrand.length > 1) aliases.add(firstBrand);
  }
  return Array.from(aliases).slice(0, 5);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const args = parseArgs(process.argv);
  if (!args.file) {
    console.error('Usage: node scripts/seed-foods-off.js --file <path-to-tsv>');
    process.exit(1);
  }
  const supabaseUrl = envRequired('SUPABASE_URL');
  const serviceKey = envRequired('SUPABASE_SERVICE_ROLE_KEY');

  const sourceFile = path.basename(args.file);

  // 1. Create run row first so we can stamp every staging row with run id.
  console.log('Creating seed run…');
  const runRes = await fetch(`${supabaseUrl}/rest/v1/foods_runs`, {
    method: 'POST',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({
      source_file: sourceFile,
      status: 'running',
    }),
  });
  if (!runRes.ok) {
    const body = await runRes.text();
    throw new Error(`foods_runs insert failed: ${runRes.status} ${body}`);
  }
  const [runRow] = await runRes.json();
  const runId = runRow.id;
  console.log(`Run id: ${runId}`);

  // 2. Stream the TSV.
  const stream = fs.createReadStream(args.file, { encoding: 'utf8' });
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

  let header = null;
  const colIndex = (name) => header.indexOf(name);

  let rowsIn = 0;
  let rowsOut = 0;
  let buffer = [];
  let dropped = { noMacros: 0, badRange: 0, noName: 0, noCategory: 0 };
  const t0 = Date.now();

  async function flush() {
    if (buffer.length === 0) return;
    await restInsert(supabaseUrl, serviceKey, 'foods_staging', buffer);
    buffer = [];
  }

  for await (const rawLine of rl) {
    if (!header) {
      header = rawLine.split('\t');
      continue;
    }
    rowsIn++;
    const cols = rawLine.split('\t');
    if (cols.length !== header.length) continue; // malformed line

    const code = (cols[colIndex('code')] || '').trim();
    const rawName = (cols[colIndex('product_name')] || '').trim();
    const catsEn = (cols[colIndex('categories_en')] || '').trim();
    const pnns1 = (cols[colIndex('pnns_groups_1')] || '').trim();
    const pnns2 = (cols[colIndex('pnns_groups_2')] || '').trim();
    const brand = (cols[colIndex('brands')] || '').trim();

    // OFF energy_100g is in kJ (the dedicated kcal column
    // energy-kcal_100g isn't in this header).
    const energyKj = parseNumber(cols[colIndex('energy_100g')]);
    const protein = parseNumber(cols[colIndex('proteins_100g')]);
    const carbs = parseNumber(cols[colIndex('carbohydrates_100g')]);
    const fat = parseNumber(cols[colIndex('fat_100g')]);
    const fiber = parseNumber(cols[colIndex('fiber_100g')]);

    if (!rawName) {
      dropped.noName++;
      continue;
    }

    if (
      energyKj === null ||
      protein === null ||
      carbs === null ||
      fat === null
    ) {
      dropped.noMacros++;
      continue;
    }

    const kcal = energyKj / 4.184;
    if (
      !inRange(kcal, RANGES.kcal) ||
      !inRange(protein, RANGES.protein) ||
      !inRange(carbs, RANGES.carbs) ||
      !inRange(fat, RANGES.fat) ||
      (fiber !== null && !inRange(fiber, RANGES.fiber))
    ) {
      dropped.badRange++;
      continue;
    }

    const category = mapCategory(pnns1, pnns2, catsEn);
    if (!category || !ALLOWED_CATEGORIES.has(category)) {
      dropped.noCategory++;
      continue;
    }

    const name = normalizeName(rawName);
    if (!name) {
      dropped.noName++;
      continue;
    }
    const id = code || `off-${runId}-${rowsIn}`;
    const aliases = buildAliases(name, brand);
    const type = mapType(category);

    buffer.push({
      id,
      name,
      category,
      subcategory: pnns2 && PNNS2_MAP[pnns2] ? null : pnns2 || null,
      type,
      kcal: Math.round(kcal * 10) / 10,
      protein: Math.round(protein * 10) / 10,
      carbs: Math.round(carbs * 10) / 10,
      fat: Math.round(fat * 10) / 10,
      fiber: fiber !== null ? Math.round(fiber * 10) / 10 : 0,
      serving_basis: '100g',
      aliases,
      seed_run_id: runId,
      source_code: code || null,
    });
    rowsOut++;

    if (buffer.length >= BATCH_SIZE) {
      await flush();
    }
    if (rowsIn % PROGRESS_EVERY === 0) {
      const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
      const rate = (rowsIn / (Date.now() - t0)) * 1000;
      console.log(
        `…${rowsIn.toLocaleString()} rows read, ${rowsOut.toLocaleString()} kept (${rate.toFixed(0)}/s, ${elapsed}s)`
      );
    }
  }
  await flush();

  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);

  console.log('');
  console.log(`Done. rows_in=${rowsIn.toLocaleString()} rows_out=${rowsOut.toLocaleString()} elapsed=${elapsed}s`);
  console.log(`Dropped: ${JSON.stringify(dropped)}`);

  // 3. Mark run complete.
  await restPatch(supabaseUrl, serviceKey, 'foods_runs', 'id', runId, {
    finished_at: new Date().toISOString(),
    rows_in: rowsIn,
    rows_out: rowsOut,
    status: 'completed',
  });

  console.log('');
  console.log(`Run id: ${runId}`);
  console.log(
    'Inspect with: select category, count(*) from foods_staging where seed_run_id = $1 group by 1 order by 2 desc;'
      .replace('$1', `'${runId}'`)
  );
  console.log(
    `Promote with: select promote_foods_run('${runId}');`
  );
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});