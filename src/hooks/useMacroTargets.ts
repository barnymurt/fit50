'use client';

import { useEffect, useState } from 'react';
import { loadJson, saveJson } from '@/lib/storage';
import { MacroResults } from '@/components/macro-calculator/types';
import { MacroTargets } from '@/components/food-database/types';

const STORAGE_KEY = 'fit50-macro-results-v1';

const DEFAULT_FIBER_TARGET = 30;

export function useMacroTargets(): {
  targets: MacroTargets | null;
  loaded: boolean;
  setTargets: (m: MacroResults) => void;
} {
  const [stored, setStored] = useState<MacroResults | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setStored(loadJson<MacroResults | null>(STORAGE_KEY, null));
    setLoaded(true);
  }, []);

  const setTargets = (m: MacroResults) => {
    saveJson(STORAGE_KEY, m);
    setStored(m);
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
