'use client';

import { useCallback, useEffect, useState } from 'react';
import { loadJson, saveJson } from '@/lib/storage';
import { MacroResults } from '@/components/macro-calculator/types';
import { MacroTargets } from '@/components/food-database/types';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase';

const STORAGE_KEY = 'fit50-macro-results-v1';
export const MACRO_RESULTS_CHANGED_EVENT = 'fit50-macro-results-changed';

const DEFAULT_FIBER_TARGET = 30;

export function useMacroTargets(): {
  targets: MacroTargets | null;
  loaded: boolean;
  setTargets: (m: MacroResults) => void;
} {
  const { user } = useAuth();
  const supabase = createClient();
  const [stored, setStored] = useState<MacroResults | null>(null);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    if (user && supabase) {
      try {
        const { data, error } = await supabase
          .from('macro_profile')
          .select('results_kcal, results_protein, results_carbs, results_fat, results_water')
          .eq('user_id', user.id)
          .maybeSingle();
        if (!error && data) {
          const fromServer: MacroResults = {
            // BMR / TDEE / burn estimates aren't stored on
            // macro_profile; the FoodDatabase doesn't read them, so
            // zero-fill is fine for the cached shape.
            bmr: 0,
            tdee: 0,
            calories: Number(data.results_kcal),
            proteinG: Number(data.results_protein),
            carbsG: Number(data.results_carbs),
            fatG: Number(data.results_fat),
            waterL: Number(data.results_water),
            workoutKcal: 0,
            steps10kKcal: 0,
          };
          setStored(fromServer);
          saveJson(STORAGE_KEY, fromServer);
          setLoaded(true);
          return;
        }
        if (error) {
          console.error('useMacroTargets: supabase fetch failed', error);
          // fall through to localStorage
        }
      } catch (err) {
        console.error('useMacroTargets: threw on supabase fetch', err);
      }
    }
    const local = loadJson<MacroResults | null>(STORAGE_KEY, null);
    setStored(local);
    setLoaded(true);
  }, [user, supabase]);

  useEffect(() => {
    refresh();
    window.addEventListener(MACRO_RESULTS_CHANGED_EVENT, refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener(MACRO_RESULTS_CHANGED_EVENT, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, [refresh]);

  const setTargets = (m: MacroResults) => {
    saveJson(STORAGE_KEY, m);
    setStored(m);
    window.dispatchEvent(new CustomEvent(MACRO_RESULTS_CHANGED_EVENT));
  };

  const targets: MacroTargets | null = stored
    ? {
        kcal: stored.calories,
        protein: stored.proteinG,
        carbs: stored.carbsG,
        fat: stored.fatG,
        fiber: DEFAULT_FIBER_TARGET,
        hasFiberTarget: true,
      }
    : null;

  return { targets, loaded, setTargets };
}
