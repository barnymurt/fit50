'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase';
import { loadJson, saveJson } from '@/lib/storage';

const STORAGE_KEY = 'fit50-water-v1';
const DAILY_GOAL_ML = 2500;

export interface DayWater {
  date: string; // YYYY-MM-DD
  amount: number; // ml
}

function todayKey() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Water log. Synced to Supabase (water_log table) for cross-device
 * mirroring, with localStorage as the offline cache and the source of
 * truth until the first Supabase read succeeds.
 */
export function useWaterLog() {
  const { user } = useAuth();
  const supabase = createClient();
  const [history, setHistory] = useState<DayWater[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // ---- hydration ----
  useEffect(() => {
    if (!user || !supabase) {
      // anon: localStorage only
      const saved = loadJson<DayWater[]>(STORAGE_KEY, []);
      setHistory(saved);
      setHydrated(true);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await (supabase.from('water_log') as any)
          .select('date_key, amount_ml')
          .order('date_key', { ascending: true });
        if (error) throw error;
        if (cancelled) return;
        const list: DayWater[] = (data || []).map((r: { date_key: string; amount_ml: number }) => ({
          date: r.date_key,
          amount: r.amount_ml,
        }));
        setHistory(list);
        // Mirror to localStorage as an offline cache.
        saveJson(STORAGE_KEY, list);
      } catch (err) {
        console.error('water_log fetch failed:', err);
        if (!cancelled) {
          const saved = loadJson<DayWater[]>(STORAGE_KEY, []);
          setHistory(saved);
        }
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, supabase]);

  // ---- persistence ----
  useEffect(() => {
    if (!hydrated) return;
    saveJson(STORAGE_KEY, history);
    if (user && supabase) {
      (async () => {
        const rows = history.map((d) => ({
          user_id: user.id,
          date_key: d.date,
          amount_ml: d.amount,
          updated_at: new Date().toISOString(),
        }));
        if (rows.length === 0) return;
        const { error } = await (supabase.from('water_log') as any)
          .upsert(rows, { onConflict: 'user_id,date_key' });
        if (error) console.error('water_log sync failed:', error);
      })();
    }
  }, [history, hydrated, user, supabase]);

  const today = todayKey();
  const todayAmount = history.find((d) => d.date === today)?.amount ?? 0;
  const fillPct = Math.min(100, Math.round((todayAmount / DAILY_GOAL_ML) * 100));
  const goalHit = todayAmount >= DAILY_GOAL_ML;

  const addWater = useCallback((ml: number) => {
    if (ml <= 0) return;
    setHistory((prev) => {
      const next = [...prev];
      const idx = next.findIndex((d) => d.date === today);
      if (idx >= 0) {
        next[idx] = { ...next[idx], amount: next[idx].amount + ml };
      } else {
        next.push({ date: today, amount: ml });
      }
      return next;
    });
  }, [today]);

  const removeLastLog = useCallback(() => {
    setHistory((prev) => {
      const next = [...prev];
      const idx = next.findIndex((d) => d.date === today);
      if (idx < 0) return prev;
      const current = next[idx].amount;
      const last = Math.max(0, current - 250);
      if (last === 0) {
        next.splice(idx, 1);
      } else {
        next[idx] = { ...next[idx], amount: last };
      }
      return next;
    });
  }, [today]);

  const resetToday = useCallback(() => {
    setHistory((prev) => prev.filter((d) => d.date !== today));
  }, [today]);

  return {
    history,
    hydrated,
    today,
    todayAmount,
    fillPct,
    goalHit,
    dailyGoalMl: DAILY_GOAL_ML,
    addWater,
    removeLastLog,
    resetToday,
  };
}
