'use client';

import { useEffect, useState } from 'react';
import { Food } from '@/components/food-database/types';

// In-memory cache so the dynamic import only runs once per page load.
let localFoodsCache: Food[] | null = null;
let localFoodsPromise: Promise<Food[]> | null = null;

export interface LocalFoods {
  foods: Food[];
  loaded: boolean;
}

/**
 * Loads the bundled food-data.json (5K UK/IE curated foods). The
 * file is ~2 MB so we lazy-import it on first call and cache the
 * result for the rest of the session. Returned alongside the OFF
 * corpus by FoodSearch so the user sees both tiers when searching.
 */
export function useLocalFoods(): LocalFoods {
  const [foods, setFoods] = useState<Food[]>(() => localFoodsCache ?? []);
  const [loaded, setLoaded] = useState(() => localFoodsCache !== null);

  useEffect(() => {
    if (localFoodsCache) {
      setFoods(localFoodsCache);
      setLoaded(true);
      return;
    }
    if (!localFoodsPromise) {
      localFoodsPromise = import('@/components/food-database/food-data.json').then((mod) => {
        const data = (mod.default ?? mod) as { foods: Food[] };
        return data.foods;
      });
    }
    let cancelled = false;
    localFoodsPromise
      .then((f) => {
        if (cancelled) return;
        localFoodsCache = f;
        setFoods(f);
        setLoaded(true);
      })
      .catch((err) => {
        console.error('useLocalFoods: failed to load food-data.json', err);
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { foods, loaded };
}

/**
 * Normalize a food name for dedup comparisons: lowercase, collapse
 * whitespace, strip a small set of punctuation.
 */
export function normalizeFoodName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[.,'"!?()]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Filter the local bundled foods by query + category + subcategory.
 * Uses the same FTS-style prefix-match as the server-side search
 * so the UX is consistent.
 */
export function filterLocalFoods(
  foods: Food[],
  query: string,
  category: string,
  subcategory: string
): Food[] {
  const tokens = query
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.replace(/[^a-zA-Z0-9]/g, ''))
    .filter((w) => w.length > 0);
  return foods.filter((f) => {
    if (category !== 'all' && f.category !== category) return false;
    if (subcategory !== 'all' && f.subcategory !== subcategory) return false;
    if (tokens.length === 0) return true;
    const name = f.name.toLowerCase();
    const aliases = (f.aliases ?? []).map((a) => a.toLowerCase());
    return tokens.every((t) =>
      name.includes(t) || aliases.some((a) => a.includes(t))
    );
  });
}

/**
 * Merge OFF results with local-food results, deduping by
 * normalized name (local foods win on ties so the curated
 * numbers surface instead of the OFF product's).
 */
export function mergeFoodResults(
  off: Food[],
  local: Food[]
): Food[] {
  if (off.length === 0) return local;
  if (local.length === 0) return off;
  const seen = new Set<string>();
  const out: Food[] = [];
  for (const f of local) {
    const key = normalizeFoodName(f.name);
    if (!seen.has(key)) {
      seen.add(key);
      out.push(f);
    }
  }
  for (const f of off) {
    const key = normalizeFoodName(f.name);
    if (!seen.has(key)) {
      seen.add(key);
      out.push(f);
    }
  }
  return out;
}