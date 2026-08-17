const fs = require('fs');
const path = 'src/components/food-database/food-data.json';
const d = JSON.parse(fs.readFileSync(path, 'utf8'));
const seenIds = new Set();
const seenNames = new Set();
const unique = [];
const removed = [];
for (const f of d.foods) {
  const idKey = f.id;
  const nameKey = f.name.toLowerCase();
  if (seenIds.has(idKey) || seenNames.has(nameKey)) {
    removed.push(`${idKey} — ${f.name}`);
    continue;
  }
  seenIds.add(idKey);
  seenNames.add(nameKey);
  unique.push(f);
}
d.foods = unique;
d.version = (d.version || 1) + 1;
fs.writeFileSync(path, JSON.stringify(d, null, 2));
console.log(`Removed ${removed.length} duplicates.`);
removed.forEach((r) => console.log('  ' + r));
console.log(`Total now: ${d.foods.length}`);
