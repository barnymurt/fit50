'use client';

// useAvailableCohorts
//
// Lists cohort rows the signed-in user could join right now — i.e.
// sign-ups are open (signups_open_at <= today) and the cohort
// hasn't started yet (start_date >= today). The list is whatever
// the server returns after RLS filtering; since cohorts are
// SELECT-visible to any signed-in user, the response is the
// full upcoming list (no per-user scoping needed — the join API
// rejects with 409 if the user is already in another live cohort).

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase';

export interface AvailableCohort {
  id: string;
  name: string;
  start_date: string;
  signups_open_at: string;
}

export function useAvailableCohorts(): {
  cohorts: AvailableCohort[];
  loaded: boolean;
} {
  const { user } = useAuth();
  const supabase = createClient();
  const [cohorts, setCohorts] = useState<AvailableCohort[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user || !supabase) {
      setCohorts([]);
      setLoaded(true);
      return;
    }
    let cancelled = false;
    const today = new Date().toISOString().slice(0, 10);
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
  }, [user, supabase]);

  return { cohorts, loaded };
}
