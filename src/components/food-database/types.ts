// Shared food-database types

export type FoodCategory =
  | 'Meat & Poultry'
  | 'Fish & Seafood'
  | 'Eggs'
  | 'Dairy'
  | 'Milk & Milk Alternatives'
  | 'Grains'
  | 'Bread & Bakery'
  | 'Pasta & Noodles'
  | 'Rice & Rice Dishes'
  | 'Legumes & Beans'
  | 'Vegetables'
  | 'Fruits'
  | 'Nuts & Seeds'
  | 'Oils & Fats'
  | 'Condiments & Sauces'
  | 'Snacks'
  | 'Sweets & Desserts'
  | 'Breakfast Foods'
  | 'Ready Meals'
  | 'Soups'
  | 'Salads'
  | 'Sandwiches & Wraps'
  | 'Pizza & Fast Food'
  | 'Beverages'
  | 'Protein Foods';

export type FoodType = 'ingredient' | 'prepared' | 'beverage' | 'snack' | 'dessert';

export interface Food {
  id: string;
  name: string;
  category: FoodCategory;
  subcategory?: string;
  preparation?: string;
  state?: string;
  type: FoodType;
  // per 100 g
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  servingBasis: '100g';
  // optional per-item override for the typical portion people eat
  standardServingGrams?: number;
  standardServingLabel?: string;
  aliases?: string[];
}

export type Meal = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface FoodLogEntry {
  id: string;
  user_id: string;
  food_id: string;
  name: string;
  grams: number;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  meal: Meal | null;
  logged_at: string;
  day_key: string;
}

