'use client';

import { useEffect, useState } from 'react';
import { Food } from './types';

let cachedData: { version: number; foods: Food[] } | null = null;

async function loadFoodData(): Promise<{ version: number; foods: Food[] }> {
  if (cachedData) return cachedData;
  const mod = await import('./food-data.json');
  cachedData = mod.default as unknown as { version: number; foods: Food[] };
  return cachedData;
}

export function useFoodData() {
  const [data, setData] = useState<Food[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadFoodData().then((d) => {
      if (cancelled) return;
      setData(d.foods);
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return { foods: data, loaded };
}

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
      .filter((x) => x.s >= 0);
    scored.sort((a, b) => b.s - a.s);
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

export function getCategories(foods: Food[]): string[] {
  return Array.from(new Set(foods.map((f) => f.category))).sort();
}

export function getPreparations(foods: Food[]): string[] {
  return Array.from(
    new Set(foods.map((f) => f.preparation).filter(Boolean) as string[])
  ).sort();
}
