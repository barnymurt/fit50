'use client';

import { useEffect, useState } from 'react';
import { Food } from './types';
import { createClient } from '@/lib/supabase';

export type SortKey =
  | 'relevance'
  | 'name'
  | 'kcal'
  | 'protein'
  | 'carbs'
  | 'fat'
  | 'fiber';

interface SearchOptions {
  query: string;
  category?: string | 'all';
  subcategory?: string | 'all';
  preparation?: string | 'all';
  type?: string | 'all';
  favorites?: Set<string>;
  sort?: SortKey;
  sortDir?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

const FOOD_COLS =
  'id, name, category, subcategory, preparation, state, type, kcal, protein, carbs, fat, fiber, serving_basis, standard_serving_grams, standard_serving_label, aliases';

function rowToFood(row: Record<string, unknown>): Food {
  return {
    id: row.id as string,
    name: row.name as string,
    // Legacy JSON has categories that aren't in the strict union; the
    // DB matches the JSON, so cast through unknown.
    category: row.category as Food['category'],
    subcategory: (row.subcategory as string | null) ?? undefined,
    preparation: (row.preparation as string | null) ?? undefined,
    state: (row.state as string | null) ?? undefined,
    type: row.type as Food['type'],
    kcal: row.kcal as number,
    protein: row.protein as number,
    carbs: row.carbs as number,
    fat: row.fat as number,
    fiber: row.fiber as number,
    servingBasis: (row.serving_basis as '100g') ?? '100g',
    standardServingGrams:
      typeof row.standard_serving_grams === 'number'
        ? (row.standard_serving_grams as number)
        : undefined,
    standardServingLabel:
      (row.standard_serving_label as string | null) ?? undefined,
    aliases: (row.aliases as string[]) ?? [],
  };
}

// ---------------------------------------------------------------------------
// Server-side search — the only path used by the UI at scale. Hits the
// `foods` table's GIN-indexed `search_text` tsvector and respects
// category / sort filters. Pagination is `.range(from, to)`.
// ---------------------------------------------------------------------------

export async function searchFoodsRemote(
  options: SearchOptions
): Promise<{ foods: Food[]; count: number | null }> {
  const supabase = createClient();
  if (!supabase) return { foods: [], count: null };

  const {
    query,
    category = 'all',
    subcategory = 'all',
    preparation = 'all',
    type = 'all',
    sort = 'relevance',
    sortDir = 'asc',
    limit = 50,
    offset = 0,
  } = options;

  // Ask for an exact count only on the first page of a query. Skipping
  // it on subsequent pages halves the payload — the UI shows
  // "50+" once we have a full page.
  const wantCount = offset === 0;
  let q = supabase
    .from('foods')
    .select(FOOD_COLS, { count: wantCount ? 'exact' : undefined });

  const trimmed = query.trim();
  if (trimmed.length > 0) {
    q = q.textSearch('search_text', trimmed, {
      type: 'websearch',
      config: 'simple',
    });
  }
  if (category !== 'all') q = q.eq('category', category);
  if (subcategory !== 'all') q = q.eq('subcategory', subcategory);
  if (preparation !== 'all') q = q.eq('preparation', preparation);
  if (type !== 'all') q = q.eq('type', type);

  if (sort !== 'relevance' || trimmed.length === 0) {
    const dir = sortDir === 'asc' ? true : false;
    const col =
      sort === 'kcal' ? 'kcal'
      : sort === 'protein' ? 'protein'
      : sort === 'carbs' ? 'carbs'
      : sort === 'fat' ? 'fat'
      : sort === 'fiber' ? 'fiber'
      : 'name';
    q = q.order(col, { ascending: dir });
  } else {
    // Websearch ts_rank order; fall back to name for stable cursor.
    q = q.order('name', { ascending: true });
  }

  q = q.range(offset, offset + limit - 1);

  const { data, error, count } = await q;
  if (error) {
    console.error('Food search failed:', error);
    return { foods: [], count: null };
  }
  return {
    foods: (data ?? []).map(rowToFood),
    count: count ?? null,
  };
}

// ---------------------------------------------------------------------------
// Targeted lookups — used for "recently logged" and the favourites
// chips. With the corpus at ~135K rows we can't keep a Map of all
// foods in the browser; instead we fetch the specific rows by id.
// ---------------------------------------------------------------------------

export async function fetchFoodsByIds(ids: string[]): Promise<Food[]> {
  if (ids.length === 0) return [];
  const supabase = createClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('foods')
    .select(FOOD_COLS)
    .in('id', ids);
  if (error) {
    console.error('fetchFoodsByIds failed:', error);
    return [];
  }
  return (data ?? []).map(rowToFood);
}

// Cache of id→Food for the lifetime of the page. Tiny (only the
// foods the user has logged or favourited), so this is fine.
const foodByIdCache = new Map<string, Food>();

export async function fetchFoodById(id: string): Promise<Food | null> {
  const cached = foodByIdCache.get(id);
  if (cached) return cached;
  const list = await fetchFoodsByIds([id]);
  const food = list[0] ?? null;
  if (food) foodByIdCache.set(id, food);
  return food;
}

export function clearFoodCache(): void {
  foodByIdCache.clear();
}

// ---------------------------------------------------------------------------
// Lightweight debounce hook used by FoodSearch. We don't load the full
// corpus — that was the freeze path. Each input change kicks off a
// single Supabase query, debounced to 250 ms.
// ---------------------------------------------------------------------------

export function useDebounced<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

// ---------------------------------------------------------------------------
// Categories — at search time we render the category dropdown from a
// small static list so the dropdown is instant and free. The OFF
// category enum is fixed; if a row has a category outside the set we
// either remap during seeding or the dropdown simply won't include it.
// ---------------------------------------------------------------------------

export const KNOWN_CATEGORIES: string[] = [
  'Meat & Poultry',
  'Fish & Seafood',
  'Eggs',
  'Dairy',
  'Milk & Milk Alternatives',
  'Grains',
  'Bread & Bakery',
  'Pasta & Noodles',
  'Rice & Rice Dishes',
  'Legumes & Beans',
  'Vegetables',
  'Fruits',
  'Nuts & Seeds',
  'Oils & Fats',
  'Condiments & Sauces',
  'Snacks',
  'Sweets & Desserts',
  'Breakfast Foods',
  'Ready Meals',
  'Soups',
  'Salads',
  'Sandwiches & Wraps',
  'Pizza & Fast Food',
  'Beverages',
  'Protein Foods',
];

/**
 * Subcategory options per main category. "Non-alcoholic" is the
 * curated NA beverage tag — anything matching `subcategory=Non-alcoholic`
 * in the Beverages category is a 0% drink. OFF's pnns_groups_2 values
 * are also accepted via the wildcard select below.
 */
export const KNOWN_SUBCATEGORIES: Record<string, string[]> = {
  Beverages: [
    'Non-alcoholic',
    'Non-sugared beverages',
    'Sweetened beverages',
    'Artificially sweetened beverages',
    'Alcoholic beverages',
    'Fruit juices',
  ],
};