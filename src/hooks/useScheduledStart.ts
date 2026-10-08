'use client';

// useScheduledStart
//
// Reads and updates the user's chosen future start date on
// profiles.scheduled_start_at. Distinct from
// profiles.challenge_started_at, which is what gets stamped on
// the morning the user actually starts.
//
// The StartSplash uses this so a future-date pick survives
// reload — a user who schedules their cohort start date and
// closes the tab can come back next week to the same splash and
// see "X days till you start" with the same date they picked.

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase';

export function useScheduledStart() {
  const { user } = useAuth();
  const supabase = createClient();
  const [scheduled, setScheduled] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    if (!user || !supabase) {
      setScheduled(null);
      setLoaded(true);
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb: any = supabase;
    const { data } = await sb
      .from('profiles')
      .select('scheduled_start_at')
      .eq('id', user.id)
      .maybeSingle();
    setScheduled(
      (data?.scheduled_start_at as string | null | undefined) ?? null
    );
    setLoaded(true);
  }, [user, supabase]);

  useEffect(() => {
    setLoaded(false);
    refresh();
  }, [refresh]);

  const set = useCallback(
    async (date: string): Promise<{ ok: boolean; error?: string }> => {
      if (!user) return { ok: false, error: 'Not signed in.' };
      try {
        const res = await fetch('/api/account/scheduled-start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date }),
        });
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          throw new Error(body.error || `Could not save (${res.status}).`);
        }
        setScheduled(date);
        return { ok: true };
      } catch (err) {
        return {
          ok: false,
          error: err instanceof Error ? err.message : 'Could not save.',
        };
      }
    },
    [user]
  );

  const clear = useCallback(async (): Promise<{ ok: boolean; error?: string }> => {
    if (!user) return { ok: false, error: 'Not signed in.' };
    try {
      const res = await fetch('/api/account/scheduled-start', {
        method: 'DELETE',
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(body.error || `Could not clear (${res.status}).`);
      }
      setScheduled(null);
      return { ok: true };
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : 'Could not clear.',
      };
    }
  }, [user]);

  return { scheduled, loaded, set, clear, refresh };
}
