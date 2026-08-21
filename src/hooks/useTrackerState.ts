'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase';
import {
  CHALLENGE_DAYS,
  dateKeyLocal,
  dayIndexFromStart,
  dayKeyFromStart,
  previousDateOf,
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
 * Reconcile any pending taps whose `pendingTapsDateKey` doesn't
 * match `todayKey`. Those taps belong to an earlier day (typically
 * yesterday) — archive them to `closedDays[dayNumber]` for that day
 * and clear them. Returns the next TrackerDataV2 and the day number
 * the stale taps were archived under (or null if nothing stale).
 *
 * This is what fixes the bug where reopening the app on a new day
 * showed yesterday's tiles as still selected.
 */
function reconcileStalePendingTaps(
  data: TrackerDataV2,
  startDate: string,
  todayKey: string
): { next: TrackerDataV2; archivedDayNumber: number | null } {
  if (!data.pendingTapsDateKey) return { next: data, archivedDayNumber: null };
  if (data.pendingTapsDateKey === todayKey) return { next: data, archivedDayNumber: null };
  if (Object.keys(data.pendingTaps).length === 0) {
    return {
      next: { ...data, pendingTapsDateKey: null, pendingTaps: {} },
      archivedDayNumber: null,
    };
  }

  const staleDate = data.pendingTapsDateKey;
  const dayNumber = dayIndexFromStart(startDate, previousDateOf(staleDate));

  const existing = data.closedDays[dayNumber] || {};
  const archived: Record<string, boolean> = { ...existing, ...data.pendingTaps };

  return {
    next: {
      ...data,
      pendingTapsDateKey: null,
      pendingTaps: {},
      closedDays: { ...data.closedDays, [dayNumber]: archived },
    },
    archivedDayNumber: dayNumber,
  };
}

/**
 * Single source of truth for the Tracker. Replaces the old
 * `useSyncTracker`. Day number is derived from `startDate` every 60s,
 * not stored as state, so it cannot drift.
 *
 * Anon: localStorage only (`fit50-tracker-v2`). Auth: Supabase
 * `daily_state` (live taps) + `daily_totals` (archive) + `profiles.
 * challenge_started_at` (the anchor date).
 *
 * Two things this hook gets right that earlier ones didn't:
 *
 * 1. `pendingTapsDateKey` is stamped on every write so a stale
 *    pendingTaps blob (left over from a tab that was closed at
 *    midnight) gets archived to `closedDays` for the day it
 *    belonged to on the next boot, not shown as today's selections.
 *
 * 2. For auth users, `closedDays` is hydrated from Supabase
 *    `daily_totals` so a brand-new device sees the full history,
 *    not just whatever localStorage happened to cache.
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
        // Upsert so re-archiving the same day (e.g. user backfilled
        // after the rollover fired) doesn't 409.
        await (supabase.from('daily_totals') as any).upsert(rows, {
          onConflict: 'user_id,day_number,habit_id',
        });
      } catch (err) {
        console.error('daily_totals upsert failed:', err);
      }
    },
    [user, supabase]
  );

  const persistAuthDeleteDailyState = useCallback(
    async (dateKey: string) => {
      if (!user || !supabase) return;
      try {
        await (supabase.from('daily_state') as any)
          .delete()
          .eq('user_id', user.id)
          .eq('date_key', dateKey);
      } catch (err) {
        console.error('daily_state cleanup failed:', err);
      }
    },
    [user, supabase]
  );

  // ---------- Boot: load from anon storage or Supabase ----------

  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;

    const boot = async () => {
      const todayKey = localDateKey();

      if (!user) {
        const loadedAnon = loadTrackerV2(new Date());
        const base = loadedAnon ?? emptyTrackerV2();

        // Reconcile: if pendingTapsDateKey is stale, archive before
        // showing any UI.
        let next: TrackerDataV2 = base;
        if (base.startDate && base.pendingTapsDateKey && base.pendingTapsDateKey !== todayKey) {
          const reconciled = reconcileStalePendingTaps(base, base.startDate, todayKey);
          next = reconciled.next;
          saveTrackerV2(next);
        }

        if (cancelled) return;
        setData(next);
        setStartDate(next.startDate);
        todayKeyRef.current = todayKey;
        setLoaded(true);
        return;
      }

      // ---- Auth: merge local + server ----
      const localLoaded = loadTrackerV2(new Date());
      const localStart = localLoaded?.startDate ?? null;
      const localPending = localLoaded?.pendingTaps ?? {};
      const localClosed = localLoaded?.closedDays ?? {};
      const localStreakKeys = localLoaded?.streakUsedWeekKeys ?? [];
      const localPendingDateKey = localLoaded?.pendingTapsDateKey ?? null;
      const localWater = localLoaded?.waterByDate ?? {};

      let serverStart: string | null = null;
      let serverTaps: Record<string, boolean> = {};
      let serverClosed: Record<number, Record<string, boolean>> = {};
      const staleStateDatesToFlush: string[] = [];
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

        // Fetch ALL daily_state rows for this user. Today's rows
        // become serverTaps; rows for past dates are stale leftovers
        // from rollovers that never fired (tab closed at midnight),
        // and we recover them into closedDays + daily_totals below.
        try {
          const { data: stateRows, error } = await supabase
            .from('daily_state')
            .select('date_key, habit_id, tapped')
            .eq('user_id', user.id);
          if (error) {
            console.error('daily_state fetch failed:', error);
          } else {
            for (const r of stateRows || []) {
              if (r.date_key === todayKey) {
                serverTaps[r.habit_id] = r.tapped;
              } else if (r.date_key < todayKey) {
                staleStateDatesToFlush.push(r.date_key);
              }
            }
          }
        } catch (err) {
          console.error('daily_state fetch threw:', err);
        }

        // Hydrate the full day history from daily_totals. Without this,
        // an auth user signing in on a fresh device sees 0 completed
        // days and a 0-day streak even though their history is right
        // there in Supabase.
        try {
          const { data: totalRows, error } = await supabase
            .from('daily_totals')
            .select('day_number, habit_id, completed')
            .eq('user_id', user.id);
          if (error) {
            console.error('daily_totals fetch failed:', error);
          } else {
            (totalRows || []).forEach((r: { day_number: number; habit_id: string; completed: boolean }) => {
              if (!serverClosed[r.day_number]) serverClosed[r.day_number] = {};
              serverClosed[r.day_number][r.habit_id] = r.completed;
            });
          }
        } catch (err) {
          console.error('daily_totals fetch threw:', err);
        }
      }

      const start = serverStart ?? localStart ?? null;

      // Recover stale daily_state rows: attribute them to the day
      // number they belong to, merge into closedDays, upsert into
      // daily_totals, then delete the stale rows so the next boot
      // doesn't double-count.
      const mergedClosed: Record<number, Record<string, boolean>> = { ...serverClosed };
      if (start && supabase && staleStateDatesToFlush.length > 0) {
        try {
          const { data: stateRows } = await supabase
            .from('daily_state')
            .select('date_key, habit_id, tapped')
            .eq('user_id', user.id)
            .in('date_key', staleStateDatesToFlush);
          const rowsByDate: Record<string, Array<{ habit_id: string; tapped: boolean }>> = {};
          for (const r of stateRows || []) {
            if (!rowsByDate[r.date_key]) rowsByDate[r.date_key] = [];
            rowsByDate[r.date_key].push({ habit_id: r.habit_id, tapped: r.tapped });
          }
          const dailyTotalsRows: Array<{
            user_id: string;
            day_number: number;
            habit_id: string;
            completed: boolean;
            archived_at: string;
          }> = [];
          const archivedAt = new Date().toISOString();
          for (const [dateKey, rows] of Object.entries(rowsByDate)) {
            const dayNumber = dayIndexFromStart(start, previousDateOf(dateKey));
            if (dayNumber < 1 || dayNumber > 50) continue;
            mergedClosed[dayNumber] = { ...(mergedClosed[dayNumber] || {}) };
            for (const r of rows) {
              mergedClosed[dayNumber][r.habit_id] = r.tapped;
              dailyTotalsRows.push({
                user_id: user.id,
                day_number: dayNumber,
                habit_id: r.habit_id,
                completed: r.tapped,
                archived_at: archivedAt,
              });
            }
          }
          if (dailyTotalsRows.length > 0) {
            await (supabase.from('daily_totals') as any).upsert(dailyTotalsRows, {
              onConflict: 'user_id,day_number,habit_id',
            });
          }
          await (supabase.from('daily_state') as any)
            .delete()
            .eq('user_id', user.id)
            .in('date_key', staleStateDatesToFlush);
        } catch (err) {
          console.error('stale daily_state recovery failed:', err);
        }
      }

      // For today specifically, merge any localStorage taps that
      // happened to be cached but not yet uploaded (rare offline case).
      const localCurrentDay =
        start ? dayIndexFromStart(start, new Date()) : null;
      if (localCurrentDay !== null && localPendingDateKey === todayKey && Object.keys(localPending).length > 0) {
        mergedClosed[localCurrentDay] = {
          ...(mergedClosed[localCurrentDay] || {}),
          ...localPending,
        };
      }
      // Otherwise drop stale localPending entirely — we don't trust it.

      // For today's UI taps, prefer server (today's daily_state). Fall
      // back to localPending only if it carries the matching date key.
      const mergedPending: Record<string, boolean> =
        localPendingDateKey === todayKey
          ? { ...localPending, ...serverTaps }
          : { ...serverTaps };

      // If localStorage had pending taps for a stale date that the
      // server didn't flush yet (tab closed at midnight), archive them
      // now: flush to daily_totals, delete daily_state, merge into
      // closedDays, clear localStorage.
      if (localPendingDateKey && localPendingDateKey !== todayKey && Object.keys(localPending).length > 0 && start) {
        const staleDayNumber = dayIndexFromStart(start, previousDateOf(localPendingDateKey));
        try {
          await persistAuthInsertDailyTotals(staleDayNumber, localPending, new Date().toISOString());
        } catch (err) {
          console.error('stale daily_totals flush failed:', err);
        }
        try {
          await persistAuthDeleteDailyState(localPendingDateKey);
        } catch (err) {
          console.error('stale daily_state delete failed:', err);
        }
        mergedClosed[staleDayNumber] = {
          ...(mergedClosed[staleDayNumber] || {}),
          ...localPending,
        };
      }

      const hydrated: TrackerDataV2 = {
        schemaVersion: 2,
        startDate: start,
        pendingTapsDateKey: todayKey,
        pendingTaps: mergedPending,
        closedDays: mergedClosed,
        streakUsedWeekKeys: localStreakKeys,
        waterByDate: localWater,
      };

      if (cancelled) return;
      setData(hydrated);
      setStartDate(start);
      todayKeyRef.current = todayKey;
      saveTrackerV2(hydrated);

      if (start && supabase) {
        try {
          await (supabase.from('daily_state') as any).upsert(
            Object.entries(mergedPending).map(([habit_id, tapped]) => ({
              user_id: user.id,
              date_key: todayKey,
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
  }, [user, authLoading, supabase, persistAuthInsertDailyTotals, persistAuthDeleteDailyState]);

  // ---------- Day-rollover ticker ----------
  // Every 60s, re-derive the current date. If it changed, flush
  // yesterday's pending taps to closedDays (and to daily_totals on
  // Supabase) and clear pending taps.

  useEffect(() => {
    if (!loaded || !startDate) return;

    const checkRollover = async () => {
      const todayKey = localDateKey();
      if (todayKeyRef.current === todayKey) return;
      const previousKey = todayKeyRef.current ?? todayKey;
      todayKeyRef.current = todayKey;

      const yesterdayNumber =
        dayIndexFromStart(startDate, previousDateOf(previousKey));
      const yesterdayTaps = data.pendingTaps;

      setData((prev) => {
        const next: TrackerDataV2 = {
          ...prev,
          pendingTapsDateKey: todayKey,
          pendingTaps: {},
          closedDays: {
            ...prev.closedDays,
            [yesterdayNumber]: {
              ...(prev.closedDays[yesterdayNumber] || {}),
              ...yesterdayTaps,
            },
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
    };

    // Check on interval AND on tab focus. Browsers throttle
    // setInterval to once-per-minute when a tab is in the background,
    // so a user who leaves the tracker open overnight can return
    // to yesterday's tasks still selected. The visibilitychange
    // listener catches that case immediately.
    const interval = setInterval(checkRollover, 30_000);
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkRollover();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', onVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', onVisibility);
    };
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
        dateKey: dayKeyFromStart(startDate, i),
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
        const updated: TrackerDataV2 = {
          ...prev,
          startDate: next,
          pendingTapsDateKey: next ? localDateKey() : null,
          pendingTaps: {},
          closedDays: {},
        };
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
        const updated: TrackerDataV2 = {
          ...prev,
          pendingTapsDateKey: todayKeyValue,
          pendingTaps: nextPending,
        };
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

  const toggleHabitForDay = useCallback(
    (dayNumber: number, habitId: string) => {
      if (!startDate) return;
      const dateKey = dayKeyFromStart(startDate, dayNumber);
      setData((prev) => {
        const existing = prev.closedDays[dayNumber] || {};
        const isOn = existing[habitId] === true;
        const nextTaps: Record<string, boolean> = { ...existing };
        if (isOn) delete nextTaps[habitId];
        else nextTaps[habitId] = true;
        const updated: TrackerDataV2 = {
          ...prev,
          closedDays: {
            ...prev.closedDays,
            [dayNumber]: nextTaps,
          },
        };
        persistAnon(updated);
        if (user && supabase) {
          // Upsert the backfilled tap as the canonical record for that
          // date. The regular rollover flush writes to daily_totals; for
          // backfills we use daily_state directly (which the previous-day
          // flush cleans up only if the user reopens that day).
          (supabase.from('daily_state') as any)
            .upsert(
              {
                user_id: user.id,
                date_key: dateKey,
                habit_id: habitId,
                tapped: !isOn,
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'user_id,date_key,habit_id' }
            )
            .then(({ error }: { error: unknown }) => {
              if (error) console.error('daily_state backfill failed:', error);
            });
          // Mirror into daily_totals so the certificate / chip strip
          // counts backfills consistently.
          (supabase.from('daily_totals') as any)
            .upsert(
              {
                user_id: user.id,
                day_number: dayNumber,
                habit_id: habitId,
                completed: !isOn,
                archived_at: new Date().toISOString(),
              },
              { onConflict: 'user_id,day_number,habit_id' }
            )
            .then(({ error }: { error: unknown }) => {
              if (error) console.error('daily_totals backfill failed:', error);
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
        await (supabase.from('streak_protections') as any).upsert({
          user_id: user.id,
          week_start_date: weekKey,
          redeemed_day: currentDay,
        }, { onConflict: 'user_id,week_start_date' });
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
        'book_log',
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
    toggleHabitForDay,
    useStreakProtectionForWeek,
    reset,
  };
}

export { TRACKER_KEY, TRACKER_KEY_V1 };