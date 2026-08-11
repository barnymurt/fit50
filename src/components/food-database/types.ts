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
