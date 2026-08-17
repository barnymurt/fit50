const fs = require('fs');
const path = 'src/components/food-database/food-data.json';
const d = JSON.parse(fs.readFileSync(path, 'utf8'));
const ids = new Set(d.foods.map(f => f.id));
const names = new Set(d.foods.map(f => f.name.toLowerCase()));

const newFoods = [
  {
    id: 'collagen-powder',
    name: 'Collagen powder',
    category: 'Protein Foods',
    subcategory: 'Supplement',
    preparation: 'Hydrolysed collagen',
    state: 'Ready-to-eat',
    type: 'ingredient',
    kcal: 375,
    protein: 90,
    carbs: 0,
    fat: 0,
    fiber: 0,
    servingBasis: '100g',
    standardServingGrams: 10,
    standardServingLabel: '1 scoop',
  },
  {
    id: 'marmite',
    name: 'Marmite',
    category: 'Condiments & Sauces',
    subcategory: 'Spread',
    preparation: 'Yeast extract spread',
    state: 'Ready-to-eat',
    type: 'ingredient',
    kcal: 225,
    protein: 40,
    carbs: 25,
    fat: 1,
    fiber: 0,
    servingBasis: '100g',
    standardServingGrams: 4,
    standardServingLabel: '1 tsp',
  },
  {
    id: 'vegemite',
    name: 'Vegemite',
    category: 'Condiments & Sauces',
    subcategory: 'Spread',
    preparation: 'Yeast extract spread (Australian)',
    state: 'Ready-to-eat',
    type: 'ingredient',
    kcal: 225,
    protein: 25,
    carbs: 25,
    fat: 1,
    fiber: 0,
    servingBasis: '100g',
    standardServingGrams: 4,
    standardServingLabel: '1 tsp',
  },
];

let added = 0;
for (const f of newFoods) {
  if (ids.has(f.id) || names.has(f.name.toLowerCase())) {
    console.log('Skipping (exists):', f.id);
    continue;
  }
  d.foods.push(f);
  ids.add(f.id);
  names.add(f.name.toLowerCase());
  added++;
  console.log('Added:', f.id);
}
d.version = (d.version || 1) + 1;
fs.writeFileSync(path, JSON.stringify(d, null, 2));
console.log(`Added ${added} foods. Total: ${d.foods.length}. Version: ${d.version}`);
