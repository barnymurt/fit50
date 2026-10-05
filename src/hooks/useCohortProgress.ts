'use client';

// useCohortProgress
//
// Reads aggregated progress for a single cohort. The hook fires the
// three queries the cohort UI surfaces need:
//
//   1. Per-habit completion counts for today (CohortTodayPanel's
//      9-cell row).
//   2. Per-day 9/9 strict-completion count (CohortArc's 50 cells).
//   3. "Still going" count — members who have at least one habit
//      row in `daily_totals` in the last 4 days, used under the arc
//      as the "X of 80 still going" line.
//
// Re-fetches on auth change, on the cohort-membership-changed event
// (so it picks up join/leave/preference changes immediately), and
// on tab focus / visibilitychange (so the numbers catch up when the
// user returns to the page after tapping a habit on another tab).
//
// The three queries all join on cohort_memberships to scope the
// read to members of the requested cohort. RLS already enforces
// this — the caller can only SELECT the rows their cohort-mate
// policy permits — but doing the join explicitly is cheaper than
// letting Postgres filter in a later step.

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase';
import { COHORT_MEMBERSHIP_CHANGED_EVENT } from './useCurrentCohort';

export interface CohortProgress {
  loaded: boolean;
  // Per-habit completion count for "today" (the cohort's local day,
  // not the user's). Keys are habit_ids from HABIT_IDS; values are
  // counts of members who have that habit row for that day with
  // completed = true. 0 if nobody did it.
  todayPerHabit: Record<string, number>;
  // Per-day 9/9 strict-completion count, indexed by day number
  // (1..50). Days with no completers are omitted from the map.
  arcStrictCounts: Record<number, number>;
  // "Still going" — distinct user_ids with ≥ 1 habit row in the
  // last 4 days. The cohort's local "today" is day N; "last 4 days"
  // means day_number IN (N-3, N-2, N-1, N).
  stillGoing: number;
  // Active cohort size (status = 'active' or 'upcoming'). Denominator
  // for the "X of Y" headlines.
  cohortSize: number;
}

const STILL_GOING_WINDOW_DAYS = 4;

export function useCohortProgress(
  cohortId: string | null,
  cohortStartDate: string | null
): CohortProgress {
  const { user } = useAuth();
  const supabase = createClient();
  const [state, setState] = useState<CohortProgress>({
    loaded: false,
    todayPerHabit: {},
    arcStrictCounts: {},
    stillGoing: 0,
    cohortSize: 0,
  });

  const refetch = useCallback(async () => {
    if (!user || !supabase || !cohortId || !cohortStartDate) {
      setState({
        loaded: true,
        todayPerHabit: {},
        arcStrictCounts: {},
        stillGoing: 0,
        cohortSize: 0,
      });
      return;
    }

    // Compute "today" relative to the cohort's start date. The arc
    // is per-cohort-day-number, not per-calendar-day, so the
    // "today" panel is the habit rows for the same day number the
    // cohort is currently on. Members out of step (their local clock
    // differs from cohort start by a few hours) will still show up
    // — they just contribute to the next day if they're far enough
    // behind.
    const startMs = new Date(cohortStartDate + 'T00:00:00').getTime();
    const dayMs = 1000 * 60 * 60 * 24;
    const cohortDayNumber = Math.floor(
      (Date.now() - startMs) / dayMs
    ) + 1;
    const safeDay = Math.max(1, Math.min(50, cohortDayNumber));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb: any = supabase;

    // First fetch the cohort's live-member user_ids, then the
    // four data queries in parallel. The user_ids fetch is a
    // single small round-trip and lets the per-habit query filter
    // properly without nested-select gymnastics (Supabase doesn't
    // support raw string subqueries in `.in()`).
    const membersRes = await sb
      .from('cohort_memberships')
      .select('user_id')
      .eq('cohort_id', cohortId)
      .in('status', ['upcoming', 'active']);
    const memberIds: string[] = (
      (membersRes.data as Array<{ user_id: string }> | null) || []
    ).map((r) => r.user_id);

    if (memberIds.length === 0) {
      setState({
        loaded: true,
        todayPerHabit: {},
        arcStrictCounts: {},
        stillGoing: 0,
        cohortSize: 0,
      });
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb2: any = supabase;
    const [todayRes, arcRes, stillGoingRes, sizeRes] = await Promise.all([
      // (1) Per-habit completion for today. Scoped to live
      // members by the in() filter.
      sb2
        .from('daily_totals')
        .select('habit_id')
        .eq('day_number', safeDay)
        .eq('completed', true)
        .in('user_id', memberIds),
      // (2) Per-day 9/9 strict count via SECURITY DEFINER RPC.
      sb.rpc('cohort_arc_strict_counts', { p_cohort_id: cohortId }),
      // (3) "Still going" — distinct members active in the
      // last 4 day_numbers.
      sb.rpc('cohort_still_going', {
        p_cohort_id: cohortId,
        p_window_days: STILL_GOING_WINDOW_DAYS,
      }),
      // (4) Cohort size = live member count (denominator).
      // Computed client-side from the already-fetched memberIds.
      Promise.resolve({ count: memberIds.length }),
    ]);

    const todayPerHabit: Record<string, number> = {};
    for (const r of (todayRes.data as Array<{ habit_id: string }>) || []) {
      todayPerHabit[r.habit_id] = (todayPerHabit[r.habit_id] || 0) + 1;
    }

    const arcStrictCounts: Record<number, number> = {};
    for (const r of (arcRes.data as Array<{
      day_number: number;
      completers: number;
    }>) || []) {
      arcStrictCounts[r.day_number] = r.completers;
    }

    const stillGoing = Number(
      (stillGoingRes.data as number | null) ?? 0
    );

    const cohortSize = (sizeRes as { count: number }).count;

    setState({
      loaded: true,
      todayPerHabit,
      arcStrictCounts,
      stillGoing,
      cohortSize,
    });
  }, [user, supabase, cohortId, cohortStartDate]);

  useEffect(() => {
    setState((s) => ({ ...s, loaded: false }));
    refetch();
  }, [refetch]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onChange = () => refetch();
    const onVisible = () => {
      if (document.visibilityState === 'visible') refetch();
    };
    window.addEventListener(COHORT_MEMBERSHIP_CHANGED_EVENT, onChange);
    window.addEventListener('focus', refetch);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener(COHORT_MEMBERSHIP_CHANGED_EVENT, onChange);
      window.removeEventListener('focus', refetch);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [refetch]);

  return state;
}
