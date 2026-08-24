'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Per-user, per-food memory of the last portion_grams the user
 * logged. FoodDetail pre-fills the grams input from this on open,
 * so the 80% case (logging the same thing again) is one tap.
 *
 * Falls back to null when not signed in or when there's no record
 * yet — UI should default to whatever its existing fallback is.
 */
export interface PortionPref {
  food_id: string;
  portion_grams: number;
  last_logged_at: string;
}

export function usePortionPrefs() {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<Record<string, number>>({});
  const [hydrated, setHydrated] = useState(false);

  // Load on mount + when the user changes.
  useEffect(() => {
    if (!user) {
      setPrefs({});
      setHydrated(true);
      return;
    }
    const supabase = createClient();
    if (!supabase) {
      setHydrated(true);
      return;
    }
    let cancelled = false;
    supabase
      .from('user_food_portion_prefs')
      .select('food_id, portion_grams, last_logged_at')
      .eq('user_id', user.id)
      .then(({ data, error }: { data: any; error: any }) => {
        if (cancelled) return;
        if (error) {
          console.error('usePortionPrefs: load failed', error);
          setHydrated(true);
          return;
        }
        const next: Record<string, number> = {};
        for (const r of (data ?? []) as PortionPref[]) {
          next[r.food_id] = Number(r.portion_grams);
        }
        setPrefs(next);
        setHydrated(true);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Save / upsert one portion record. Called from useFoodLog on
  // every successful add. Fire-and-forget so a save failure doesn't
  // block the UI confirmation.
  const rememberPortion = useCallback(
    async (food_id: string, portion_grams: number) => {
      if (!user) return;
      if (!Number.isFinite(portion_grams) || portion_grams <= 0) return;
      const supabase = createClient();
      if (!supabase) return;
      // Optimistic local update.
      setPrefs((p) => ({ ...p, [food_id]: portion_grams }));
      const { error } = await supabase
        .from('user_food_portion_prefs')
        .upsert(
          {
            user_id: user.id,
            food_id,
            portion_grams,
            last_logged_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,food_id' }
        );
      if (error) {
        console.error('usePortionPrefs: save failed', error);
      }
    },
    [user]
  );

  return {
    /** Last logged portion (grams) for this food, or null. */
    portionFor: (food_id: string): number | null => {
      const v = prefs[food_id];
      return v != null ? v : null;
    },
    rememberPortion,
    hydrated,
  };
}