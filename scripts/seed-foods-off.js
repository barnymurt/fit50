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
  Beverages: 'Beverages',
  'Cereals and potatoes': 'Grains',
  'Fruits and vegetables': 'Vegetables',
  'Composite foods': 'Ready Meals',
  'Sugary snacks': 'Sweets & Desserts',
  'Salty snacks': 'Snacks',
  'Fat and sauces': 'Condiments & Sauces',
  'Milk and dairy products': 'Dairy',
  'Fish Meat Eggs': 'Meat & Poultry',
};

// pnns_groups_2 → our enum. Used to disambiguate broad pnns_groups_1
// rows ( Fish Meat Eggs, Fruits and vegetables ) and for any row where
// pnns_groups_1 is missing/unknown. Keys are lowercased at lookup
// time so casing variants map correctly.
const PNNS2_MAP = {
  // Beverages
  'fruit juices': 'Beverages',
  'non-sugared beverages': 'Beverages',
  'sweetened beverages': 'Beverages',
  'artificially sweetened beverages': 'Beverages',
  'alcoholic beverages': 'Beverages',
  'fruit nectars': 'Beverages',
  'waters and flavored waters': 'Beverages',
  // Cereals & potatoes
  bread: 'Bread & Bakery',
  'breakfast cereals': 'Breakfast Foods',
  cereals: 'Grains',
  potatoes: 'Vegetables',
  pastries: 'Sweets & Desserts',
  // Fruits & veg
  vegetables: 'Vegetables',
  legumes: 'Legumes & Beans',
  fruits: 'Fruits',
  'dried fruits': 'Fruits',
  soups: 'Soups',
  'salty and fatty products': 'Snacks',
  // Composite
  'one-dish meals': 'Ready Meals',
  'pizza pies and quiche': 'Pizza & Fast Food',
  pizza: 'Pizza & Fast Food',
  sandwich: 'Sandwiches & Wraps',
  'tripe dishes': 'Meat & Poultry',
  'fish and seafood': 'Fish & Seafood',
  meat: 'Meat & Poultry',
  'processed meat': 'Meat & Poultry',
  eggs: 'Eggs',
  // Sugary
  'biscuits and cakes': 'Sweets & Desserts',
  sweets: 'Sweets & Desserts',
  'chocolate products': 'Sweets & Desserts',
  'ice cream': 'Sweets & Desserts',
  'fruit yogurts and similar desserts': 'Sweets & Desserts',
  'dairy desserts': 'Sweets & Desserts',
  // Salty snacks
  appetizers: 'Snacks',
  'salty snacks': 'Snacks',
  // Fat and sauces
  'dressings and sauces': 'Condiments & Sauces',
  fats: 'Oils & Fats',
  cheese: 'Dairy',
  // Dairy
  'milk and yogurt': 'Dairy',
  yogurts: 'Dairy',
  milk: 'Milk & Milk Alternatives',
  'plant-based milk substitutes': 'Milk & Milk Alternatives',
  // Fish Meat Eggs
  'meat substitutes': 'Protein Foods',
  surimi: 'Fish & Seafood',
  fish: 'Fish & Seafood',
  seafood: 'Fish & Seafood',
  // Nuts
  nuts: 'Nuts & Seeds',
};

