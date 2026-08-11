'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase';
import { Activity, Diet, Goal, Sex } from '@/components/macro-calculator/types';
import { MacroResults } from '@/components/macro-calculator/types';

export interface MacroProfileInput {
  age: number;
  sex: Sex;
  height_cm: number;
  weight_kg: number;
  body_fat: number | null;
  activity: Activity;
  goal: Goal;
  diet: Diet;
  results: MacroResults;
}

export interface MacroProfile {
  user_id: string;
  age: number;
  sex: Sex;
  height_cm: number;
  weight_kg: number;
  body_fat: number | null;
  activity: Activity;
  goal: Goal;
  diet: Diet;
  results_kcal: number;
  results_protein: number;
  results_carbs: number;
  results_fat: number;
  results_water: number;
  calculated_at: string;
}

export function useMacroProfile() {
  const { user } = useAuth();
  const supabase = createClient();
  const [profile, setProfile] = useState<MacroProfile | null>(null);
  const [loaded, setLoaded] = useState(false);

  const refetch = useCallback(async () => {
    if (!user || !supabase) {
      setProfile(null);
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
      return;
    }
    setProfile((data as MacroProfile | null) ?? null);
  }, [user, supabase]);

  useEffect(() => {
    setLoaded(false);
    refetch().then(() => setLoaded(true));
  }, [refetch]);

  const save = useCallback(
    async (input: MacroProfileInput): Promise<{ ok: boolean; error?: string }> => {
      if (!user || !supabase) {
        return { ok: false, error: 'Not signed in.' };
      }
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
      await refetch();
      return { ok: true };
    },
    [user, supabase, refetch]
  );

  const clear = useCallback(async () => {
    if (!user || !supabase) return;
    await supabase.from('macro_profile').delete().eq('user_id', user.id);
    await refetch();
  }, [user, supabase, refetch]);

  return { profile, loaded, save, clear, refetch };
}

export function timeSince(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - then);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}
