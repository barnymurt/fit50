const fs = require('fs');
const d = JSON.parse(fs.readFileSync('src/components/food-database/food-data.json', 'utf8'));
const ids = new Set(d.foods.map(f => f.id));
const names = new Set(d.foods.map(f => f.name.toLowerCase()));
const files = ['food-data-batch-43a.json','food-data-batch-43b.json','food-data-batch-43c.json','food-data-batch-44.json'];
for (const file of files) {
  const b = JSON.parse(fs.readFileSync('scripts/' + file, 'utf8'));
  const kept = b.filter(f => !ids.has(f.id) && !names.has(f.name.toLowerCase()));
  console.log(file, ':', b.length, '->', kept.length, 'new');
  kept.forEach(f => { ids.add(f.id); names.add(f.name.toLowerCase()); });
  fs.writeFileSync('scripts/' + file, JSON.stringify(kept, null, 2));
}