// categories_en first-token → our enum. Walked in order; the FIRST
// matching token wins (so we prefer specific over generic parents).
const CATEGORIES_EN_MAP = {
  // Fruits & veg
  fruits: 'Fruits',
  'dried fruits': 'Fruits',
  vegetables: 'Vegetables',
  salads: 'Salads',
  tabbouleh: 'Salads',
  // Meats
  meats: 'Meat & Poultry',
  poultry: 'Meat & Poultry',
  beef: 'Meat & Poultry',
  pork: 'Meat & Poultry',
  chicken: 'Meat & Poultry',
  turkey: 'Meat & Poultry',
  terrines: 'Meat & Poultry',
  terrine: 'Meat & Poultry',
  'fish and meat and eggs': 'Meat & Poultry',
  // Fish
  fish: 'Fish & Seafood',
  seafood: 'Fish & Seafood',
  shellfish: 'Fish & Seafood',
  // Dairy
  dairies: 'Dairy',
  dairy: 'Dairy',
  milks: 'Milk & Milk Alternatives',
  yogurts: 'Dairy',
  cheeses: 'Dairy',
  butters: 'Dairy',
  // Eggs
  eggs: 'Eggs',
  // Grains
  cereals: 'Grains',
  rices: 'Rice & Rice Dishes',
  pastas: 'Pasta & Noodles',
  noodles: 'Pasta & Noodles',
  breads: 'Bread & Bakery',
  baking: 'Bread & Bakery',
  'pie dough': 'Bread & Bakery',
  'pizza dough': 'Bread & Bakery',
  // Sandwiches & fast food
  sandwiches: 'Sandwiches & Wraps',
  wraps: 'Sandwiches & Wraps',
  pizzas: 'Pizza & Fast Food',
  'fast foods': 'Pizza & Fast Food',
  burgers: 'Pizza & Fast Food',
  pies: 'Sweets & Desserts',
  // Prepared
  meals: 'Ready Meals',
  'prepared meals': 'Ready Meals',
  'ready meals': 'Ready Meals',
  'one-dish meals': 'Ready Meals',
  breakfasts: 'Breakfast Foods',
  waffles: 'Sweets & Desserts',
  'crêpes and galettes': 'Sweets & Desserts',
  // Soups
  soups: 'Soups',
  // Snacks & sweets
  snacks: 'Snacks',
  'salty snacks': 'Snacks',
  'sugary snacks': 'Sweets & Desserts',
  appetizers: 'Snacks',
  'chips and fries': 'Snacks',
  sweets: 'Sweets & Desserts',
  desserts: 'Sweets & Desserts',
  candies: 'Sweets & Desserts',
  chocolates: 'Sweets & Desserts',
  biscuits: 'Sweets & Desserts',
  cakes: 'Sweets & Desserts',
  'ice creams': 'Sweets & Desserts',
  // Condiments & sauces
  sauces: 'Condiments & Sauces',
  condiments: 'Condiments & Sauces',
  dressings: 'Condiments & Sauces',
  mayonnaises: 'Condiments & Sauces',
  ketchups: 'Condiments & Sauces',
  spreads: 'Condiments & Sauces',
  syrups: 'Condiments & Sauces',
  sweeteners: 'Condiments & Sauces',
  vinegars: 'Condiments & Sauces',
  // Oils
  fats: 'Oils & Fats',
  oils: 'Oils & Fats',
  'olive oils': 'Oils & Fats',
  // Beverages
  beverages: 'Beverages',
  sodas: 'Beverages',
  juices: 'Beverages',
  waters: 'Beverages',
  coffees: 'Beverages',
  teas: 'Beverages',
  wines: 'Beverages',
  beers: 'Beverages',
  spirits: 'Beverages',
  // Nuts & seeds
  nuts: 'Nuts & Seeds',
  seeds: 'Nuts & Seeds',
  // Legumes
  beans: 'Legumes & Beans',
  // Other
  'baby foods': 'Ready Meals',
  'dietary supplements': 'Protein Foods',
};

