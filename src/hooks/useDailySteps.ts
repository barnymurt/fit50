'use client';

// Daily step counts for the workout section's additional-burn
// calculator. Stored server-side in `daily_steps` (one row per
// user + day_key) so the macro analytics can fold the excess over
// 10k into the day's kcalUnderOverAdjusted.
//
// Pattern mirrors useWaterLog:
//   - Local cache in localStorage for offline / fast-render
//   - Server upsert in a fire-and-forget effect
//   - Re-render on save so the UI's kcal preview updates

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase';
import { loadJson, saveJson } from '@/lib/storage';

const STORAGE_KEY = 'fit50-steps-v1';

interface DaySteps {
  date: string;
  steps: number;
}

export interface StepsHistoryEntry extends DaySteps {
  extraKcal: number;
}

export function stepsExtraKcal(steps: number, weightKg: number): number {
  // Same MET math as the macro calculator's steps10kKcal — only the
  // excess over 10k baseline contributes additional burn.
  // steps10kKcal(W) = 3.5 × W × (7 / 5); we only credit the fraction
  // over 10k.
  const excess = Math.max(0, steps - 10000);
  if (excess <= 0 || !weightKg || weightKg <= 0) return 0;
  const steps10kKcal = 3.5 * weightKg * (7 / 5);
  return Math.round((excess / 10000) * steps10kKcal);
}

