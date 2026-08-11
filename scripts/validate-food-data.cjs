// Usage: node scripts/validate-food-data.cjs
// Validates food-data.json against the dataset spec.
// Exits 1 on any error.

const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '..', 'src', 'components', 'food-database', 'food-data.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

const errors = [];
const warnings = [];

function fail(msg) {
  errors.push(msg);
}
function warn(msg) {
  warnings.push(msg);
}

const REQUIRED_FIELDS = [
  'id',
  'name',
  'category',
  'kcal',
  'protein',
  'carbs',
  'fat',
  'fiber',
  'servingBasis',
];

// Categories where macro-sum won't match kcal exactly:
//   Beverages -> alcohol adds 7 kcal/g that's not in the formula
//   Oils & Fats -> pure fat is energy-dense; fat*9 still works
//     but some specialty oils and ghee can round oddly
const SKIP_MACRO_CHECK = /alcohol|whiskey|vodka|gin|rum|brandy|tequila|baijiu|sake|soju|wine|beer|cider|sangria|margarita|mojito|gin-tonic|irish/i;

const idSet = new Set();
const nameLowerSet = new Map();

let pass = 0;
for (const f of data.foods) {
  // required fields
  for (const field of REQUIRED_FIELDS) {
    if (f[field] === undefined || f[field] === null) {
      fail(`${f.id || '(no id)'}: missing required field '${field}'`);
    }
  }

  // duplicate IDs
  if (f.id) {
    if (idSet.has(f.id)) {
      fail(`duplicate id: '${f.id}'`);
    }
    idSet.add(f.id);
  }

  // duplicate names (case-insensitive)
  if (f.name) {
    const key = f.name.toLowerCase();
    if (nameLowerSet.has(key)) {
      fail(`duplicate name (case-insensitive): '${f.name}' (also: '${nameLowerSet.get(key)}')`);
    } else {
      nameLowerSet.set(key, f.id);
    }
  }

  // numeric validation: no negatives
  for (const macro of ['kcal', 'protein', 'carbs', 'fat', 'fiber']) {
    if (typeof f[macro] === 'number' && f[macro] < 0) {
      fail(`${f.id}: negative ${macro} (${f[macro]})`);
    }
  }

  // servingBasis must be '100g' for now
  if (f.servingBasis && f.servingBasis !== '100g') {
    warn(`${f.id}: unusual servingBasis '${f.servingBasis}'`);
  }

  // macro sanity: protein*4 + carbs*4 + fat*9 should be within +/-25% of kcal
  // (fiber and rounding/methodology shift macros from the simple formula;
  // alcohol contributes 7 kcal/g that's not in our model)
  if (SKIP_MACRO_CHECK.test(f.name)) {
    // skip -- kcal includes alcohol calories the macro formula doesn't model
  } else if (
    typeof f.kcal === 'number' && typeof f.protein === 'number' &&
    typeof f.carbs === 'number' && typeof f.fat === 'number'
  ) {
    const computed = f.protein * 4 + f.carbs * 4 + f.fat * 9;
    if (computed > 0 && f.kcal > 0) {
      const diff = Math.abs(f.kcal - computed) / computed;
      if (diff > 0.25) {
        warn(
          `${f.id} (${f.name}): macro sum ${Math.round(computed)} vs stated ${Math.round(f.kcal)} (${Math.round(diff * 100)}% off)`
        );
      }
    }
  }

  pass++;
}

console.log(`Checked ${pass} records in food-data.json (version ${data.version || 1})`);
console.log();
if (warnings.length) {
  console.log(`WARNINGS (${warnings.length}):`);
  warnings.slice(0, 30).forEach((w) => console.log('  ' + w));
  if (warnings.length > 30) console.log(`  ... and ${warnings.length - 30} more`);
  console.log();
}
if (errors.length) {
  console.log(`ERRORS (${errors.length}):`);
  errors.slice(0, 30).forEach((e) => console.log('  ' + e));
  if (errors.length > 30) console.log(`  ... and ${errors.length - 30} more`);
  console.log();
  process.exit(1);
}
console.log('OK -- all required fields present, no duplicate ids or names, no negative values.');
