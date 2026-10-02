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

// Dispatched after saveSteps / saveStepsForDate write to the
// local cache + Supabase. Every useDailySteps instance on the page
// (AccountWorkouts + FoodDatabase are both consumers) listens for
// this and re-reads its in-memory state from the local cache, so
// the food tracker's kcal target updates the moment the user saves
// steps in the workout section — without it, the second instance
// keeps showing the pre-save value until a full reload.
export const DAILY_STEPS_CHANGED_EVENT = 'fit50:daily-steps-changed';

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
  // Weight fallback. If the caller passes null we fetch
  // profiles.weight_kg ourselves so consumers like the food
  // tracker don't have to plumb the weight through. Callers that
  // already have it (AccountWorkouts) can keep passing it to skip
  // the round-trip.
  const [fetchedWeight, setFetchedWeight] = useState<number>(0);
  const effectiveWeight = weightKg ?? fetchedWeight;

  useEffect(() => {
    if (weightKg != null || !user || !supabase) return;
    let cancelled = false;
    (supabase.from('profiles') as any)
      .select('weight_kg')
      .eq('id', user.id)
      .maybeSingle()
      .then((res: { data: { weight_kg: number | null } | null; error: unknown }) => {
        if (cancelled || res.error) return;
        setFetchedWeight(Number(res.data?.weight_kg) || 0);
      });
    return () => {
      cancelled = true;
    };
  }, [weightKg, user, supabase]);

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
    //
    // Deps deliberately exclude `effectiveWeight`. Including it
    // caused a subtle bug: when the profile weight finishes loading
    // after the initial hydration, the dep would re-fire this
    // effect, the fetch would overwrite `steps` with whatever's in
    // the DB (frequently 0 on cold start), and the [steps] effect
    // in the consumer would wipe the user's typed stepsDraft —
    // making "save" appear broken. The history entries' extraKcal
    // is recomputed in a separate effect below when weight changes.
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
          // extraKcal = 0 placeholder; recomputed by the
          // weight-effect below so the first paint isn't blocked on
          // the profile fetch and the user's typed stepsDraft
          // can't be wiped by a stale re-fetch.
          .map((r) => ({
            date: r.date_key,
            steps: r.steps,
            extraKcal: 0,
          }));
        setHistory(hist);
        setHydrated(true);
      }
    );
    return () => {
      cancelled = true;
    };
  }, [dateKey, user, supabase, historyDays]);

  // Recompute extraKcal on every history entry once the user's
  // weight is known. Runs independently of the hydration effect so
  // a late-arriving weight doesn't re-fire the network fetch and
  // clobber local state. Cheap (50 entries × arithmetic).
  useEffect(() => {
    if (effectiveWeight <= 0) return;
    setHistory((prev) =>
      prev.map((e) =>
        e.extraKcal === stepsExtraKcal(e.steps, effectiveWeight)
          ? e
          : { ...e, extraKcal: stepsExtraKcal(e.steps, effectiveWeight) }
      )
    );
  }, [effectiveWeight]);

  // Cross-instance sync. AccountWorkouts and FoodDatabase each
  // have their own useDailySteps instance, so writing in one
  // doesn't update the other. saveSteps / saveStepsForDate dispatch
  // this event after persisting; every instance listens and
  // re-reads today's entry from the local cache (which saveSteps
  // already wrote) so the food tracker's kcal target updates
  // without a Supabase fetch.
  useEffect(() => {
    if (!dateKey) return;
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ dateKey?: string }>).detail;
      // Filter: only react to events for our dateKey. If the user
      // is backfilling a past day, that past-day's hook instance
      // should refresh; today's instance should ignore.
      if (detail?.dateKey && detail.dateKey !== dateKey) return;
      const cached = loadJson<DaySteps[]>(STORAGE_KEY, []);
      const local = cached.find((d) => d.date === dateKey);
      if (local) setSteps(local.steps);
    };
    window.addEventListener(DAILY_STEPS_CHANGED_EVENT, handler);
    return () =>
      window.removeEventListener(DAILY_STEPS_CHANGED_EVENT, handler);
  }, [dateKey]);

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
      // Broadcast so other useDailySteps instances on the page
      // (FoodDatabase) re-read their in-memory state. The local
      // cache is the freshest possible — we just wrote to it above
      // and the Supabase round-trip below is async.
      window.dispatchEvent(
        new CustomEvent(DAILY_STEPS_CHANGED_EVENT, {
          detail: { dateKey },
        })
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
      // Broadcast to other instances — see saveSteps above.
      window.dispatchEvent(
        new CustomEvent(DAILY_STEPS_CHANGED_EVENT, {
          detail: { dateKey: forDate },
        })
      );
      // In-memory history: replace if date already in list, otherwise
      // prepend (newest-first sort). Recomputes extraKcal with the
      // current weight so the kcal column stays accurate.
      setHistory((prev) => {
        const entry: StepsHistoryEntry = {
          date: forDate,
          steps: clamped,
          extraKcal: stepsExtraKcal(clamped, effectiveWeight ?? 0),
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
    [dateKey, user, supabase, effectiveWeight]
  );

  return {
    steps,
    stepsExtraKcal: stepsExtraKcal(steps, effectiveWeight ?? 0),
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
