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
// 'all' is the user-facing label for the no-region filter; the
// RPC also accepts 'worldwide' as a no-region sentinel.
function regionMatchesFilter(
  itemRegions: string[] | null,
  filterRegion: string | null
): boolean {
  if (!filterRegion || filterRegion === 'all' || filterRegion === 'worldwide') {
    return true;
  }
  if (!itemRegions || itemRegions.length === 0) return false;
  return itemRegions.includes(filterRegion);
}
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
  'ground beef': ['ground beef', 'mince', 'ground meat'],
  sorbet: ['sorbet', 'sherbet'],
  sherbet: ['sherbet', 'sorbet'],
  // Singular variants so "boiled egg" or "egg" alone expands to
  // the full egg family. The plural "eggs" key already exists.
  egg: ['eggs', 'boiled egg', 'fried egg', 'scrambled eggs', 'omelette', 'scrambled egg', 'poached egg', 'egg white', 'egg yolk', 'whole egg', 'boiled eggs', 'fried eggs', 'poached eggs'],
  boiled: ['boiled egg', 'soft boiled egg', 'hard boiled egg', 'soft-boiled', 'hard-boiled'],
  poached: ['poached egg', 'soft poached egg'],
  // Pulses
  chickpea: ['chickpea', 'garbanzo'],
  garbanzo: ['garbanzo', 'chickpea'],
  // Pulses / beans
  'baked bean': ['baked bean', 'baked beans'],
  // Common UK/US mismatches the user types but our corpus uses
  // the other spelling. Expanded from the original set to cover
  // most of the staples list. Each group keeps the first listed
  // token as the canonical one for the search trigger.
  bacon: ['bacon', 'streaky bacon', 'back bacon'],
  prawns: ['prawns', 'shrimp', 'king prawns'],
  shrimp: ['prawns', 'shrimp'],
  turkey: ['turkey', 'turkey breast'],
  pasta: ['pasta', 'noodles', 'spaghetti'],
  noodles: ['noodles', 'pasta'],
  baguette: ['baguette', 'french bread', 'stick'],
  'french stick': ['baguette', 'french bread'],
  digestive: ['digestive', 'digestive biscuit'],
  sultana: ['sultana', 'golden raisin'],
  'golden raisin': ['golden raisin', 'sultana'],
  'red pepper': ['red pepper', 'bell pepper', 'capsicum'],
  'green pepper': ['green pepper', 'bell pepper', 'capsicum'],
  'yellow pepper': ['yellow pepper', 'bell pepper', 'capsicum'],
  'coriander leaf': ['coriander leaf', 'cilantro', 'fresh coriander'],
  'fresh coriander': ['coriander leaf', 'cilantro'],
  scallions: ['scallion', 'spring onion', 'green onion'],
  'spring onions': ['spring onion', 'scallion', 'green onion'],
  zucchinis: ['zucchini', 'courgette'],
  'whole wheat': ['whole wheat', 'wholemeal'],
  wholemeal: ['wholemeal', 'whole wheat', 'brown bread'],
  'brown bread': ['brown bread', 'wholemeal'],
  'granary bread': ['granary bread', 'multigrain bread'],
  'soured cream': ['soured cream', 'sour cream'],
  'sour cream': ['sour cream', 'soured cream'],
  'plain flour': ['plain flour', 'all-purpose flour'],
  'all-purpose flour': ['all-purpose flour', 'plain flour'],
  'caster sugar': ['caster sugar', 'superfine sugar'],
  'superfine sugar': ['superfine sugar', 'caster sugar'],
  'icing sugar': ['icing sugar', 'powdered sugar', 'confectioners sugar'],
  'powdered sugar': ['powdered sugar', 'icing sugar'],
  'confectioners sugar': ['confectioners sugar', 'powdered sugar'],
  'double cream': ['double cream', 'heavy cream'],
  'heavy cream': ['heavy cream', 'double cream'],
  'single cream': ['single cream', 'light cream'],
  'light cream': ['light cream', 'single cream'],
  'golden syrup': ['golden syrup', 'light treacle'],
  'treacle': ['treacle', 'molasses'],
  'golden raisins': ['golden raisins', 'sultanas'],
  'mangetout': ['mangetout', 'snow peas', 'sugar snap peas'],
  'snow peas': ['snow peas', 'mangetout'],
  'sugar snap peas': ['sugar snap peas', 'mangetout', 'snow peas'],
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
  'id, name, category, subcategory, preparation, state, type, kcal, protein, carbs, fat, fiber, serving_basis, standard_serving_grams, standard_serving_label, aliases, brand, regions, language, tier';

const RANKED_COLS = `${FOOD_COLS}, score`;

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

