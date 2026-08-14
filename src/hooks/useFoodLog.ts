'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase';
import {
  FoodLogEntry,
  DailyTotals,
  Meal,
  dayKeyFor,
  sumLog,
} from '@/components/food-database/types';

export function useFoodLog() {
  const { user } = useAuth();
  const supabase = createClient();
  const [entries, setEntries] = useState<FoodLogEntry[]>([]);
  const [loaded, setLoaded] = useState(false);
  // Reactive: updated on mount, on auth change, and whenever the
  // day-rollover tick detects a new local date. Before this was a
  // useMemo(..., []) so todayEntries kept filtering on yesterday's
  // date_key after midnight and the bar froze.
  const [today, setToday] = useState<string>(() => dayKeyFor());

  const refetch = useCallback(async () => {
    if (!user || !supabase) return;
    const { data, error } = await supabase
      .from('food_log')
      .select('*')
      .eq('user_id', user.id)
      .order('logged_at', { ascending: false });
    if (error) {
      console.error('Failed to fetch food log:', error);
      return;
    }
    setEntries((data as FoodLogEntry[]) || []);
  }, [user, supabase]);

  useEffect(() => {
    if (!user || !supabase) {
      setEntries([]);
      setLoaded(true);
      return;
    }
    setLoaded(false);
    setToday(dayKeyFor());
    refetch().then(() => setLoaded(true));
  }, [user, supabase, refetch]);

  // When the local date rolls over midnight, refetch so today's
  // totals and the recently-logged list reflect the new day.
  useEffect(() => {
    let lastDayKey = dayKeyFor();
    const onTick = () => {
      const current = dayKeyFor();
      if (current !== lastDayKey) {
        lastDayKey = current;
        setToday(current);
        refetch();
      }
    };
    const id = setInterval(onTick, 30 * 1000);
    window.addEventListener('focus', onTick);
    document.addEventListener('visibilitychange', onTick);
    return () => {
      clearInterval(id);
      window.removeEventListener('focus', onTick);
      document.removeEventListener('visibilitychange', onTick);
    };
  }, [refetch]);

  const addEntry = useCallback(
    async (input: {
      food_id: string;
      name: string;
      grams: number;
      kcal: number;
      protein: number;
      carbs: number;
      fat: number;
      fiber: number;
      meal: Meal | null;
    }): Promise<{ ok: boolean; error?: string; entry?: FoodLogEntry }> => {
      if (!user) return { ok: false, error: 'Not signed in.' };
      if (!supabase) return { ok: false, error: 'Database is not configured.' };
      const { data, error } = await supabase
        .from('food_log')
        .insert({
          user_id: user.id,
          food_id: input.food_id,
          name: input.name,
          grams: input.grams,
          kcal: input.kcal,
          protein: input.protein,
          carbs: input.carbs,
          fat: input.fat,
          fiber: input.fiber,
          meal: input.meal,
          day_key: dayKeyFor(),
        })
        .select('*')
        .single();
      if (error) {
        console.error('Failed to add food log entry:', error);
        return {
          ok: false,
          error: friendlyInsertError(error),
        };
      }
      await refetch();
      return { ok: true, entry: data as FoodLogEntry };
    },
    [user, supabase, refetch]
  );

  const removeEntry = useCallback(
    async (id: string) => {
      if (!user || !supabase) return;
      const { error } = await supabase
        .from('food_log')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      if (error) {
        console.error('Failed to delete food log entry:', error);
        return;
      }
      await refetch();
    },
    [user, supabase, refetch]
  );

  const todayEntries = useMemo(
    () => entries.filter((e) => e.day_key === today),
    [entries, today]
  );
  const todayTotals: DailyTotals = useMemo(() => sumLog(todayEntries), [todayEntries]);

  const recent = useMemo(() => {
    const seen = new Set<string>();
    const out: FoodLogEntry[] = [];
    for (const e of entries) {
      if (seen.has(e.food_id)) continue;
      seen.add(e.food_id);
      out.push(e);
      if (out.length >= 10) break;
    }
    return out;
  }, [entries]);

  return {
    entries,
    todayEntries,
    todayTotals,
    recent,
    loaded,
    addEntry,
    removeEntry,
    refetch,
  };
}

function friendlyInsertError(err: { code?: string; message?: string }): string {
  const msg = err?.message || '';
  if (/relation.*does not exist/i.test(msg) || err?.code === '42P01') {
    return "The 'food_log' table doesn't exist yet. Run supabase/migrations/0003_food_log.sql in the Supabase SQL editor.";
  }
  if (/row.level security/i.test(msg) || err?.code === '42501') {
    return 'Permission denied. Make sure you ran the migration (it sets up RLS policies).';
  }
  return msg || 'Could not save the food entry.';
}
