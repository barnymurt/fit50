'use client';

import { useEffect, useState } from 'react';
import { Food, Region, REGION_TAGS } from './types';
import { createClient } from '@/lib/supabase';

export type SortKey =
  | 'relevance'
  | 'name'
  | 'favourites'
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
  /** Region filter for the OFF corpus. Empty / undefined = no
   *  filter (shows all countries). Set to a Region to filter by
   *  that region. */
  region?: Region | null;
}

// British/Irish vs American (and a few European) name variants. When
// the user types one, we expand the search to include the others so
// a UK user looking for "yoghurt" finds the same rows that an Irish
// entry might call "yogurt", and vice versa.
const ALIASES: Record<string, string[]> = {
  yogurt: ['yogurt', 'yoghurt', 'yogourt'],
  yoghurt: ['yogurt', 'yoghurt', 'yogourt'],
  yogourt: ['yogurt', 'yoghurt'],
  coriander: ['coriander', 'cilantro'],
  cilantro: ['coriander', 'cilantro'],
  aubergine: ['aubergine', 'eggplant'],
  eggplant: ['aubergine', 'eggplant'],
  courgette: ['courgette', 'zucchini'],
  zucchini: ['courgette', 'zucchini'],
  rocket: ['rocket', 'arugula'],
  arugula: ['rocket', 'arugula'],
  capsicum: ['capsicum', 'bell pepper', 'pepper'],
  'bell pepper': ['capsicum', 'pepper'],
  'spring onion': ['spring onion', 'scallion', 'green onion'],
  scallion: ['scallion', 'spring onion', 'green onion'],
  biscuit: ['biscuit', 'cookie'],
  cookie: ['cookie', 'biscuit'],
  crisp: ['crisp', 'chip'],
  chips: ['chips', 'crisp'],
  fries: ['fries', 'chips'],
  mince: ['mince', 'ground beef'],
  'ground beef': ['ground beef', 'mince'],
  sorbet: ['sorbet', 'sherbet'],
  sherbet: ['sherbet', 'sorbet'],
  // Pulses
  chickpea: ['chickpea', 'garbanzo'],
  garbanzo: ['garbanzo', 'chickpea'],
  // Pulses / beans
  'baked bean': ['baked bean', 'baked beans'],
};

/**
 * Build a websearch-style tsquery that expands each token to its
 * aliases. Multi-word queries AND the expanded groups; within each
 * group we OR the variants. So "yogurt" -> "(yogurt:* | yoghurt:* |
 * yogourt:*)" and "chicken yogurt" -> "chicken:* & (yogurt:* |
 * yoghurt:* | yogourt:*)".
 */
function buildAliasExpandedTsQuery(input: string): string {
  const tokens = input
    .split(/\s+/)
    .map((w) => w.replace(/[^a-zA-Z0-9]/g, '').toLowerCase())
    .filter((w) => w.length > 0);
  if (tokens.length === 0) return '';
  const groups = tokens.map((t) => {
    const variants = ALIASES[t] ?? [t];
    const prefixed = variants.map((v) => `${v}:*`);
    return prefixed.length > 1 ? `(${prefixed.join(' | ')})` : prefixed[0];
  });
  return groups.join(' & ');
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
    servingBasis: (row.serving_basis as '100g' | '100ml') ?? '100g',
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
): Promise<{ foods: Food[]; count: number | null; aliases?: string[] }> {
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
    region = null,
  } = options;

  // Ask for an exact count only on the first page of a query. Skipping
  // it on subsequent pages halves the payload — the UI shows
  // "50+" once we have a full page.
  const wantCount = offset === 0;
  let q = supabase
    .from('foods')
    .select(FOOD_COLS, { count: wantCount ? 'exact' : undefined });

  const trimmed = query.trim();

  // Region filter: limit to rows that have at least one of the
  // region's countries in their countries_tags array. "Worldwide"
  // (empty tag list) means no region filter. "Europe (other)"
  // includes UK+IE so UK staples still show when the user picks
  // the broader Europe bucket.
  if (region && region !== 'worldwide') {
    const tags = REGION_TAGS[region];
    if (tags.length > 0) {
      q = q.overlaps('countries_tags', tags);
    }
  }

  // Track which aliases we expanded so the UI can show a "Also
  // searched: yoghurt, yogourt" hint under the input.
  let expandedAliases: string[] = [];

  if (trimmed.length > 0) {
    // Build a tsquery with PREFIX MATCHING on each token so partial
    // words like "cinn" still hit "cinnamon". websearch_to_tsquery
    // does word matching only — we need to construct the tsquery
    // ourselves using the prefix operator `:*` and AND (`&`).
    //
    // We strip non-alphanumerics so a stray "&" or apostrophe can't
    // blow up the tsquery parser. Each surviving token gets `:*`.
    //
    // Aliases: each token is expanded to its known UK/IE/US
    // variants (yogurt -> [yogurt, yoghurt, yogourt]). The expanded
    // group is OR'd; multi-word queries AND the groups. The first
    // token's full alias list is returned so the UI can hint the
    // user that aliases fired.
    const rawTokens = trimmed
      .split(/\s+/)
      .map((w) => w.replace(/[^a-zA-Z0-9]/g, '').toLowerCase())
      .filter((w) => w.length > 0);
    const groups = rawTokens.map((t) => {
      const variants = ALIASES[t] ?? [t];
      const prefixed = variants.map((v) => `${v}:*`);
      return prefixed.length > 1 ? `(${prefixed.join(' | ')})` : prefixed[0];
    });
    const tsQuery = groups.join(' & ');
    if (tsQuery.length > 0) {
      q = q.textSearch('search_text', tsQuery, { config: 'simple' });
    }
    // Capture the first token's expanded alias list for the UI hint.
    if (rawTokens.length > 0) {
      const first = rawTokens[0];
      if (ALIASES[first] && ALIASES[first].length > 1) {
        expandedAliases = ALIASES[first].filter((v) => v !== first);
      }
    }
  }
  if (category !== 'all') q = q.eq('category', category);
  if (subcategory !== 'all') q = q.eq('subcategory', subcategory);
  if (preparation !== 'all') q = q.eq('preparation', preparation);
  if (type !== 'all') q = q.eq('type', type);

  if (sort !== 'relevance' || trimmed.length === 0) {
    const dir = sortDir === 'asc' ? true : false;
    // 'favourites' is a client-side re-sort (server doesn't know the
    // user's favourite set) so fall back to name for the SQL ORDER BY.
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
    aliases: expandedAliases.length > 0 ? expandedAliases : undefined,
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