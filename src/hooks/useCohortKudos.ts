'use client';

// useCohortKudos
//
// "High-five the cohort" — a daily 0-5 kudos counter that the user
// can give to the cohort as a whole (not a specific member). The
// route handler at /api/cohort/kudos does the actual work; this
// hook reads back the user's current count + sends a high-five
// on demand. The hook re-reads after every send so the UI
// updates to the new cap without a full refresh.

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiJson } from '@/lib/api-fetch';
import {
  COHORT_MEMBERSHIP_CHANGED_EVENT,
  useCurrentCohort,
} from './useCurrentCohort';

const KUDOS_DAILY_CAP = 5;

export function useCohortKudos() {
  const { user } = useAuth();
  const { current } = useCurrentCohort();
  const [kudosToday, setKudosToday] = useState<number | null>(null);
  const [sending, setSending] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  // Re-read the current cap from the server. The cap lives on
  // cohort_memberships.kudos_today in the same row the rest of
  // the cohort data comes from, so we can pull it from the
  // current-cohort shape — no separate fetch.
  useEffect(() => {
    // We don't currently carry `kudos_today` on the CurrentCohort
    // shape (the public hook is intentionally minimal). For now
    // the value starts null and gets populated after the first
    // send; the optimistic-disable on the button uses `null`
    // (treated as "we don't know yet, allow the click").
    setKudosToday(null);
  }, [current?.membershipId, user?.id]);

  // Re-read after membership changes (e.g. join/leave) so the
  // button state reflects the latest membership.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onChange = () => {
      // The next refresh of the cohort card will fetch the latest
      // membershipId; this handler is just a wake-up so the
      // "X high-fives used" count updates on the next render.
      setKudosToday((k) => k);
    };
    window.addEventListener(COHORT_MEMBERSHIP_CHANGED_EVENT, onChange);
    return () =>
      window.removeEventListener(
        COHORT_MEMBERSHIP_CHANGED_EVENT,
        onChange
      );
  }, []);

  const sendKudos = useCallback(async (): Promise<{
    ok: boolean;
    error?: string;
  }> => {
    if (!current) {
      return { ok: false, error: 'You are not in a cohort yet.' };
    }
    setSending(true);
    setLastError(null);
    try {
      const res = await apiJson<{ ok: boolean; kudos_today?: number }>(
        '/api/cohort/kudos',
        { method: 'POST', body: { cohort_id: current.cohortId } }
      );
      if (res.ok) {
        setKudosToday(res.kudos_today ?? null);
        return { ok: true };
      }
      return { ok: false, error: 'Kudos not sent.' };
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Could not send kudos right now.';
      setLastError(msg);
      return { ok: false, error: msg };
    } finally {
      setSending(false);
    }
  }, [current]);

  const remaining =
    kudosToday === null ? null : Math.max(0, KUDOS_DAILY_CAP - kudosToday);
  const atCap = remaining === 0;
  const canSend = !!user && !!current && !atCap && !sending;

  return {
    kudosToday,
    remaining,
    atCap,
    canSend,
    sending,
    lastError,
    sendKudos,
  };
}

export const COHORT_KUDOS_DAILY_CAP = KUDOS_DAILY_CAP;
