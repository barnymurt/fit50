'use client';

// usePublicCohort
//
// Single-cohort read for the shareable per-cohort landing page
// (src/app/cohorts/[id]/page.tsx). The cohorts table allows
// anonymous SELECT after migration 0047, so this hook fires
// without requiring a session.

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';

export interface PublicCohortDetail {
  id: string;
  name: string;
  start_date: string;
  signups_open_at: string;
  cap: number;
}

export function usePublicCohort(id: string | null): {
  cohort: PublicCohortDetail | null;
  loaded: boolean;
  notFound: boolean;
} {
  const supabase = createClient();
  const [cohort, setCohort] = useState<PublicCohortDetail | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!supabase || !id) {
      setCohort(null);
      setLoaded(true);
      setNotFound(false);
      return;
    }
    let cancelled = false;
    setLoaded(false);
    setNotFound(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb: any = supabase;
    (async () => {
      const { data } = await sb
        .from('cohorts')
        .select('id, name, start_date, signups_open_at, cap')
        .eq('id', id)
        .maybeSingle();
      if (cancelled) return;
      if (!data) {
        setNotFound(true);
        setCohort(null);
      } else {
        setCohort(data as PublicCohortDetail);
        setNotFound(false);
      }
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase, id]);

  return { cohort, loaded, notFound };
}