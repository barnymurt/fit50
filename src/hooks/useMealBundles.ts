'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Meal bundles: named collections of (food_id, portion_grams) pairs
 * the user logs together. The flow is:
 *   1. User logs 2+ items in a meal
 *   2. Clicks "Save as meal" on the recent-log row, names it
 *   3. Next time, taps "Log this meal" in the FoodDatabase panel,
 *      which inserts every item at the saved portions
 */

export interface MealBundleItem {
  food_id: string;
  portion_grams: number;
  position: number;
}

export interface MealBundle {
  id: string;
  name: string;
  created_at: string;
  last_logged_at: string;
  times_logged: number;
  items: MealBundleItem[];
}

export function useMealBundles() {
  const { user } = useAuth();
  const [bundles, setBundles] = useState<MealBundle[]>([]);
  const [bundlesLoaded, setBundlesLoaded] = useState(false);

  // Load on mount + when the user changes.
  useEffect(() => {
    if (!user) {
      setBundles([]);
      setBundlesLoaded(true);
      return;
    }
    const supabase = createClient();
    if (!supabase) {
      setBundlesLoaded(true);
      return;
    }
    let cancelled = false;
    (async () => {
      const [{ data: bundleRows, error: bundleErr }, { data: itemRows, error: itemErr }] =
        await Promise.all([
          supabase
            .from('meal_bundles')
            .select('id, name, created_at, last_logged_at, times_logged')
            .eq('user_id', user.id)
            .order('last_logged_at', { ascending: false }),
          supabase
            .from('meal_bundle_items')
            .select('bundle_id, food_id, portion_grams, position')
            .order('position', { ascending: true }),
        ]);
      if (cancelled) return;
      if (bundleErr) console.error('useMealBundles: bundle load failed', bundleErr);
      if (itemErr) console.error('useMealBundles: item load failed', itemErr);
      const byBundle = new Map<string, MealBundleItem[]>();
      for (const r of (itemRows ?? []) as (MealBundleItem & { bundle_id: string })[]) {
        const arr = byBundle.get(r.bundle_id) ?? [];
        arr.push({
          food_id: r.food_id,
          portion_grams: Number(r.portion_grams),
          position: r.position,
        });
        byBundle.set(r.bundle_id, arr);
      }
      const merged: MealBundle[] = (bundleRows ?? []).map((b: any) => ({
        id: b.id,
        name: b.name,
        created_at: b.created_at,
        last_logged_at: b.last_logged_at,
        times_logged: b.times_logged,
        items: byBundle.get(b.id) ?? [],
      }));
      setBundles(merged);
      setBundlesLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Insert a new bundle (with items). Returns the new id, or null on
  // failure / unauthenticated.
  const createBundle = useCallback(
    async (name: string, items: { food_id: string; portion_grams: number }[]): Promise<string | null> => {
      if (!user) return null;
      if (!name.trim() || items.length === 0) return null;
      const supabase = createClient();
      if (!supabase) return null;
      const { data, error } = await supabase
        .from('meal_bundles')
        .insert({ user_id: user.id, name: name.trim() })
        .select('id')
        .single();
      if (error || !data) {
        console.error('useMealBundles: create failed', error);
        return null;
      }
      const id = (data as { id: string }).id;
      const itemRows = items.map((it, idx) => ({
        bundle_id: id,
        food_id: it.food_id,
        portion_grams: it.portion_grams,
        position: idx,
      }));
      const { error: itemError } = await supabase
        .from('meal_bundle_items')
        .insert(itemRows);
      if (itemError) {
        console.error('useMealBundles: item insert failed', itemError);
        return null;
      }
      setBundles((prev) => [
        {
          id,
          name: name.trim(),
          created_at: new Date().toISOString(),
          last_logged_at: new Date().toISOString(),
          times_logged: 0,
          items: items.map((it, idx) => ({
            food_id: it.food_id,
            portion_grams: it.portion_grams,
            position: idx,
          })),
        },
        ...prev,
      ]);
      return id;
    },
    [user]
  );

  // Bump times_logged + last_logged_at after a successful log.
  const touchBundle = useCallback(
    async (id: string) => {
      const supabase = createClient();
      if (!supabase) return;
      const { data } = await supabase
        .from('meal_bundles')
        .select('times_logged')
        .eq('id', id)
        .single();
      const next = ((data as { times_logged: number } | null)?.times_logged ?? 0) + 1;
      await supabase
        .from('meal_bundles')
        .update({
          times_logged: next,
          last_logged_at: new Date().toISOString(),
        })
        .eq('id', id);
      setBundles((prev) =>
        prev.map((b) =>
          b.id === id
            ? { ...b, times_logged: next, last_logged_at: new Date().toISOString() }
            : b
        )
      );
    },
    []
  );

  // Update a bundle in place: rename it and/or replace its items.
  // Replaces the items in one transaction by deleting the old ones
  // and inserting the new set. We update the local state to match.
  const updateBundle = useCallback(
    async (
      id: string,
      name: string,
      items: { food_id: string; portion_grams: number }[]
    ): Promise<{ ok: boolean; error?: string }> => {
      if (!user) return { ok: false, error: 'Not signed in.' };
      const supabase = createClient();
      if (!supabase) return { ok: false, error: 'Database is not configured.' };
      if (!name.trim() || items.length === 0) {
        return { ok: false, error: 'Bundle needs a name and at least one item.' };
      }
      const trimmed = name.trim();
      const { error: nameErr } = await supabase
        .from('meal_bundles')
        .update({ name: trimmed })
        .eq('id', id)
        .eq('user_id', user.id);
      if (nameErr) {
        console.error('useMealBundles: rename failed', nameErr);
        return { ok: false, error: nameErr.message };
      }
      // Replace the items set: delete existing, insert new.
      const { error: delErr } = await supabase
        .from('meal_bundle_items')
        .delete()
        .eq('bundle_id', id);
      if (delErr) {
        console.error('useMealBundles: items clear failed', delErr);
        return { ok: false, error: delErr.message };
      }
      const itemRows = items.map((it, idx) => ({
        bundle_id: id,
        food_id: it.food_id,
        portion_grams: it.portion_grams,
        position: idx,
      }));
      const { error: insErr } = await supabase
        .from('meal_bundle_items')
        .insert(itemRows);
      if (insErr) {
        console.error('useMealBundles: items insert failed', insErr);
        return { ok: false, error: insErr.message };
      }
      setBundles((prev) =>
        prev.map((b) =>
          b.id === id
            ? {
                ...b,
                name: trimmed,
                items: items.map((it, idx) => ({
                  food_id: it.food_id,
                  portion_grams: it.portion_grams,
                  position: idx,
                })),
              }
            : b
        )
      );
      return { ok: true };
    },
    [user]
  );

  // Delete a bundle.
  const deleteBundle = useCallback(
    async (id: string) => {
      const supabase = createClient();
      if (!supabase) return;
      await supabase.from('meal_bundles').delete().eq('id', id);
      setBundles((prev) => prev.filter((b) => b.id !== id));
    },
    []
  );

  return {
    bundles,
    hydrated: bundlesLoaded,
    createBundle,
    updateBundle,
    touchBundle,
    deleteBundle,
  };
}