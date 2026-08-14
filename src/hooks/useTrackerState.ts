'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase';
import {
  CHALLENGE_DAYS,
  dateKeyLocal,
  dayIndexFromStart,
} from '@/lib/dates';
import {
  TRACKER_KEY,
  TRACKER_KEY_V1,
  TrackerDataV2,
  emptyTrackerV2,
  loadTrackerV2,
  saveTrackerV2,
  wipeAllTrackerData,
} from '@/lib/storage';

const TICKER_INTERVAL_MS = 60_000;

/**
 * Dispatched on window after a successful reset() so other tracker-
 * related hooks (useStreakProtection, useFoodLog, …) know to
 * refetch their Supabase caches instead of showing stale data.
 */
export const TRACKER_RESET_EVENT = 'fit50-tracker-reset';

export interface TrackerDay {
  dayNumber: number;
  dateKey: string;
  taps: Record<string, boolean>;
  completedCount: number;
  status: 'future' | 'today' | 'past-incomplete' | 'complete';
}

function localDateKey(): string {
  return dateKeyLocal(new Date());
}

function weekKeyForDate(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = d.getDate() - day;
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

/**
 * Single source of truth for the Tracker. Replaces the old
 * `useSyncTracker`. Day number is derived from `startDate` every 60s,
 * not stored as state, so it cannot drift.
 *
 * Anon: localStorage only (`fit50-tracker-v2`). Auth: Supabase
 * `daily_state` (live taps) + `daily_totals` (archive) + `profiles.
 * challenge_started_at` (the anchor date).
 */
export function useTrackerState() {
  const { user, loading: authLoading } = useAuth();
  const supabase = createClient();

  const [data, setData] = useState<TrackerDataV2>(() => emptyTrackerV2());
  const [loaded, setLoaded] = useState(false);
  const [startDate, setStartDate] = useState<string | null>(null);
  const todayKeyRef = useRef<string | null>(null);

  // ---------- Persistence helpers ----------

  const persistAnon = useCallback((next: TrackerDataV2) => {
    saveTrackerV2(next);
  }, []);

  const persistAuthUpsertDailyState = useCallback(
    async (dateKey: string, taps: Record<string, boolean>) => {
      if (!user || !supabase) return;
      const rows = Object.entries(taps).map(([habit_id, tapped]) => ({
        user_id: user.id,
        date_key: dateKey,
        habit_id,
        tapped,
      }));
      if (rows.length === 0) return;
      try {
        await (supabase.from('daily_state') as any).upsert(rows, {
          onConflict: 'user_id,date_key,habit_id',
        });
      } catch (err) {
        console.error('daily_state upsert failed:', err);
      }
    },
    [user, supabase]
  );

  const persistAuthInsertDailyTotals = useCallback(
    async (
      dayNumber: number,
      taps: Record<string, boolean>,
      archivedAt: string
    ) => {
      if (!user || !supabase) return;
      const rows = Object.entries(taps).map(([habit_id, completed]) => ({
        user_id: user.id,
        day_number: dayNumber,
        habit_id,
        completed,
        archived_at: archivedAt,
      }));
      if (rows.length === 0) return;
      try {
        await (supabase.from('daily_totals') as any).insert(rows);
      } catch (err) {
        console.error('daily_totals insert failed:', err);
      }
    },
    [user, supabase]
  );

  // ---------- Boot: load from anon storage or Supabase ----------

  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;

    const boot = async () => {
      if (!user) {
        const loaded = loadTrackerV2(new Date());
        const next = loaded ?? emptyTrackerV2();
        if (cancelled) return;
        setData(next);
        setStartDate(next.startDate);
        todayKeyRef.current = localDateKey();
        setLoaded(true);
        return;
      }

      const localLoaded = loadTrackerV2(new Date());
      const localStart = localLoaded?.startDate ?? null;
      const localPending = localLoaded?.pendingTaps ?? {};
      const localClosed = localLoaded?.closedDays ?? {};
      const localStreakKeys = localLoaded?.streakUsedWeekKeys ?? [];

      let serverStart: string | null = null;
      let serverTaps: Record<string, boolean> = {};
      if (supabase) {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('challenge_started_at')
            .eq('id', user.id)
            .maybeSingle();
          serverStart = (profile as { challenge_started_at: string | null } | null)?.challenge_started_at ?? null;
        } catch (err) {
          console.error('profile fetch failed:', err);
        }

        const todayKey = localDateKey();
        try {
          const { data: stateRows, error } = await supabase
            .from('daily_state')
            .select('habit_id, tapped')
            .eq('user_id', user.id)
            .eq('date_key', todayKey);
          if (error) {
            console.error('daily_state fetch failed:', error);
          } else {
            (stateRows || []).forEach((r: { habit_id: string; tapped: boolean }) => {
              serverTaps[r.habit_id] = r.tapped;
            });
          }
        } catch (err) {
          console.error('daily_state fetch threw:', err);
        }
      }

      const start = serverStart ?? localStart ?? null;
      const mergedPending = { ...localPending, ...serverTaps };
      const mergedClosed = localClosed;

      if (cancelled) return;
      setData({
        schemaVersion: 2,
        startDate: start,
        pendingTaps: mergedPending,
        closedDays: mergedClosed,
        streakUsedWeekKeys: localStreakKeys,
        waterByDate: localLoaded?.waterByDate ?? {},
      });
      setStartDate(start);
      todayKeyRef.current = localDateKey();

      const authed = {
        schemaVersion: 2 as const,
        startDate: start,
        pendingTaps: mergedPending,
        closedDays: mergedClosed,
        streakUsedWeekKeys: localStreakKeys,
        waterByDate: localLoaded?.waterByDate ?? {},
      };
      saveTrackerV2(authed);

      if (start && supabase) {
        try {
          await (supabase.from('daily_state') as any).upsert(
            Object.entries(mergedPending).map(([habit_id, tapped]) => ({
              user_id: user.id,
              date_key: localDateKey(),
              habit_id,
              tapped,
            })),
            { onConflict: 'user_id,date_key,habit_id' }
          );
        } catch (err) {
          console.error('daily_state upsert after load failed:', err);
        }
      }
      if (!cancelled) setLoaded(true);
    };

    boot();
    return () => {
      cancelled = true;
    };
  }, [user, authLoading, supabase]);

  // ---------- Day-rollover ticker ----------
  // Every 60s, re-derive the current date. If it changed, flush
  // yesterday's pending taps to closedDays (and to daily_totals on
  // Supabase) and clear pending taps.

  useEffect(() => {
    if (!loaded || !startDate) return;

    const interval = setInterval(async () => {
      const todayKey = localDateKey();
      if (todayKeyRef.current === todayKey) return;
      const previousKey = todayKeyRef.current ?? todayKey;
      todayKeyRef.current = todayKey;

      const yesterdayNumber =
        dayIndexFromStart(startDate, previousDateOf(previousKey));
      const yesterdayTaps = data.pendingTaps;

      if (Object.keys(yesterdayTaps).length === 0 && data.closedDays[yesterdayNumber] === undefined) {
        // Nothing to flush
      }

      setData((prev) => {
        const next: TrackerDataV2 = {
          ...prev,
          pendingTaps: {},
          closedDays: {
            ...prev.closedDays,
            [yesterdayNumber]: yesterdayTaps,
          },
        };
        persistAnon(next);
        return next;
      });

      if (user && supabase) {
        await persistAuthInsertDailyTotals(
          yesterdayNumber,
          yesterdayTaps,
          new Date().toISOString()
        );
        try {
          await (supabase.from('daily_state') as any)
            .delete()
            .eq('user_id', user.id)
            .eq('date_key', previousKey);
        } catch (err) {
          console.error('daily_state cleanup failed:', err);
        }
      }
    }, TICKER_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [loaded, startDate, data.pendingTaps, data.closedDays, persistAnon, persistAuthInsertDailyTotals, user, supabase]);

  // ---------- Derived values ----------

  const now = new Date();
  const todayKey = useMemo(() => {
    if (!loaded) return '';
    return todayKeyRef.current ?? localDateKey();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, data.pendingTaps, startDate]);

  const currentDay = useMemo(
    () => dayIndexFromStart(startDate, now),
    [startDate]
  );

  const todayTaps = useMemo<Record<string, boolean>>(() => {
    return startDate ? data.pendingTaps : {};
  }, [data.pendingTaps, startDate]);

  const days: TrackerDay[] = useMemo(() => {
    if (!startDate) return [];
    const out: TrackerDay[] = [];
    for (let i = 1; i <= CHALLENGE_DAYS; i++) {
      const isToday = i === currentDay;
      const isPast = i < currentDay;
      const isFuture = i > currentDay;
      const closed = data.closedDays[i] || {};
      const taps = isToday
        ? { ...closed, ...todayTaps }
        : closed;
      const completedCount = Object.values(taps).filter(Boolean).length;
      let status: TrackerDay['status'];
      if (isFuture) status = 'future';
      else if (isToday) status = 'today';
      else if (completedCount >= 7) status = 'complete';
      else status = 'past-incomplete';
      out.push({
        dayNumber: i,
        dateKey: localDateKey() === todayKeyRef.current ? '' : '',
        taps,
        completedCount,
        status,
      });
    }
    return out;
  }, [startDate, currentDay, data.closedDays, todayTaps, todayKey]);

  // ---------- Mutations ----------

  const updateStartDate = useCallback(
    (next: string | null) => {
      setData((prev) => {
        const updated: TrackerDataV2 = { ...prev, startDate: next };
        persistAnon(updated);
        return updated;
      });
      setStartDate(next);
      if (user && supabase && next) {
        (supabase.from('profiles') as any)
          .update({ challenge_started_at: next })
          .eq('id', user.id)
          .then(({ error }: { error: unknown }) => {
            if (error) console.error('profile startDate update failed:', error);
          });
      }
    },
    [persistAnon, user, supabase]
  );

  const toggleHabit = useCallback(
    (habitId: string) => {
      if (!startDate) return;
      const todayKeyValue = localDateKey();
      setData((prev) => {
        const current = prev.pendingTaps[habitId] === true;
        const nextPending = { ...prev.pendingTaps };
        if (current) {
          delete nextPending[habitId];
        } else {
          nextPending[habitId] = true;
        }
        const updated: TrackerDataV2 = { ...prev, pendingTaps: nextPending };
        persistAnon(updated);
        if (user && supabase) {
          (supabase.from('daily_state') as any)
            .upsert(
              {
                user_id: user.id,
                date_key: todayKeyValue,
                habit_id: habitId,
                tapped: !current,
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'user_id,date_key,habit_id' }
            )
            .then(({ error }: { error: unknown }) => {
              if (error) console.error('daily_state toggle failed:', error);
            });
        }
        return updated;
      });
    },
    [persistAnon, startDate, user, supabase]
  );

  const useStreakProtectionForWeek = useCallback(async () => {
    if (!startDate || !user) return false;
    const weekKey = weekKeyForDate(new Date());
    if (data.streakUsedWeekKeys.includes(weekKey)) return false;
    setData((prev) => {
      const updated: TrackerDataV2 = {
        ...prev,
        streakUsedWeekKeys: [...prev.streakUsedWeekKeys, weekKey],
      };
      persistAnon(updated);
      return updated;
    });
    if (supabase) {
      try {
        await (supabase.from('streak_protections') as any).insert({
          user_id: user.id,
          week_start_date: weekKey,
          redeemed_day: currentDay,
        });
      } catch (err) {
        console.error('streak_protections insert failed:', err);
      }
    }
    return true;
  }, [data.streakUsedWeekKeys, persistAnon, startDate, user, supabase, currentDay]);

  const reset = useCallback(async () => {
    wipeAllTrackerData();
    if (user && supabase) {
      // Wipe all daily progress from Supabase. profile + macro_profile
      // + food_favorites are kept intact (those are user preferences,
      // not progress). Permission errors (RLS 42501) and "table not
      // found" (Postgres 42P01) are surfaced loudly — silent failures
      // here previously left streak_protections rows stranded after
      // a 'reset' and the streak card reported 'Used this week.'
      // despite the user clicking the button.
      const tables = [
        'daily_state',
        'daily_totals',
        'water_log',
        'streak_protections',
        'food_log',
      ];
      const results = await Promise.all(
        tables.map(async (table) => {
          const { error } = await (supabase.from(table) as any)
            .delete()
            .eq('user_id', user.id);
          return { table, error };
        })
      );
      results.forEach(({ table, error }) => {
        if (!error) return;
        console.error(`reset delete on ${table} failed:`, error);
        if (error.code === '42501') {
          console.error(
            `^ RLS denied the DELETE on ${table}. Run the latest ` +
            `migration in supabase/migrations/ to add the missing ` +
            `DELETE policy.`
          );
        }
      });
    }
    const fresh = emptyTrackerV2();
    setData(fresh);
    setStartDate(null);
    todayKeyRef.current = localDateKey();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(TRACKER_RESET_EVENT));
    }
  }, [user, supabase]);

  return {
    data,
    loaded,
    startDate,
    currentDay,
    todayKey,
    todayTaps,
    days,
    hasStarted: !!startDate,
    updateStartDate,
    toggleHabit,
    useStreakProtectionForWeek,
    reset,
  };
}

function previousDateOf(dateKey: string): Date {
  const [y, m, d] = dateKey.split('-').map(Number);
  if (!y || !m || !d) return new Date();
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() - 1);
  return dt;
}

export { TRACKER_KEY, TRACKER_KEY_V1 };
