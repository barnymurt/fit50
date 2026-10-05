'use client';

// useCurrentCohort
//
// Reads the user's *live* (upcoming or active) cohort membership, if
// any. The hook re-fetches on auth change and on the custom
// 'fit50-cohort-membership-changed' window event so leaving or
// joining a cohort is reflected without a full page reload.
//
// "Live" here means status IN ('upcoming', 'active') — the unique
// partial index on cohort_memberships (user_id) WHERE status IN
// ('upcoming', 'active') guarantees at most one such row per user.
// "left" and "completed" rows are ignored; they're preserved for
// historical analytics.

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase';

export interface CurrentCohort {
  membershipId: string;
  cohortId: string;
  startDate: string;       // ISO date (YYYY-MM-DD)
  cohortName: string;      // e.g. "December 2025 cohort"
  signupsOpenAt: string;
  status: 'upcoming' | 'active';
  anonymousHandle: string;
  showDisplayName: boolean;
  // Computed client-side from startDate + today's local date so
  // the UI doesn't need to plumb the rest of useTrackerState.
  cohortDayNumber: number;  // 1..50, derived
}

export const COHORT_MEMBERSHIP_CHANGED_EVENT =
  'fit50-cohort-membership-changed';

export function useCurrentCohort(): {
  current: CurrentCohort | null;
  loaded: boolean;
} {
  const { user } = useAuth();
  const supabase = createClient();
  const [current, setCurrent] = useState<CurrentCohort | null>(null);
  const [loaded, setLoaded] = useState(false);

  const refetch = useCallback(async () => {
    if (!user || !supabase) {
      setCurrent(null);
      setLoaded(true);
      return;
    }
    // The query joins cohorts to get start_date + name. Single
    // round-trip via the FK. RLS scopes to rows where the caller
    // is a live member OR the cohort row itself.
    const { data, error } = await supabase
      .from('cohort_memberships')
      .select(
        'id, cohort_id, anonymous_handle, show_display_name, status, cohort:cohorts!inner(id, start_date, name, signups_open_at)'
      )
      .eq('user_id', user.id)
      .in('status', ['upcoming', 'active'])
      .order('joined_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) {
      console.error('useCurrentCohort fetch failed:', error);
      setCurrent(null);
      setLoaded(true);
      return;
    }
    if (!data) {
      setCurrent(null);
      setLoaded(true);
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cohort = (data as any).cohort as
      | { id: string; start_date: string; name: string; signups_open_at: string }
      | null;
    if (!cohort) {
      setCurrent(null);
      setLoaded(true);
      return;
    }
    // Day number: how many days between start_date (inclusive) and
    // today (inclusive), clamped to 1..50. 0 = day 0 (before
    // start_date), used by the UI to show a "starts in N days"
    // countdown.
    const start = new Date(cohort.start_date + 'T00:00:00');
    const now = new Date();
    const dayMs = 1000 * 60 * 60 * 24;
    const diffDays = Math.floor((now.getTime() - start.getTime()) / dayMs) + 1;
    const cohortDayNumber = Math.max(0, Math.min(50, diffDays));
    setCurrent({
      membershipId: (data as { id: string }).id,
      cohortId: cohort.id,
      startDate: cohort.start_date,
      cohortName: cohort.name,
      signupsOpenAt: cohort.signups_open_at,
      // status is narrowed to 'upcoming' | 'active' by the .in() filter
      status: (data as { status: 'upcoming' | 'active' }).status,
      anonymousHandle: (data as { anonymous_handle: string }).anonymous_handle,
      showDisplayName: (data as { show_display_name: boolean })
        .show_display_name,
      cohortDayNumber,
    });
    setLoaded(true);
  }, [user, supabase]);

  useEffect(() => {
    setLoaded(false);
    refetch();
  }, [refetch]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onChange = () => refetch();
    window.addEventListener(COHORT_MEMBERSHIP_CHANGED_EVENT, onChange);
    return () =>
      window.removeEventListener(
        COHORT_MEMBERSHIP_CHANGED_EVENT,
        onChange
      );
  }, [refetch]);

  return { current, loaded };
}
