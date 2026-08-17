const fs = require('fs');
const path = 'src/components/food-database/food-data.json';
const d = JSON.parse(fs.readFileSync(path, 'utf8'));

// Map of id → correct category
const categoryMap = {
  // Canned beans/legumes
  'canned-black-beans': 'Legumes & Beans',
  'canned-kidney-beans': 'Legumes & Beans',
  'canned-pinto-beans': 'Legumes & Beans',
  'canned-cannellini-beans': 'Legumes & Beans',
  'canned-garbanzo-beans': 'Legumes & Beans',
  'canned-lentils': 'Legumes & Beans',
  'canned-baked-beans': 'Legumes & Beans',
  'canned-refried-beans': 'Legumes & Beans',
  'canned-pinto-refried': 'Legumes & Beans',
  'canned-black-beans-no-salt': 'Legumes & Beans',
  'canned-lima-beans': 'Legumes & Beans',
  'canned-pigeon-peas': 'Legumes & Beans',

  // Canned fish/seafood
  'canned-tuna-water': 'Fish & Seafood',
  'canned-tuna-oil': 'Fish & Seafood',
  'canned-tuna-spring-water': 'Fish & Seafood',
  'canned-tuna-jalapeno': 'Fish & Seafood',
  'canned-tuna-lemon': 'Fish & Seafood',
  'canned-salmon': 'Fish & Seafood',
  'canned-sardines-oil': 'Fish & Seafood',
  'canned-sardines-water': 'Fish & Seafood',
  'canned-sardines-tomato': 'Fish & Seafood',
  'canned-sardines': 'Fish & Seafood',
  'canned-anchovies': 'Fish & Seafood',
  'canned-mackerel': 'Fish & Seafood',
  'canned-mackerel-water': 'Fish & Seafood',
  'canned-clams': 'Fish & Seafood',
  'canned-oysters': 'Fish & Seafood',
  'canned-smoked-oysters': 'Fish & Seafood',
  'canned-crab-meat': 'Fish & Seafood',
  'canned-shrimp': 'Fish & Seafood',
  'canned-herring': 'Fish & Seafood',

  // Canned meat
  'canned-corned-beef': 'Meat & Poultry',
  'canned-spam': 'Meat & Poultry',
  'canned-chicken': 'Meat & Poultry',
  'canned-vienna-sausage': 'Meat & Poultry',
  'canned-ham': 'Meat & Poultry',
  'canned-meatballs': 'Meat & Poultry',
  'canned-chili-con-carne': 'Ready Meals',
  'canned-chili-con-frijoles': 'Ready Meals',
  'canned-sausage': 'Meat & Poultry',
  'canned-chicken-soup': 'Soups',
  'canned-ravioli': 'Ready Meals',
  'canned-spaghetti-meatballs': 'Ready Meals',
  'canned-beef-stew': 'Soups',

  // Canned fruit
  'canned-peaches': 'Fruits',
  'canned-peaches-syrup': 'Fruits',
  'canned-pears': 'Fruits',
  'canned-pineapple': 'Fruits',
  'canned-pineapple-syrup': 'Fruits',
  'canned-mandarin-oranges': 'Fruits',
  'canned-mandarin-orange-syrup': 'Fruits',
  'canned-apricots': 'Fruits',
  'canned-fruit-cocktail': 'Fruits',
  'canned-fruit-salad': 'Fruits',
  'canned-lychees': 'Fruits',
  'canned-cherries': 'Fruits',
  'canned-cherries-maraschino': 'Fruits',
  'canned-fig': 'Fruits',
  'canned-mango': 'Fruits',
  'canned-guava': 'Fruits',

  // Canned dairy
  'canned-coconut-milk': 'Milk & Milk Alternatives',
  'canned-coconut-milk-light': 'Milk & Milk Alternatives',
  'canned-coconut-cream': 'Milk & Milk Alternatives',
  'canned-evaporated-milk': 'Milk & Milk Alternatives',
  'canned-condensed-milk': 'Milk & Milk Alternatives',
  'canned-evaporated-milk-skim': 'Milk & Milk Alternatives',

  // Canned tomato products
  'canned-tomato-paste': 'Condiments & Sauces',
  'canned-tomato-sauce': 'Condiments & Sauces',
  'canned-pizza-sauce': 'Condiments & Sauces',
  'canned-tomatoes-sauce-pasta': 'Condiments & Sauces',
  'canned-arrabbiata-sauce': 'Condiments & Sauces',
};

let changed = 0;
for (const f of d.foods) {
  if (categoryMap[f.id]) {
    f.category = categoryMap[f.id];
    changed++;
  }
  // If still 'Vegetables' for items like canned cranberry sauce, reclassify
  if (f.id === 'canned-cranberry-sauce') {
    f.category = 'Condiments & Sauces';
    changed++;
  }
}

d.version = (d.version || 1) + 1;
fs.writeFileSync(path, JSON.stringify(d, null, 2));
console.log(`Reclassified ${changed} canned goods. Version: ${d.version}`);