// Same shape as rowToFood but for the user_custom_foods table. Used
// by fetchFoodsByIds as a fallback for IDs that aren't in public.foods
// (i.e. user-added foods).
function customRowToFood(row: Record<string, unknown>): Food {
  return {
    ...rowToFood(row),
    isCustom: true,
    customSubmissionStatus: row.submission_status as
      | 'private'
      | 'pending_review'
      | 'published'
      | 'rejected'
      | undefined,
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

  // Region filter: limit to rows whose `regions` array contains
  // the selected region. 'all' and 'worldwide' both skip this filter
  // — every row is eligible. 'all' is the user-facing default;
  // 'worldwide' is kept for backwards-compat with the older API.
  if (region && region !== 'all' && region !== 'worldwide') {
    const tags = REGION_TAGS[region];
    if (tags.length > 0) {
      q = q.overlaps('regions', tags);
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
// Ranked food search. Calls the `search_foods` RPC that does the
// blended ts_rank + trigram similarity + tier/region/favourite/
// recent boosts, with tier-3 hidden unless `showBranded` is true.
// All the ranking lives in SQL; the client just renders what comes
// back. Returns the top `limit` rows plus the `score` column so the
// UI can show a "top match" badge if it wants to.
// ---------------------------------------------------------------------------

export interface RankedFood extends Food {
  brand: string | null;
  regions: string[] | null;
  language: string | null;
  tier: number | null;
  score: number;
}

export interface RankedOptions {
  query: string;
  userId?: string | null;
  region?: string | null;
  language?: string;
  category?: string | null;
  subcategory?: string | null;
  limit?: number;
  showBranded?: boolean;
}

export async function searchFoodsRanked(
  options: RankedOptions
): Promise<{ foods: RankedFood[]; aliases: string[] }> {
  const supabase = createClient();
  if (!supabase) return { foods: [], aliases: [] };

  const {
    query,
    userId = null,
    region = null,
    language = 'en',
    category = null,
    subcategory = null,
    limit = 30,
    showBranded = false,
  } = options;

  // Track which aliases fired so the UI can show the "Also searched"
  // hint. We pick the first token's variants (excluding the token
  // itself).
  const trimmed = query.trim();
  const firstToken = trimmed
    .toLowerCase()
    .split(/\s+/)[0]
    ?.replace(/[^a-zA-Z0-9]/g, '') ?? '';
  const aliases =
    firstToken && ALIASES[firstToken]
      ? ALIASES[firstToken].filter((v) => v !== firstToken)
      : [];

  const { data, error } = await supabase.rpc('search_foods', {
    p_query: trimmed,
    p_user_id: userId,
    p_region: region,
    p_language: language,
    p_category: category,
    p_subcategory: subcategory,
    p_limit: limit,
    p_show_branded: showBranded,
  });

  if (error) {
    console.error('search_foods RPC failed:', error);
    return { foods: [], aliases };
  }
  const rows = (data ?? []) as Array<Record<string, unknown>>;
  const foods: RankedFood[] = rows.map((r) => {
    const food = rowToFood(r);
    return {
      ...food,
      brand: (r.brand as string | null) ?? null,
      regions: (r.regions as string[] | null) ?? null,
      language: (r.language as string | null) ?? null,
      tier: (r.tier as number | null) ?? null,
      score: Number(r.score ?? 0),
    };
  });
  return { foods, aliases };
}

// ---------------------------------------------------------------------------
// "Did you mean" suggestion strip. When the ranked search returns 0
// rows we still want the user to feel like the corpus can answer
// their question. Run a trigram-only query and return the top 5
// closest matches by name similarity.
// ---------------------------------------------------------------------------

export async function searchFoodsSuggestions(
  query: string,
  limit: number = 5
): Promise<RankedFood[]> {
  const supabase = createClient();
  if (!supabase) return [];
  const trimmed = query.trim();
  if (!trimmed) return [];
  // Use the same RPC but with showBranded = true and a permissive
  // setup so tier 3 also surfaces (helps with brand-name typos).
  // The RPC already handles the trigram floor.
  const { data, error } = await supabase.rpc('search_foods', {
    p_query: trimmed,
    p_user_id: null,
    p_region: null,
    p_language: 'en',
    p_category: null,
    p_subcategory: null,
    p_limit: limit,
    p_show_branded: true,
  });
  if (error) {
    console.error('search_foods suggestions failed:', error);
    return [];
  }
  return ((data ?? []) as Array<Record<string, unknown>>).map((r) => {
    const food = rowToFood(r);
    return {
      ...food,
      brand: (r.brand as string | null) ?? null,
      regions: (r.regions as string[] | null) ?? null,
      language: (r.language as string | null) ?? null,
      tier: (r.tier as number | null) ?? null,
      score: Number(r.score ?? 0),
    };
  });
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
  // Public foods first. Anything missing from the result (e.g. a
  // UUID belonging to user_custom_foods) falls back to a per-user
  // lookup, which is how favourites and meal bundles render names
  // for user-added foods.
  const { data, error } = await supabase
    .from('foods')
    .select(FOOD_COLS)
    .in('id', ids);
  if (error) {
    console.error('fetchFoodsByIds failed:', error);
    return [];
  }
  const found: Food[] = (data ?? []).map(rowToFood);
  const foundIds = new Set(found.map((f) => f.id));
  const missing = ids.filter((id) => !foundIds.has(id));
  if (missing.length === 0) return found;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: customRows, error: customErr } = await (supabase
    .from('user_custom_foods') as any)
    .select('*')
    .in('id', missing);
  if (customErr) {
    console.error('fetchFoodsByIds custom fallback failed:', customErr);
    return found;
  }
  const customs = ((customRows ?? []) as Array<Record<string, unknown>>).map(
    customRowToFood
  );
  return [...found, ...customs];
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