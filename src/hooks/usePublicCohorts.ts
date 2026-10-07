'use client';

// usePublicCohorts
//
// Read-side hook for the public landing surfaces (no sign-in
// required). Returns rows where sign-ups are open (signups_open_at
// <= today) and the cohort hasn't started yet (start_date >=
// today). Sorted by start_date ascending.
//
// The cohorts table RLS allows this since migration 0047 (true on
// SELECT). cohort_memberships is unchanged — it stays gated to
// own-cohort-mate reads, so this hook never surfaces per-user
// data.

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';

export interface PublicCohort {
  id: string;
  name: string;
  start_date: string;
  signups_open_at: string;
}

export function usePublicCohorts(): {
  cohorts: PublicCohort[];
  loaded: boolean;
} {
  const supabase = createClient();
  const [cohorts, setCohorts] = useState<PublicCohort[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!supabase) {
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
        .limit(6);
      if (cancelled) return;
      setCohorts((data as PublicCohort[] | null) ?? []);
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  return { cohorts, loaded };
}