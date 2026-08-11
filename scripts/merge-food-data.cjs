// Usage: node scripts/merge-food-data.cjs <batch-file.json>
// Validates IDs and names against the existing dataset, then merges.
const fs = require('fs');
const path = require('path');

const file = process.argv[2];
if (!file) {
  console.error('Usage: node scripts/merge-food-data.cjs <batch-file.json>');
  process.exit(1);
}

const existingPath = path.join(__dirname, '..', 'src', 'components', 'food-database', 'food-data.json');
const additionsPath = path.isAbsolute(file)
  ? file
  : path.join(__dirname, file);

if (!fs.existsSync(additionsPath)) {
  console.error('File not found:', additionsPath);
  process.exit(1);
}

const existing = JSON.parse(fs.readFileSync(existingPath, 'utf8'));
const additions = JSON.parse(fs.readFileSync(additionsPath, 'utf8'));

const seenIds = new Set(existing.foods.map((f) => f.id));
const seenNames = new Set(existing.foods.map((f) => f.name.toLowerCase()));
const dups = [];
for (const f of additions) {
  if (seenIds.has(f.id)) dups.push(`id: ${f.id}`);
  if (seenNames.has(f.name.toLowerCase())) dups.push(`name: ${f.name}`);
}
if (dups.length) {
  console.error('DUPLICATES FOUND:');
  dups.forEach((d) => console.error('  ' + d));
  process.exit(1);
}

const before = existing.foods.length;
existing.foods = existing.foods.concat(additions);
existing.version = (existing.version || 1) + 1;

fs.writeFileSync(existingPath, JSON.stringify(existing, null, 2));
console.log(`Merged ${additions.length} new records. Total: ${before} -> ${existing.foods.length}.`);
