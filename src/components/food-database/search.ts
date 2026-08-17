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
  preparation?: string | 'all';
  type?: string | 'all';
  favorites?: Set<string>;
  sort?: SortKey;
  sortDir?: 'asc' | 'desc';
  limit?: number;
}

function rowToFood(row: Record<string, unknown>): Food {
  return {
    id: row.id as string,
    name: row.name as string,
    // The legacy JSON has categories that aren't in the strict
    // FoodCategory union (e.g. "Pizza", "Grains & Pasta"). The DB
    // matches the JSON, so we cast through unknown.
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

// Hook returns the food list for a given search. The DB is the single
// source of truth, but in-memory caching is preserved (same as before)
// so navigating between views doesn't re-hit the network.
export function useFoodData() {
  const [foods, setFoods] = useState<Food[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadAllFoods()
      .then((list) => {
        if (cancelled) return;
        setFoods(list);
        setLoaded(true);
      })
      .catch((err) => {
        console.error('Failed to load foods:', err);
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { foods, loaded };
}

let cachedFoods: Food[] | null = null;

async function loadAllFoods(): Promise<Food[]> {
  if (cachedFoods) return cachedFoods;
  const supabase = createClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('foods')
    .select('id, name, category, subcategory, preparation, state, type, kcal, protein, carbs, fat, fiber, serving_basis, standard_serving_grams, standard_serving_label, aliases')
    .order('name', { ascending: true });

  if (error) {
    console.error('Foods load failed:', error);
    return [];
  }
  const list = (data ?? []).map(rowToFood);
  cachedFoods = list;
  return list;
}

// Server-friendly loader: fetch a single page of search results from
// Supabase. Used by the food search UI when the user is typing.
export async function searchFoodsRemote(
  options: SearchOptions
): Promise<Food[]> {
  const supabase = createClient();
  if (!supabase) return [];

  const {
    query,
    category = 'all',
    preparation = 'all',
    type = 'all',
    sort = 'relevance',
    sortDir = 'asc',
    limit = 80,
  } = options;

  let q = supabase.from('foods').select('id, name, category, subcategory, preparation, state, type, kcal, protein, carbs, fat, fiber, serving_basis, standard_serving_grams, standard_serving_label, aliases', { count: 'exact' });

  const trimmed = query.trim();
  if (trimmed.length > 0) {
    q = q.textSearch('search_text', trimmed, { type: 'websearch', config: 'simple' });
  }
  if (category !== 'all') q = q.eq('category', category);
  if (preparation !== 'all') q = q.eq('preparation', preparation);
  if (type !== 'all') q = q.eq('type', type);

  if (sort !== 'relevance' || trimmed.length === 0) {
    const dir = sortDir === 'asc' ? true : false;
    const col = sort === 'kcal' ? 'kcal'
      : sort === 'protein' ? 'protein'
      : sort === 'carbs' ? 'carbs'
      : sort === 'fat' ? 'fat'
      : sort === 'fiber' ? 'fiber'
      : 'name';
    q = q.order(col, { ascending: dir });
  } else {
    // Websearch returns results ranked by ts_rank internally
    q = q.order('name', { ascending: true });
  }

  q = q.limit(limit);

  const { data, error } = await q;
  if (error) {
    console.error('Food search failed:', error);
    return [];
  }
  return (data ?? []).map(rowToFood);
}

// In-memory variant used for client-side memo sorting when no remote
// query is needed (e.g. "show all in this category, sorted by name").
export function searchFoods(
  foods: Food[],
  options: SearchOptions
): Food[] {
  const {
    query,
    category = 'all',
    preparation = 'all',
    type = 'all',
    favorites,
    sort = 'relevance',
    sortDir = 'asc',
  } = options;

  const tokens = tokenize(query);

  let filtered = foods.filter((f) => {
    if (category !== 'all' && f.category !== category) return false;
    if (preparation !== 'all' && f.preparation !== preparation) return false;
    if (type !== 'all' && f.type !== type) return false;
    return true;
  });

  if (tokens.length > 0) {
    const scored = filtered
      .map((f) => ({ f, s: scoreFood(f, tokens) }))
      .filter((x) => x.s >= 0)
      .sort((a, b) => b.s - a.s);
    filtered = scored.map((x) => x.f);
  } else if (sort === 'relevance' && favorites) {
    const favs: Food[] = [];
    const rest: Food[] = [];
    for (const f of filtered) {
      (favorites.has(f.id) ? favs : rest).push(f);
    }
    filtered = [...favs, ...rest];
  }

  if (sort !== 'relevance' || tokens.length === 0) {
    const dir = sortDir === 'asc' ? 1 : -1;
    filtered = [...filtered].sort((a, b) => {
      const av = (a as unknown as Record<string, number>)[sort] ?? 0;
      const bv = (b as unknown as Record<string, number>)[sort] ?? 0;
      if (typeof av === 'string') return String(av).localeCompare(String(bv)) * dir;
      return (av - bv) * dir;
    });
  }

  return filtered;
}

function tokenize(q: string): string[] {
  return q
    .toLowerCase()
    .split(/\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function scoreFood(food: Food, tokens: string[]): number {
  if (tokens.length === 0) return 0;
  const lower = (v: unknown) => (typeof v === 'string' ? v : '').toLowerCase();
  const name = lower(food.name);
  const category = lower(food.category);
  const subcategory = lower(food.subcategory);
  const preparation = lower(food.preparation);
  const state = lower(food.state);
  const aliases = (food.aliases || []).map(lower);

  let score = 0;
  for (const t of tokens) {
    if (name === t) score += 100;
    else if (name.startsWith(t)) score += 50;
    else if (name.includes(t)) score += 20;
    else if (aliases.some((a) => a === t)) score += 15;
    else if (aliases.some((a) => a.includes(t))) score += 8;
    else if (category.includes(t)) score += 5;
    else if (subcategory.includes(t)) score += 4;
    else if (preparation.includes(t)) score += 3;
    else if (state.includes(t)) score += 2;
    else return -1;
  }
  return score;
}

export function getCategories(foods: Food[]): string[] {
  return Array.from(new Set(foods.map((f) => f.category))).sort();
}

export function getPreparations(foods: Food[]): string[] {
  return Array.from(
    new Set(foods.map((f) => f.preparation).filter(Boolean) as string[])
  ).sort();
}
