'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { Staple, REGION_LABELS, Region, REGION_TAGS } from '@/components/food-database/types';

const STAPLES_COLS =
  'id, name, category, regions, kcal, protein, carbs, fat, fiber, serving_basis, standard_serving_label, aliases';

function rowToStaple(row: Record<string, unknown>): Staple {
  return {
    id: row.id as string,
    name: row.name as string,
    category: row.category as Staple['category'],
    regions: row.regions as Region[],
    kcal: row.kcal as number,
    protein: row.protein as number,
    carbs: row.carbs as number,
    fat: row.fat as number,
    fiber: row.fiber as number,
    servingBasis: (row.serving_basis as '100g' | '100ml') ?? '100g',
    standardServingLabel:
      (row.standard_serving_label as string | null) ?? undefined,
    aliases: (row.aliases as string[]) ?? [],
  };
}

// One fetch per region. The staples list is small (~80 rows) so the
// payload is tiny — caching by region is fine.
const cache = new Map<Region, Staple[]>();

/**
 * Curated "common foods" tier. Always surfaces at the top of the
 * search panel before the OFF corpus. Region-scoped: a UK user
 * sees Yorkshire tea; a US user sees Jif peanut butter.
 *
 * No auth check — the table is public-read and the data is the
 * same for everyone.
 */
export function useStaples(region: Region | null) {
  const [staples, setStaples] = useState<Staple[]>(() => {
    if (region && cache.has(region)) return cache.get(region)!;
    return [];
  });
  const [loaded, setLoaded] = useState(() => {
    if (region && cache.has(region)) return true;
    return false;
  });

  useEffect(() => {
    if (region && cache.has(region)) {
      setStaples(cache.get(region)!);
      setLoaded(true);
      return;
    }
    const supabase = createClient();
    if (!supabase) {
      setLoaded(true);
      return;
    }
    const tags = region ? REGION_TAGS[region] : null;
    let q = supabase.from('foods_staples').select(STAPLES_COLS);
    if (region && region !== 'worldwide' && tags && tags.length > 0) {
      q = q.overlaps('regions', [region]);
    }
    q
      .order('name', { ascending: true })
      .then(({ data, error }: { data: any; error: any }) => {
        if (error) {
          console.error('useStaples: query failed', error);
          return;
        }
        const rows = (data ?? []).map(rowToStaple);
        if (region) cache.set(region, rows);
        setStaples(rows);
        setLoaded(true);
      });
  }, [region]);

  return { staples, loaded, regionLabel: region ? REGION_LABELS[region] : '' };
}