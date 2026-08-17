const fs = require('fs');
const path = 'src/components/food-database/food-data.json';
const d = JSON.parse(fs.readFileSync(path, 'utf8'));
const ids = new Set(d.foods.map(f => f.id));
const lowerNames = new Set(d.foods.map(f => f.name.toLowerCase()));

const mc = (id, name, dry, rest = {}) => {
  if (ids.has(id)) return null;
  if (lowerNames.has(name.toLowerCase())) return null;
  return {
    id,
    name,
    category: 'Vegetables',
    type: 'ingredient',
    servingBasis: '100g',
    state: 'Canned',
    preparation: dry,
    ...rest,
  };
};

const cs = base => ({
  kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0,
  ...base,
});

const list = [
  // ============ Canned vegetables ============
  mc('canned-tomatoes-diced', 'Canned tomatoes, diced', 'Canned diced tomatoes', cs({ kcal: 32, protein: 1.6, carbs: 7, fat: 0, fiber: 1.5 })),
  mc('canned-tomatoes-crushed', 'Canned tomatoes, crushed', 'Canned crushed tomatoes', cs({ kcal: 32, protein: 1.6, carbs: 7, fat: 0, fiber: 1.5 })),
  mc('canned-tomatoes-whole', 'Canned tomatoes, whole peeled', 'Canned whole peeled tomatoes', cs({ kcal: 32, protein: 1.6, carbs: 7, fat: 0, fiber: 1.5 })),
  mc('canned-tomatoes-fire-roasted', 'Canned tomatoes, fire-roasted', 'Canned fire-roasted tomatoes', cs({ kcal: 35, protein: 1.6, carbs: 7, fat: 0, fiber: 1.5 })),
  mc('canned-tomatoes-san-marzano', 'Canned tomatoes, San Marzano', 'Canned San Marzano tomatoes', cs({ kcal: 32, protein: 1.6, carbs: 7, fat: 0, fiber: 1.5 })),
  mc('canned-tomato-paste', 'Canned tomato paste', 'Canned tomato paste', cs({ kcal: 82, protein: 4, carbs: 19, fat: 0, fiber: 4 })),
  mc('canned-tomato-sauce', 'Canned tomato sauce', 'Canned tomato sauce', cs({ kcal: 30, protein: 1.5, carbs: 6, fat: 0, fiber: 1 })),
  mc('canned-pizza-sauce', 'Canned pizza sauce', 'Canned pizza sauce', cs({ kcal: 50, protein: 2, carbs: 9, fat: 1, fiber: 2 })),
  mc('canned-corn', 'Canned corn', 'Canned sweet corn', cs({ kcal: 86, protein: 2.7, carbs: 19, fat: 1, fiber: 1.5 })),
  mc('canned-peas', 'Canned peas', 'Canned green peas', cs({ kcal: 70, protein: 4.5, carbs: 13, fat: 0, fiber: 4 })),
  mc('canned-green-beans', 'Canned green beans', 'Canned green beans', cs({ kcal: 25, protein: 1.4, carbs: 4, fat: 0, fiber: 2 })),
  mc('canned-carrots', 'Canned carrots', 'Canned sliced carrots', cs({ kcal: 30, protein: 0.7, carbs: 6, fat: 0, fiber: 2 })),
  mc('canned-beets', 'Canned beets', 'Canned sliced beets', cs({ kcal: 35, protein: 1.4, carbs: 7, fat: 0, fiber: 2 })),
  mc('canned-mushrooms', 'Canned mushrooms', 'Canned sliced mushrooms', cs({ kcal: 25, protein: 2, carbs: 3, fat: 0, fiber: 1 })),
  mc('canned-bamboo-shoots', 'Canned bamboo shoots', 'Canned bamboo shoots', cs({ kcal: 20, protein: 1.5, carbs: 3, fat: 0, fiber: 2 })),
  mc('canned-water-chestnuts', 'Canned water chestnuts', 'Canned water chestnuts', cs({ kcal: 50, protein: 1, carbs: 12, fat: 0, fiber: 2 })),
  mc('canned-baby-corn', 'Canned baby corn', 'Canned baby corn', cs({ kcal: 25, protein: 1.5, carbs: 5, fat: 0, fiber: 2 })),
  mc('canned-artichoke-hearts', 'Canned artichoke hearts', 'Canned artichoke hearts', cs({ kcal: 36, protein: 1.5, carbs: 6, fat: 0, fiber: 2 })),
  mc('canned-hearts-of-palm', 'Canned hearts of palm', 'Canned hearts of palm', cs({ kcal: 25, protein: 2, carbs: 4, fat: 0, fiber: 2 })),
  mc('canned-pumpkin', 'Canned pumpkin', 'Canned pumpkin puree', cs({ kcal: 35, protein: 1, carbs: 8, fat: 0, fiber: 2 })),
  mc('canned-sauerkraut', 'Canned sauerkraut', 'Canned sauerkraut', cs({ kcal: 20, protein: 1, carbs: 4, fat: 0, fiber: 3 })),
  mc('canned-mixed-vegetables', 'Canned mixed vegetables', 'Canned mixed vegetables', cs({ kcal: 50, protein: 2, carbs: 10, fat: 0, fiber: 3 })),
  mc('canned-jalapenos', 'Canned jalapeños', 'Canned sliced jalapeños', cs({ kcal: 25, protein: 1, carbs: 5, fat: 0, fiber: 2 })),
  mc('canned-chipotle-adobo', 'Canned chipotle in adobo', 'Canned chipotle in adobo sauce', cs({ kcal: 90, protein: 4, carbs: 18, fat: 0, fiber: 5 })),
  mc('canned-hominy', 'Canned hominy', 'Canned white hominy', cs({ kcal: 75, protein: 2, carbs: 14, fat: 1, fiber: 2 })),
  mc('canned-olives-green', 'Canned olives, green', 'Canned green olives', cs({ kcal: 145, protein: 1, carbs: 1, fat: 15, fiber: 1 })),
  mc('canned-olives-black', 'Canned olives, black', 'Canned black olives', cs({ kcal: 116, protein: 1, carbs: 6, fat: 11, fiber: 2 })),
  mc('canned-kalamata-olives', 'Canned olives, kalamata', 'Canned kalamata olives', cs({ kcal: 200, protein: 1, carbs: 4, fat: 20, fiber: 2 })),
  mc('canned-capers', 'Canned capers', 'Canned capers', cs({ kcal: 23, protein: 2, carbs: 5, fat: 0, fiber: 3 })),
  mc('canned-roasted-red-peppers', 'Canned roasted red peppers', 'Canned roasted red peppers', cs({ kcal: 30, protein: 1, carbs: 6, fat: 0, fiber: 1 })),
  mc('canned-tomatoes-sauce-pasta', 'Canned pasta sauce', 'Canned pasta sauce', cs({ kcal: 50, protein: 2, carbs: 9, fat: 1, fiber: 2 })),
  mc('canned-arrabbiata-sauce', 'Canned arrabbiata sauce', 'Canned spicy tomato sauce', cs({ kcal: 60, protein: 2, carbs: 9, fat: 2, fiber: 2 })),

  // ============ Canned beans/legumes ============
  mc('canned-black-beans', 'Canned black beans', 'Canned drained black beans', cs({ kcal: 132, protein: 9, carbs: 24, fat: 0.5, fiber: 8 })),
  mc('canned-kidney-beans', 'Canned kidney beans', 'Canned drained kidney beans', cs({ kcal: 127, protein: 8.7, carbs: 23, fat: 0.5, fiber: 6 })),
  mc('canned-pinto-beans', 'Canned pinto beans', 'Canned drained pinto beans', cs({ kcal: 143, protein: 9, carbs: 26, fat: 0.6, fiber: 9 })),
  mc('canned-cannellini-beans', 'Canned cannellini beans', 'Canned drained cannellini beans', cs({ kcal: 140, protein: 9, carbs: 25, fat: 0.5, fiber: 7 })),
  mc('canned-garbanzo-beans', 'Canned chickpeas (garbanzo)', 'Canned drained chickpeas', cs({ kcal: 139, protein: 7, carbs: 22, fat: 2, fiber: 6 })),
  mc('canned-lentils', 'Canned lentils', 'Canned drained lentils', cs({ kcal: 116, protein: 9, carbs: 20, fat: 0.5, fiber: 8 })),
  mc('canned-baked-beans', 'Canned baked beans', 'Canned baked beans in sauce', cs({ kcal: 105, protein: 5, carbs: 20, fat: 1, fiber: 5 })),
  mc('canned-refried-beans', 'Canned refried beans', 'Canned refried beans', cs({ kcal: 95, protein: 5, carbs: 16, fat: 1, fiber: 5 })),
  mc('canned-pinto-refried', 'Canned refried beans, pinto', 'Canned pinto refried beans', cs({ kcal: 95, protein: 5, carbs: 16, fat: 1, fiber: 5 })),
  mc('canned-black-beans-no-salt', 'Canned black beans, no salt added', 'Canned drained black beans, no salt', cs({ kcal: 132, protein: 9, carbs: 24, fat: 0.5, fiber: 8 })),
  mc('canned-lima-beans', 'Canned lima beans', 'Canned drained lima beans', cs({ kcal: 75, protein: 5, carbs: 14, fat: 0.3, fiber: 5 })),
  mc('canned-pigeon-peas', 'Canned pigeon peas', 'Canned drained pigeon peas', cs({ kcal: 135, protein: 9, carbs: 23, fat: 1, fiber: 6 })),

  // ============ Canned fish / seafood ============
  mc('canned-tuna-water', 'Canned tuna in water', 'Canned tuna in water', cs({ kcal: 116, protein: 26, carbs: 0, fat: 1, fiber: 0 })),
  mc('canned-tuna-oil', 'Canned tuna in oil', 'Canned tuna in oil', cs({ kcal: 198, protein: 24, carbs: 0, fat: 11, fiber: 0 })),
  mc('canned-tuna-spring-water', 'Canned tuna in spring water', 'Canned tuna in spring water', cs({ kcal: 116, protein: 26, carbs: 0, fat: 0.5, fiber: 0 })),
  mc('canned-salmon', 'Canned salmon', 'Canned salmon', cs({ kcal: 208, protein: 20, carbs: 0, fat: 13, fiber: 0 })),
  mc('canned-sardines-oil', 'Canned sardines in oil', 'Canned sardines in oil', cs({ kcal: 208, protein: 24, carbs: 0, fat: 11, fiber: 0 })),
  mc('canned-sardines-water', 'Canned sardines in water', 'Canned sardines in water', cs({ kcal: 162, protein: 22, carbs: 0, fat: 8, fiber: 0 })),
  mc('canned-sardines-tomato', 'Canned sardines in tomato sauce', 'Canned sardines in tomato sauce', cs({ kcal: 180, protein: 20, carbs: 4, fat: 9, fiber: 0 })),
  mc('canned-anchovies', 'Canned anchovies', 'Canned anchovies in oil', cs({ kcal: 210, protein: 28, carbs: 0, fat: 10, fiber: 0 })),
  mc('canned-mackerel', 'Canned mackerel', 'Canned mackerel in oil', cs({ kcal: 206, protein: 24, carbs: 0, fat: 12, fiber: 0 })),
  mc('canned-mackerel-water', 'Canned mackerel in water', 'Canned mackerel in water', cs({ kcal: 145, protein: 24, carbs: 0, fat: 5, fiber: 0 })),
  mc('canned-sardines', 'Canned sardines', 'Canned sardines', cs({ kcal: 208, protein: 24, carbs: 0, fat: 11, fiber: 0 })),
  mc('canned-clams', 'Canned clams', 'Canned chopped clams', cs({ kcal: 110, protein: 17, carbs: 5, fat: 2, fiber: 0 })),
  mc('canned-oysters', 'Canned oysters', 'Canned smoked oysters', cs({ kcal: 170, protein: 17, carbs: 5, fat: 9, fiber: 0 })),
  mc('canned-crab-meat', 'Canned crab meat', 'Canned crab meat', cs({ kcal: 99, protein: 19, carbs: 0, fat: 1, fiber: 0 })),
  mc('canned-shrimp', 'Canned shrimp', 'Canned shrimp', cs({ kcal: 100, protein: 22, carbs: 0, fat: 1, fiber: 0 })),
  mc('canned-herring', 'Canned herring', 'Canned herring in oil', cs({ kcal: 200, protein: 22, carbs: 0, fat: 12, fiber: 0 })),
  mc('canned-smoked-oysters', 'Canned smoked oysters', 'Canned smoked oysters in oil', cs({ kcal: 195, protein: 15, carbs: 4, fat: 13, fiber: 0 })),
  mc('canned-tuna-jalapeno', 'Canned tuna with jalapeño', 'Canned tuna with jalapeño', cs({ kcal: 130, protein: 22, carbs: 2, fat: 4, fiber: 0 })),
  mc('canned-tuna-lemon', 'Canned tuna with lemon', 'Canned tuna with lemon', cs({ kcal: 116, protein: 24, carbs: 0, fat: 2, fiber: 0 })),

  // ============ Canned meat ============
  mc('canned-corned-beef', 'Canned corned beef', 'Canned corned beef', cs({ kcal: 250, protein: 18, carbs: 0, fat: 19, fiber: 0 })),
  mc('canned-spam', 'Canned Spam', 'Canned Spam (luncheon meat)', cs({ kcal: 250, protein: 13, carbs: 1, fat: 21, fiber: 0 })),
  mc('canned-chicken', 'Canned chicken', 'Canned chicken breast', cs({ kcal: 130, protein: 22, carbs: 0, fat: 4, fiber: 0 })),
  mc('canned-vienna-sausage', 'Canned Vienna sausage', 'Canned Vienna sausage', cs({ kcal: 240, protein: 11, carbs: 1, fat: 21, fiber: 0 })),
  mc('canned-ham', 'Canned ham', 'Canned ham', cs({ kcal: 145, protein: 17, carbs: 1, fat: 8, fiber: 0 })),
  mc('canned-meatballs', 'Canned meatballs', 'Canned meatballs in sauce', cs({ kcal: 180, protein: 12, carbs: 6, fat: 12, fiber: 1 })),
  mc('canned-chili-con-carne', 'Canned chili con carne', 'Canned chili con carne', cs({ kcal: 120, protein: 9, carbs: 12, fat: 4, fiber: 3 })),
  mc('canned-chili-con-frijoles', 'Canned chili with beans', 'Canned chili with beans', cs({ kcal: 110, protein: 7, carbs: 14, fat: 3, fiber: 4 })),
  mc('canned-sausage', 'Canned sausage', 'Canned smoked sausage', cs({ kcal: 200, protein: 13, carbs: 2, fat: 16, fiber: 0 })),
  mc('canned-chicken-soup', 'Canned chicken soup', 'Canned chicken soup', cs({ kcal: 60, protein: 4, carbs: 7, fat: 2, fiber: 1 })),
  mc('canned-ravioli', 'Canned ravioli', 'Canned ravioli (meat)', cs({ kcal: 95, protein: 4, carbs: 14, fat: 2.5, fiber: 1 })),
  mc('canned-spaghetti-meatballs', 'Canned spaghetti and meatballs', 'Canned spaghetti + meatballs', cs({ kcal: 95, protein: 5, carbs: 12, fat: 3, fiber: 1 })),
  mc('canned-beef-stew', 'Canned beef stew', 'Canned beef stew', cs({ kcal: 95, protein: 7, carbs: 8, fat: 4, fiber: 1 })),

  // ============ Canned fruit ============
  mc('canned-peaches', 'Canned peaches', 'Canned peach slices in juice', cs({ kcal: 60, protein: 0.5, carbs: 14, fat: 0, fiber: 1.5 })),
  mc('canned-peaches-syrup', 'Canned peaches in syrup', 'Canned peach halves in syrup', cs({ kcal: 90, protein: 0.5, carbs: 23, fat: 0, fiber: 1.5 })),
  mc('canned-pears', 'Canned pears', 'Canned pear halves in juice', cs({ kcal: 60, protein: 0.3, carbs: 14, fat: 0, fiber: 1.5 })),
  mc('canned-pineapple', 'Canned pineapple', 'Canned pineapple chunks in juice', cs({ kcal: 60, protein: 0.5, carbs: 14, fat: 0, fiber: 1 })),
  mc('canned-pineapple-syrup', 'Canned pineapple in syrup', 'Canned pineapple in syrup', cs({ kcal: 90, protein: 0.5, carbs: 22, fat: 0, fiber: 1 })),
  mc('canned-mandarin-oranges', 'Canned mandarin oranges', 'Canned mandarin oranges in juice', cs({ kcal: 60, protein: 0.5, carbs: 14, fat: 0, fiber: 1 })),
  mc('canned-apricots', 'Canned apricots', 'Canned apricot halves in juice', cs({ kcal: 50, protein: 0.5, carbs: 12, fat: 0, fiber: 1.5 })),
  mc('canned-fruit-cocktail', 'Canned fruit cocktail', 'Canned mixed fruit cocktail', cs({ kcal: 65, protein: 0.5, carbs: 16, fat: 0, fiber: 1.5 })),
  mc('canned-lychees', 'Canned lychees', 'Canned lychees in syrup', cs({ kcal: 90, protein: 0.5, carbs: 22, fat: 0, fiber: 1 })),
  mc('canned-cherries', 'Canned cherries', 'Canned pitted cherries in syrup', cs({ kcal: 90, protein: 0.5, carbs: 22, fat: 0, fiber: 1.5 })),
  mc('canned-cherries-maraschino', 'Canned maraschino cherries', 'Canned maraschino cherries', cs({ kcal: 165, protein: 0, carbs: 41, fat: 0, fiber: 0 })),
  mc('canned-fig', 'Canned figs', 'Canned figs in syrup', cs({ kcal: 90, protein: 0.5, carbs: 22, fat: 0, fiber: 2 })),
  mc('canned-mandarin-orange-syrup', 'Canned mandarin oranges in syrup', 'Canned mandarin oranges in syrup', cs({ kcal: 90, protein: 0.5, carbs: 22, fat: 0, fiber: 1 })),
  mc('canned-fruit-salad', 'Canned fruit salad', 'Canned mixed fruit salad', cs({ kcal: 65, protein: 0.5, carbs: 16, fat: 0, fiber: 1.5 })),
  mc('canned-cranberry-sauce', 'Canned cranberry sauce', 'Canned cranberry sauce', cs({ kcal: 158, protein: 0, carbs: 41, fat: 0, fiber: 1 })),
  mc('canned-guava', 'Canned guava', 'Canned guava in syrup', cs({ kcal: 90, protein: 0.5, carbs: 22, fat: 0, fiber: 2 })),
  mc('canned-mango', 'Canned mango', 'Canned mango slices in syrup', cs({ kcal: 90, protein: 0.5, carbs: 22, fat: 0, fiber: 1 })),

  // ============ Canned coconut milk / dairy ============
  mc('canned-coconut-milk', 'Canned coconut milk', 'Canned coconut milk', cs({ kcal: 230, protein: 2, carbs: 6, fat: 24, fiber: 0 })),
  mc('canned-coconut-milk-light', 'Canned coconut milk, light', 'Canned light coconut milk', cs({ kcal: 110, protein: 1, carbs: 4, fat: 10, fiber: 0 })),
  mc('canned-coconut-cream', 'Canned coconut cream', 'Canned coconut cream', cs({ kcal: 330, protein: 3, carbs: 6, fat: 35, fiber: 0 })),
  mc('canned-evaporated-milk', 'Canned evaporated milk', 'Canned evaporated milk', cs({ kcal: 134, protein: 7, carbs: 10, fat: 7, fiber: 0 })),
  mc('canned-condensed-milk', 'Canned condensed milk', 'Canned sweetened condensed milk', cs({ kcal: 321, protein: 7, carbs: 54, fat: 9, fiber: 0 })),
  mc('canned-evaporated-milk-skim', 'Canned evaporated milk, skim', 'Canned skim evaporated milk', cs({ kcal: 78, protein: 7, carbs: 10, fat: 0, fiber: 0 })),
];

let added = 0;
for (const f of list) {
  if (!f) continue;
  d.foods.push(f);
  ids.add(f.id);
  lowerNames.add(f.name.toLowerCase());
  added++;
}

d.version = (d.version || 1) + 1;
fs.writeFileSync(path, JSON.stringify(d, null, 2));
console.log(`Added ${added} canned goods. Total: ${d.foods.length}. Version: ${d.version}`);
