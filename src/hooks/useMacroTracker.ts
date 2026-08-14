'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePremium } from './usePremium';
import { createClient } from '@/lib/supabase';
import {
  MacroProfile,
  MacroProfileInput,
} from './useMacroProfile';

/**
 * Premium-gated wrapper around useMacroProfile. Free-tier callers
 * (anon or non-premium auth) see `profile === null` and `isGated ===
 * true`. The UI can render a CTA card instead of the macro tracker.
 *
 * The raw useMacroProfile hook remains in use for the calculator at
 * /macrocalc, which is the unlock path. This hook is the daily-tracker
 * side.
 */
export function useMacroTracker() {
  const { user } = useAuth();
  const { isPremium } = usePremium();
  const supabase = createClient();
  const [profile, setProfile] = useState<MacroProfile | null>(null);
  const [loaded, setLoaded] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!user || !supabase || !isPremium) {
      setProfile(null);
      setLoaded(true);
      return;
    }
    const { data, error } = await supabase
      .from('macro_profile')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    if (error) {
      console.error('Failed to fetch macro profile:', error);
      setProfile(null);
      setLoaded(true);
      return;
    }
    setProfile((data as MacroProfile | null) ?? null);
    setLoaded(true);
  }, [user, supabase, isPremium]);

  useEffect(() => {
    setLoaded(false);
    fetchProfile();
  }, [fetchProfile]);

  const save = useCallback(
    async (input: MacroProfileInput): Promise<{ ok: boolean; error?: string }> => {
      if (!user) return { ok: false, error: 'Not signed in.' };
      if (!isPremium) {
        return { ok: false, error: 'Premium only. Unlock the macro tracker.' };
      }
      if (!supabase) return { ok: false, error: 'Supabase unavailable.' };
      const { error } = await supabase.from('macro_profile').upsert(
        {
          user_id: user.id,
          age: input.age,
          sex: input.sex,
          height_cm: input.height_cm,
          weight_kg: input.weight_kg,
          body_fat: input.body_fat,
          activity: input.activity,
          goal: input.goal,
          diet: input.diet,
          results_kcal: input.results.calories,
          results_protein: input.results.proteinG,
          results_carbs: input.results.carbsG,
          results_fat: input.results.fatG,
          results_water: input.results.waterL,
          calculated_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );
      if (error) {
        console.error('Failed to save macro profile:', error);
        return { ok: false, error: error.message };
      }
      await fetchProfile();
      return { ok: true };
    },
    [user, isPremium, supabase, fetchProfile]
  );

  return {
    profile,
    loaded,
    isGated: !isPremium,
    save,
    refetch: fetchProfile,
  };
}