// Top-level OFF categories that are generic parents (skip them and
// fall through to the next token). Lowercased.
const SKIP_CATEGORIES_EN = new Set([
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

function mapCategory(pnns1, pnns2, catsEn) {
  if (pnns2) {
    const k = pnns2.toLowerCase().trim();
    if (PNNS2_MAP[k]) return PNNS2_MAP[k];
  }
  if (pnns1) {
    const k = pnns1.toLowerCase().trim();
    if (PNNS1_MAP[pnns1]) return PNNS1_MAP[pnns1];
    if (PNNS1_MAP[k]) return PNNS1_MAP[k];
  }
  if (catsEn) {
    const tokens = catsEn
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);
    for (const t of tokens) {
      if (SKIP_CATEGORIES_EN.has(t)) continue;
      if (CATEGORIES_EN_MAP[t]) return CATEGORIES_EN_MAP[t];
    }
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

// Only allow printable ASCII + a small set of common Latin
// punctuation. Drops Cyrillic, CJK, Arabic, accented Latin, etc.
// The original 5K foods list is English-only, so non-ASCII
// names get rejected.
const ASCII_NAME = /^[\x20-\x7E]+$/;

// Cap how long a name can be. OFF rows over ~80 chars are usually
// product descriptions (e.g. "Organic Premium Extra Virgin Olive
// Oil Cold-Pressed From Hand-Picked Estate-Grown Olives…"), not
// the ingredient-style names the curated list uses.
const MAX_NAME_LEN = 80;

// Distinctive non-English words that we never want in the corpus.
// These are high-confidence (rarely appear in English food names)
// and catch the German/French/Italian ASCII-only entries that the
// printable-ASCII check above lets through. Lowercased.
const NON_ENGLISH_WORDS = new Set([
  // German
  'aus', 'mit', 'und', 'der', 'die', 'das', 'vom', 'bei',
  'mehrkomponent', 'mehrkomponeneten', 'schoko', 'haselnuss',
  'banane', 'pralinen', 'praline',
  // French
  'aux', 'avec', 'sans', 'pour', 'dans', 'sur', 'par',
  'madeleines', 'madeleine', 'financiers', 'financier',
  'fondants', 'fondant', 'panach', 'mostaza',
  // Italian
  'con', 'senza', 'per', 'della', 'delle', 'degli',
  // Spanish
  'sin', 'del', 'los', 'las', 'una',
]);

function toTitleCase(s) {
  // Lowercase everything, then capitalise the first letter of each
  // word. Keep hyphenated words capitalised too ("Extra-Virgin").
  return s.replace(/\b[a-zA-Z][a-zA-Z'\-]*/g, (w) => {
    return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
  });
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function stripBrandFromName(name, brand) {
  if (!brand) return name;
  const tokens = brand
    .split(/[,;]/)
    .map((b) => b.trim())
    .filter((b) => b.length >= 3);
  if (tokens.length === 0) return name;
  let s = name;
  for (const t of tokens) {
    // Strip brand as a standalone word at the start or end of the
    // name. Word-boundary so "Bob" doesn't strip the "bo" in "Boeuf".
    const reStart = new RegExp(`^${escapeRegex(t)}\\s+`, 'i');
    const reEnd = new RegExp(`\\s+${escapeRegex(t)}$`, 'i');
    s = s.replace(reStart, '').replace(reEnd, '');
  }
  return s.replace(/\s+/g, ' ').trim();
}

// OFF stores some special characters as SGML entities — "&Quot;"
// for ", "&Deg;" for °, "&amp;" for &, numeric forms like "&#34;".
// Decode them BEFORE the ASCII check so a literal "°" doesn't
// fail the printable-ASCII filter (U+00B0 is outside 0x20-0x7E).
function decodeHtmlEntities(s) {
  return s
    .replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'")
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&deg;/gi, '\u00B0')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&#(\d+);/g, (_, n) => {
      const code = parseInt(n, 10);
      return Number.isFinite(code) ? String.fromCharCode(code) : '';
    });
}

function normalizeName(raw) {
  if (!raw) return '';
  let s = decodeHtmlEntities(raw.trim());

  // Drop any name with non-ASCII characters (Russian, French, etc.).
  // After decodeHtmlEntities, ° etc. would still fail this — but no
  // common English food name actually needs them, so we keep the
  // strict ASCII filter.
  if (!ASCII_NAME.test(s)) return '';

  // Strip leading junk. OFF sometimes prefixes names with a list
  // bullet ("- Pommes Noisettes"), a quote / comma / ampersand
  // separator ("\" Honey With Tahini\""), or a size / quantity
  // ("1 Bifteck", "0,5L Jus De Carotte", "1 / 2 Haricots", "500ml
  // Bicarbonate"). The size info isn't useful in the title — the
  // user picks a serving when they log the food. Strip prefixes;
  // if nothing useful remains, reject the row.
  let prev;
  do {
    prev = s;
    s = s
      // "1 Bifteck", "50ml Bicarb", "0,5l Jus", "0% Sucre", "0,0% Cerise"
      .replace(
        /^\s*\d+(?:[.,]\d+)?\s*(?:%|°|deg(?:rees?)?)?\s*(?:g|kg|oz|lb|ml|l|cl)\b\.?\s*/i,
        ''
      )
      // "1 / 2 Haricots", "1/2 Pulpe"
      .replace(/^\s*\d+\s*\/\s*\d+\s+/, '')
      // Generic leading number(s): "123 ", "1,234 "
      .replace(/^\s*\d[\d.,]*\s+/, '')
      // Leading punctuation / quote / symbol: ", ", "! - ", "& ",
      // "* ", "/ ", "+ ", "'", "\""
      .replace(/^[\s,!*/&+"'`]+/, '')
      // Trailing punctuation
      .replace(/[\s,;]+$/, '');
  } while (s !== prev);
  s = s.replace(/\s+/g, ' ').trim();

  if (s.length === 0) return '';

  // Reject if first char isn't an English letter (catches the
  // residual junk that survived the strip — e.g. names that were
  // purely size text or were wrapped in junk-only chars).
  if (!/^[A-Za-z]/.test(s)) return '';

  // OFF sometimes uses a leading "-" as a list bullet — already
  // handled by the punctuation strip, but be explicit.
  if (/^-/.test(s)) return '';

  // Strip parentheticals and bracket content — usually prep state or
  // packaging: "Chicken Breast (Frozen)", "Almonds [Bulk]".
  s = s.replace(/\s*\([^)]*\)/g, '');
  s = s.replace(/\s*\[[^\]]*\]/g, '');

  // Strip size/quantity suffixes: "Chicken Breast 500g",
  // "Granola 12 oz".
  s = s.replace(
    /\s+\d+(\.\d+)?\s*(g|kg|oz|lb|ml|l|cl|pack|pcs?|ct|count)\b\.?$/i,
    '');

  // Collapse spaces and trim again.
  s = s.replace(/\s+/g, ' ').trim();
  if (s.length === 0) return '';

  // Reject ultra-long names that survived — usually product blurbs.
  if (s.length > MAX_NAME_LEN) return '';

  // Reject if any token is a distinctive non-English word.
  const lowerTokens = s.toLowerCase().split(/\s+/);
  for (const t of lowerTokens) {
    if (NON_ENGLISH_WORDS.has(t)) return '';
  }

  // Title case so the casing matches the curated list ("Chicken
  // Breast" not "chicken breast" or "CHICKEN BREAST").
  return toTitleCase(s);
}

function buildAliases(name, brand) {
  const aliases = new Set();
  const lowerName = name.toLowerCase();
  // First significant word as alias (e.g., "Chicken" for "Chicken Breast").
  const first = lowerName.split(' ')[0];
  if (first && first.length > 2) aliases.add(first);
  // First brand token, lowercased, kept as an alias for free-text
  // search ("bobs" → finds "Bob's Red Mill" products).
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
  let dropped = { noMacros: 0, badRange: 0, noName: 0, noCategory: 0, nonAscii: 0 };
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

    // Quick ASCII check up-front so we can attribute the drop
    // separately from noName.
    if (!ASCII_NAME.test(rawName.trim())) {
      dropped.nonAscii++;
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

    // Strip brand tokens first (raw input), then run structural
    // cleanup + Title Case in normalizeName.
    const deBranded = stripBrandFromName(rawName, brand);
    const name = normalizeName(deBranded);
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