export interface DailyTotals {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export interface MacroTargets extends DailyTotals {
  hasFiberTarget: boolean;
}

export interface ScaledNutrition {
  grams: number;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export function scaleFood(food: Food, grams: number): ScaledNutrition {
  const m = grams / 100;
  return {
    grams,
    kcal: roundTo(food.kcal * m, 0),
    protein: roundTo(food.protein * m, 1),
    carbs: roundTo(food.carbs * m, 1),
    fat: roundTo(food.fat * m, 1),
    fiber: roundTo(food.fiber * m, 1),
  };
}

export function sumLog(entries: FoodLogEntry[]): DailyTotals {
  return entries.reduce<DailyTotals>(
    (acc, e) => ({
      kcal: acc.kcal + e.kcal,
      protein: acc.protein + e.protein,
      carbs: acc.carbs + e.carbs,
      fat: acc.fat + e.fat,
      fiber: acc.fiber + e.fiber,
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
  );
}

export function dayKeyFor(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function roundTo(n: number, dp: number): number {
  const f = Math.pow(10, dp);
  return Math.round(n * f) / f;
}

export const STANDARD_SERVINGS_GRAMS: Record<string, number> = {
  '100g': 100,
  '50g': 50,
  '150g': 150,
  '200g': 200,
  '1 oz': 28,
  '1 cup': 240,
};

// Sensible default standard serving per category (in grams/ml — 1ml ≈ 1g for water-based).
export const CATEGORY_DEFAULT_SERVING: Record<FoodCategory, { grams: number; label: string }> = {
  'Fruits': { grams: 100, label: '1 cup / 1 small piece' },
  'Vegetables': { grams: 100, label: '1 cup' },
  'Eggs': { grams: 50, label: '1 egg' },
  'Meat & Poultry': { grams: 100, label: '1 small fillet' },
  'Fish & Seafood': { grams: 100, label: '1 small fillet' },
  'Dairy': { grams: 30, label: '1 slice' },
  'Milk & Milk Alternatives': { grams: 250, label: '1 cup' },
  'Grains': { grams: 150, label: '1 cup cooked' },
  'Bread & Bakery': { grams: 30, label: '1 slice' },
  'Pasta & Noodles': { grams: 200, label: '1 cup cooked' },
  'Rice & Rice Dishes': { grams: 200, label: '1 cup cooked' },
  'Legumes & Beans': { grams: 150, label: '1 cup cooked' },
  'Nuts & Seeds': { grams: 30, label: '1 handful' },
  'Oils & Fats': { grams: 10, label: '1 tbsp' },
  'Condiments & Sauces': { grams: 15, label: '1 tbsp' },
  'Snacks': { grams: 30, label: '1 small handful' },
  'Sweets & Desserts': { grams: 50, label: '1 piece' },
  'Breakfast Foods': { grams: 50, label: '1 serving' },
  'Ready Meals': { grams: 300, label: '1 plate' },
  'Soups': { grams: 250, label: '1 bowl' },
  'Salads': { grams: 150, label: '1 bowl' },
  'Sandwiches & Wraps': { grams: 200, label: '1 wrap' },
  'Pizza & Fast Food': { grams: 100, label: '1 slice' },
  'Beverages': { grams: 250, label: '1 cup' },
  'Protein Foods': { grams: 30, label: '1 scoop' },
};

// Per-item overrides for items where the typical portion diverges from the category default.
// Matched by id (exact) or by name (case-insensitive). Adding to this map is additive; the
// category default is the fallback.
export const ITEM_SERVING_OVERRIDES: Record<string, { grams: number; label: string }> = {
  // Fruits
  banana: { grams: 118, label: '1 banana' },
  apple: { grams: 180, label: '1 apple' },
  orange: { grams: 130, label: '1 orange' },
  pear: { grams: 180, label: '1 pear' },
  avocado: { grams: 200, label: '1 avocado' },
  mango: { grams: 200, label: '1 mango' },
  peach: { grams: 150, label: '1 peach' },
  plum: { grams: 60, label: '1 plum' },
  lemon: { grams: 60, label: '1 lemon' },
  lime: { grams: 50, label: '1 lime' },
  kiwi: { grams: 70, label: '1 kiwi' },
  apricot: { grams: 35, label: '1 apricot' },
  nectarine: { grams: 140, label: '1 nectarine' },
  fig: { grams: 50, label: '1 fig' },
  date: { grams: 8, label: '1 date' },
  grape: { grams: 5, label: '1 grape' },
  cherry: { grams: 8, label: '1 cherry' },
  strawberry: { grams: 12, label: '1 strawberry' },
  'pineapple slice': { grams: 100, label: '1 slice' },
  watermelon: { grams: 280, label: '1 cup diced' },
  // Vegetables
  cucumber: { grams: 100, label: '1/2 cucumber' },
  tomato: { grams: 120, label: '1 tomato' },
  carrot: { grams: 60, label: '1 carrot' },
  onion: { grams: 110, label: '1 onion' },
  'bell pepper': { grams: 120, label: '1 bell pepper' },
  potato: { grams: 170, label: '1 potato' },
  'sweet potato': { grams: 130, label: '1 sweet potato' },
  corn: { grams: 90, label: '1 ear' },
  'cherry tomato': { grams: 17, label: '1 cherry tomato' },
  'baby carrot': { grams: 10, label: '1 baby carrot' },
  // Eggs
  egg: { grams: 50, label: '1 egg' },
  'egg yolk': { grams: 17, label: '1 yolk' },
  'egg white': { grams: 33, label: '1 white' },
  // Bread & Bakery
  toast: { grams: 30, label: '1 slice' },
  bagel: { grams: 95, label: '1 bagel' },
  croissant: { grams: 60, label: '1 croissant' },
  muffin: { grams: 50, label: '1 muffin' },
  donut: { grams: 60, label: '1 donut' },
  scone: { grams: 60, label: '1 scone' },
  biscuit: { grams: 30, label: '1 biscuit' },
  roll: { grams: 50, label: '1 roll' },
  // Beverages (1 ml ≈ 1 g for water-based drinks)
  espresso: { grams: 30, label: '1 shot' },
  coffee: { grams: 200, label: '1 cup' },
  tea: { grams: 240, label: '1 cup' },
  beer: { grams: 250, label: '1 glass' },
  wine: { grams: 150, label: '1 glass' },
  whiskey: { grams: 30, label: '1 shot' },
  vodka: { grams: 30, label: '1 shot' },
  rum: { grams: 30, label: '1 shot' },
  tequila: { grams: 30, label: '1 shot' },
  gin: { grams: 30, label: '1 shot' },
  sake: { grams: 30, label: '1 cup' },
  cognac: { grams: 30, label: '1 glass' },
  brandy: { grams: 30, label: '1 glass' },
  champagne: { grams: 150, label: '1 flute' },
  prosecco: { grams: 150, label: '1 flute' },
  // Sweets & Desserts
  cookie: { grams: 25, label: '1 cookie' },
  'chocolate bar': { grams: 50, label: '1 square' },
  truffle: { grams: 12, label: '1 truffle' },
  donut2: { grams: 60, label: '1 donut' },
  'ice cream scoop': { grams: 65, label: '1 scoop' },
  'cheesecake slice': { grams: 100, label: '1 slice' },
  // Pizza & Fast Food
  'pizza slice': { grams: 100, label: '1 slice' },
  hamburger: { grams: 250, label: '1 burger' },
  'cheeseburger': { grams: 270, label: '1 burger' },
  'chicken burger': { grams: 220, label: '1 burger' },
  'hot dog': { grams: 150, label: '1 hot dog' },
  // Cooked carbs
  'rice cake': { grams: 30, label: '1 piece' },
  // Other common items
  butter: { grams: 10, label: '1 tsp' },
  honey: { grams: 21, label: '1 tbsp' },
  jam: { grams: 20, label: '1 tbsp' },
  olive: { grams: 4, label: '1 olive' },
  marmite: { grams: 4, label: '1 tsp' },
  vegemite: { grams: 4, label: '1 tsp' },
  'collagen powder': { grams: 10, label: '1 scoop' },
  'black olive': { grams: 4, label: '1 olive' },
  'green olive': { grams: 4, label: '1 olive' },
  // Nuts / Seeds (1 oz = 28 g)
  almonds: { grams: 28, label: '1 oz (~23 almonds)' },
  cashews: { grams: 28, label: '1 oz' },
  walnuts: { grams: 28, label: '1 oz' },
  pecans: { grams: 28, label: '1 oz' },
  pistachios: { grams: 28, label: '1 oz' },
  'sunflower seeds': { grams: 28, label: '1 oz' },
  'pumpkin seeds': { grams: 28, label: '1 oz' },
  'chia seeds': { grams: 12, label: '1 tbsp' },
  flaxseed: { grams: 7, label: '1 tbsp' },
  'sesame seeds': { grams: 8, label: '1 tbsp' },
  // Yogurt / dairy
  'yogurt cup': { grams: 150, label: '1 cup' },
  'cottage cheese': { grams: 113, label: '1/2 cup' },
  'cream cheese': { grams: 14, label: '1 tbsp' },
  // Sushi
  'sushi roll': { grams: 200, label: '1 roll' },
  'sushi nigiri': { grams: 30, label: '1 piece' },
  'sashimi': { grams: 30, label: '4 pieces' },
  // Misc
  naan: { grams: 90, label: '1 piece' },
  pita: { grams: 60, label: '1 piece' },
  tortilla: { grams: 50, label: '1 piece' },
  pancake: { grams: 40, label: '1 pancake' },
  waffle: { grams: 75, label: '1 waffle' },
};

export function getStandardServing(food: Food): { grams: number; label: string } {
  if (food.standardServingGrams && food.standardServingLabel) {
    return { grams: food.standardServingGrams, label: food.standardServingLabel };
  }
  // Try by id
  const byId = ITEM_SERVING_OVERRIDES[food.id];
  if (byId) return byId;
  // Try by name token (lowercase first significant word)
  const nameLower = food.name.toLowerCase();
  for (const [key, value] of Object.entries(ITEM_SERVING_OVERRIDES)) {
    // word-boundary match so "banana bread" doesn't match "banana"
    const re = new RegExp(`\\b${key}\\b`, 'i');
    if (re.test(nameLower)) return value;
  }
  return CATEGORY_DEFAULT_SERVING[food.category] ?? { grams: 100, label: '1 serving' };
}