export function useDailySteps(
  dateKey: string | null,
  weightKg: number | null,
  historyDays = 50
) {
  const { user } = useAuth();
  const supabase = createClient();
  const [steps, setSteps] = useState<number>(0);
  const [hydrated, setHydrated] = useState(false);
  // Most recent N days of step entries, newest first. Each entry's
  // `extraKcal` is computed locally using the same formula as the
  // kcal balance so the history list and the kcal balance stay in
  // sync if the user later changes their weight.
  const [history, setHistory] = useState<StepsHistoryEntry[]>([]);

  // Hydrate from localStorage (immediate) then from Supabase (source
  // of truth, including cross-device edits).
  useEffect(() => {
    if (!dateKey) {
      setHydrated(true);
      return;
    }
    setHydrated(false);
    const cached = loadJson<DaySteps[]>(STORAGE_KEY, []);
    const local = cached.find((d) => d.date === dateKey);
    if (local) setSteps(local.steps);
    if (!user || !supabase) {
      setHydrated(true);
      return;
    }
    let cancelled = false;
    // Fetch today's entry + the recent-history window in parallel so
    // the per-day "Record of the 50 days" list and the today's input
    // both populate on first paint.
    const historyCutoff = new Date();
    historyCutoff.setDate(historyCutoff.getDate() - historyDays);
    const historyCutoffKey = `${historyCutoff.getFullYear()}-${String(
      historyCutoff.getMonth() + 1
    ).padStart(2, '0')}-${String(historyCutoff.getDate()).padStart(2, '0')}`;
    Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.from('daily_steps') as any)
        .select('steps')
        .eq('user_id', user.id)
        .eq('date_key', dateKey)
        .maybeSingle(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.from('daily_steps') as any)
        .select('date_key, steps')
        .eq('user_id', user.id)
        .gte('date_key', historyCutoffKey),
    ]).then(
      ([todayRes, histRes]: [
        { data: { steps: number } | null; error: unknown } | null,
        { data: Array<{ date_key: string; steps: number }> | null; error: unknown } | null
      ]) => {
        if (cancelled) return;
        if (todayRes?.error) {
          console.error('daily_steps fetch failed:', todayRes.error);
        } else if (todayRes?.data) {
          setSteps(todayRes.data.steps);
          saveJson(
            STORAGE_KEY,
            dedupAndSort([
              ...cached.filter((d) => d.date !== dateKey),
              { date: dateKey, steps: todayRes.data.steps },
            ])
          );
        }
        const rows: Array<{ date_key: string; steps: number }> =
          histRes?.data ?? [];
        const hist: StepsHistoryEntry[] = rows
          .filter((r) => r.date_key !== dateKey)
          .sort((a, b) => b.date_key.localeCompare(a.date_key))
          .map((r) => ({
            date: r.date_key,
            steps: r.steps,
            extraKcal: stepsExtraKcal(r.steps, weightKg ?? 0),
          }));
        setHistory(hist);
        setHydrated(true);
      }
    );
    return () => {
      cancelled = true;
    };
  }, [dateKey, user, supabase, weightKg, historyDays]);

  const saveSteps = useCallback(
    async (next: number) => {
      if (!dateKey || !user || !supabase) return;
      const clamped = Math.max(0, Math.min(99999, Math.floor(next)));
      // Optimistic local update so the kcal preview reflects the new
      // count immediately.
      setSteps(clamped);
      saveJson(
        STORAGE_KEY,
        dedupAndSort([
          ...loadJson<DaySteps[]>(STORAGE_KEY, []).filter(
            (d) => d.date !== dateKey
          ),
          { date: dateKey, steps: clamped },
        ])
      );
      try {
        const { error } = await (supabase.from('daily_steps') as any).upsert(
          {
            user_id: user.id,
            date_key: dateKey,
            steps: clamped,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,date_key' }
        );
        if (error) throw error;
      } catch (err) {
        console.error('daily_steps upsert failed:', err);
      }
    },
    [dateKey, user, supabase]
  );

  // Save steps for an arbitrary date. Used by the history-row edit
  // and the "+ Add for past day" flow. Updates the local cache,
  // refreshes the in-memory history list (so the UI updates without
  // a refetch), and mirrors to Supabase. When `forDate` matches
  // today's dateKey the today-state is also updated.
  const saveStepsForDate = useCallback(
    async (forDate: string, next: number) => {
      if (!user || !supabase || !forDate) return;
      // Reject future dates. We don't want users backfilling
      // tomorrow by accident.
      const todayStr = (() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      })();
      if (forDate > todayStr) return;
      const clamped = Math.max(0, Math.min(99999, Math.floor(next)));
      // Local cache: replace-or-insert.
      saveJson(
        STORAGE_KEY,
        dedupAndSort([
          ...loadJson<DaySteps[]>(STORAGE_KEY, []).filter(
            (d) => d.date !== forDate
          ),
          { date: forDate, steps: clamped },
        ])
      );
      // In-memory history: replace if date already in list, otherwise
      // prepend (newest-first sort). Recomputes extraKcal with the
      // current weight so the kcal column stays accurate.
      setHistory((prev) => {
        const entry: StepsHistoryEntry = {
          date: forDate,
          steps: clamped,
          extraKcal: stepsExtraKcal(clamped, weightKg ?? 0),
        };
        const existing = prev.find((e) => e.date === forDate);
        const next = existing
          ? prev.map((e) => (e.date === forDate ? entry : e))
          : [entry, ...prev];
        return next.sort((a, b) => b.date.localeCompare(a.date));
      });
      if (forDate === dateKey) {
        setSteps(clamped);
      }
      try {
        const { error } = await (supabase.from('daily_steps') as any).upsert(
          {
            user_id: user.id,
            date_key: forDate,
            steps: clamped,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,date_key' }
        );
        if (error) throw error;
      } catch (err) {
        console.error('daily_steps upsert failed:', err);
      }
    },
    [dateKey, user, supabase, weightKg]
  );

  return {
    steps,
    stepsExtraKcal: stepsExtraKcal(steps, weightKg ?? 0),
    saveSteps,
    saveStepsForDate,
    history,
    hydrated,
  };
}

function dedupAndSort(entries: DaySteps[]): DaySteps[] {
  const map = new Map<string, DaySteps>();
  for (const e of entries) map.set(e.date, e);
  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
}
