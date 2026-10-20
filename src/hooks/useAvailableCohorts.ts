'use client';

// useAvailableCohorts
//
// Lists cohort rows the user could join right now — i.e. sign-ups
// are open (signups_open_at <= today) and the cohort hasn't started
// yet (start_date >= today). The list is whatever the server
// returns after RLS filtering. Reads work for anonymous visitors
// too — the `cohorts` table is SELECT-visible via the public-read
// policy (migration 0047) since it contains only marketing columns.
//
// For the homepage cohort countdown, an optional `queryToday` lets
// the caller shift "today" so the section can render against any
// chosen calendar date — see `?date=` in
// `docs/user-stories/debug-cohort-date-override.md`. The override
// changes both the displayed day counter and the filter that
// determines which cohorts are returned.

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';

export interface AvailableCohort {
  id: string;
  name: string;
  start_date: string;
  signups_open_at: string;
}

export interface UseAvailableCohortsOpts {
  /**
   * Override "today" for the cohort query (YYYY-MM-DD). When
   * supplied, the filter window is computed against this date
   * instead of `new Date()`. Defaults to real today.
   */
  queryToday?: string;
}

export function useAvailableCohorts(opts?: UseAvailableCohortsOpts): {
  cohorts: AvailableCohort[];
  loaded: boolean;
} {
  const supabase = createClient();
  const [cohorts, setCohorts] = useState<AvailableCohort[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setCohorts([]);
      setLoaded(true);
      return;
    }
    let cancelled = false;
    const today =
      opts?.queryToday ?? new Date().toISOString().slice(0, 10);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb: any = supabase;
    (async () => {
      const { data } = await sb
        .from('cohorts')
        .select('id, name, start_date, signups_open_at')
        .lte('signups_open_at', today)
        .gte('start_date', today)
        .order('start_date', { ascending: true })
        .limit(4);
      if (cancelled) return;
      setCohorts(
        (data as AvailableCohort[] | null) ?? []
      );
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase, opts?.queryToday]);

  return { cohorts, loaded };
}
