#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Replay the seed script's category decision per row and report:
 * - how many would drop
 * - for the drops, the most common (pnns1, pnns2, first-3-catsEn-tokens)
 */

const fs = require('fs');
const readline = require('readline');

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

const PNNS2_MAP = {
  'fruit juices': 'Beverages',
  'non-sugared beverages': 'Beverages',
  'sweetened beverages': 'Beverages',
  'artificially sweetened beverages': 'Beverages',
  'alcoholic beverages': 'Beverages',
  'fruit nectars': 'Beverages',
  bread: 'Bread & Bakery',
  'breakfast cereals': 'Breakfast Foods',
  cereals: 'Grains',
  potatoes: 'Vegetables',
  pastries: 'Sweets & Desserts',
  vegetables: 'Vegetables',
  legumes: 'Legumes & Beans',
  fruits: 'Fruits',
  'dried fruits': 'Fruits',
  soups: 'Soups',
  'salty and fatty products': 'Snacks',
  'one-dish meals': 'Ready Meals',
  'pizza pies and quiche': 'Pizza & Fast Food',
  pizza: 'Pizza & Fast Food',
  sandwich: 'Sandwiches & Wraps',
  'tripe dishes': 'Meat & Poultry',
  'fish and seafood': 'Fish & Seafood',
  meat: 'Meat & Poultry',
  'processed meat': 'Meat & Poultry',
  eggs: 'Eggs',
  'biscuits and cakes': 'Sweets & Desserts',
  sweets: 'Sweets & Desserts',
  'chocolate products': 'Sweets & Desserts',
  'ice cream': 'Sweets & Desserts',
  'fruit yogurts and similar desserts': 'Sweets & Desserts',
  'dairy desserts': 'Sweets & Desserts',
  appetizers: 'Snacks',
  'salty snacks': 'Snacks',
  'dressings and sauces': 'Condiments & Sauces',
  fats: 'Oils & Fats',
  cheese: 'Dairy',
  'milk and yogurt': 'Dairy',
  yogurts: 'Dairy',
  milk: 'Milk & Milk Alternatives',
  'plant-based milk substitutes': 'Milk & Milk Alternatives',
  'meat substitutes': 'Protein Foods',
  surimi: 'Fish & Seafood',
  fish: 'Fish & Seafood',
  seafood: 'Fish & Seafood',
  nuts: 'Nuts & Seeds',
};

const CATEGORIES_EN_MAP = {
  fruits: 'Fruits',
  'dried fruits': 'Fruits',
  vegetables: 'Vegetables',
  salads: 'Salads',
  tabbouleh: 'Salads',
  meats: 'Meat & Poultry',
  poultry: 'Meat & Poultry',
  beef: 'Meat & Poultry',
  pork: 'Meat & Poultry',
  chicken: 'Meat & Poultry',
  turkey: 'Meat & Poultry',
  terrines: 'Meat & Poultry',
  terrine: 'Meat & Poultry',
  'fish and meat and eggs': 'Meat & Poultry',
  fish: 'Fish & Seafood',
  seafood: 'Fish & Seafood',
  shellfish: 'Fish & Seafood',
  dairies: 'Dairy',
  dairy: 'Dairy',
  milks: 'Milk & Milk Alternatives',
  yogurts: 'Dairy',
  cheeses: 'Dairy',
  butters: 'Dairy',
  eggs: 'Eggs',
  cereals: 'Grains',
  rices: 'Rice & Rice Dishes',
  pastas: 'Pasta & Noodles',
  noodles: 'Pasta & Noodles',
  breads: 'Bread & Bakery',
  baking: 'Bread & Bakery',
  'pie dough': 'Bread & Bakery',
  'pizza dough': 'Bread & Bakery',
  sandwiches: 'Sandwiches & Wraps',
  wraps: 'Sandwiches & Wraps',
  pizzas: 'Pizza & Fast Food',
  'fast foods': 'Pizza & Fast Food',
  burgers: 'Pizza & Fast Food',
  pies: 'Sweets & Desserts',
  meals: 'Ready Meals',
  'prepared meals': 'Ready Meals',
  'ready meals': 'Ready Meals',
  'one-dish meals': 'Ready Meals',
  breakfasts: 'Breakfast Foods',
  waffles: 'Sweets & Desserts',
  'crêpes and galettes': 'Sweets & Desserts',
  soups: 'Soups',
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
  sauces: 'Condiments & Sauces',
  condiments: 'Condiments & Sauces',
  dressings: 'Condiments & Sauces',
  mayonnaises: 'Condiments & Sauces',
  ketchups: 'Condiments & Sauces',
  spreads: 'Condiments & Sauces',
  syrups: 'Condiments & Sauces',
  sweeteners: 'Condiments & Sauces',
  vinegars: 'Condiments & Sauces',
  fats: 'Oils & Fats',
  oils: 'Oils & Fats',
  'olive oils': 'Oils & Fats',
  beverages: 'Beverages',
  sodas: 'Beverages',
  juices: 'Beverages',
  waters: 'Beverages',
  coffees: 'Beverages',
  teas: 'Beverages',
  wines: 'Beverages',
  beers: 'Beverages',
  spirits: 'Beverages',
  nuts: 'Nuts & Seeds',
  seeds: 'Nuts & Seeds',
  beans: 'Legumes & Beans',
  'baby foods': 'Ready Meals',
  'dietary supplements': 'Protein Foods',
};

const SKIP = new Set([
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
    if (PNNS1_MAP[pnns1]) return PNNS1_MAP[pnns1];
  }
  if (catsEn) {
    const tokens = catsEn
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);
    for (const t of tokens) {
      if (SKIP.has(t)) continue;
      if (CATEGORIES_EN_MAP[t]) return CATEGORIES_EN_MAP[t];
    }
  }
  return null;
}

async function main() {
  const file = process.argv[2];
  if (!file) {
    console.error('Usage: node scripts/probe-off-drops.js <tsv>');
    process.exit(1);
  }

  const rl = readline.createInterface({
    input: fs.createReadStream(file, { encoding: 'utf8' }),
    crlfDelay: Infinity,
  });

  let header = null;
  let total = 0;
  let kept = 0;
  let dropped = 0;
  const droppedKey = new Map();
  let rowsIn = 0;

  for await (const line of rl) {
    if (!header) {
      header = line.split('\t');
      continue;
    }
    rowsIn++;
    const cols = line.split('\t');
    const pnns1 = (cols[header.indexOf('pnns_groups_1')] || '').trim();
    const pnns2 = (cols[header.indexOf('pnns_groups_2')] || '').trim();
    const catsEn = (cols[header.indexOf('categories_en')] || '').trim();
    const cat = mapCategory(pnns1, pnns2, catsEn);
    total++;
    if (cat) {
      kept++;
    } else {
      dropped++;
      const key = `pnns1=${JSON.stringify(pnns1)} | pnns2=${JSON.stringify(pnns2)} | cats[0..2]=${catsEn.split(',').slice(0, 3).map((s) => s.trim()).join(' | ')}`;
      droppedKey.set(key, (droppedKey.get(key) || 0) + 1);
    }
  }

  console.log(`Rows: ${total}`);
  console.log(`Kept: ${kept}`);
  console.log(`Dropped: ${dropped}`);
  console.log('Top drop keys:');
  [...droppedKey.entries()].sort((a, b) => b[1] - a[1]).slice(0, 30).forEach(([k, v]) => {
    console.log(`  ${v.toLocaleString().padStart(7)}  ${k}`);
  });
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});