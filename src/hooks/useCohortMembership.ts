'use client';

// useCohortMembership
//
// Mutation-only hook for the user's own cohort_memberships row.
// All three operations go through the server-side API routes
// (join / leave / preferences) rather than writing directly to
// Supabase, because:
//   - join needs to stamp the user's anonymous_handle (collision-
//     free within the cohort), reset challenge_started_at, and
//     enforce "one live cohort per user" server-side;
//   - leave needs to flip status to 'left' on the only matching
//     row without exposing more columns than necessary;
//   - preferences (show_display_name) needs to be tied to a
//     specific cohort_id so users can't opt-in to other cohorts'
//     handles.
//
// On success each route dispatches COHORT_MEMBERSHIP_CHANGED_EVENT
// so useCurrentCohort and any other listener re-fetches.

import { useCallback, useState } from 'react';
import { apiJson } from '@/lib/api-fetch';
import { useAuth } from '@/contexts/AuthContext';
import { COHORT_MEMBERSHIP_CHANGED_EVENT } from './useCurrentCohort';

export interface JoinResult {
  ok: boolean;
  error?: string;
  // On success, the new membership's row id (for the UI to scroll
  // to or focus the cohort section).
  membershipId?: string;
}

export function useCohortMembership() {
  const { user } = useAuth();
  const [pending, setPending] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const fireChange = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event(COHORT_MEMBERSHIP_CHANGED_EVENT));
    }
  }, []);

  const join = useCallback(
    async (cohortId: string): Promise<JoinResult> => {
      if (!user) return { ok: false, error: 'Not signed in.' };
      setPending(true);
      setLastError(null);
      try {
        const res = await apiJson<{ membershipId: string }>(
          '/api/cohort/join',
          { method: 'POST', body: { cohort_id: cohortId } }
        );
        fireChange();
        return { ok: true, membershipId: res.membershipId };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Could not join the cohort.';
        setLastError(message);
        return { ok: false, error: message };
      } finally {
        setPending(false);
      }
    },
    [user, fireChange]
  );

  const leave = useCallback(
    async (cohortId: string): Promise<{ ok: boolean; error?: string }> => {
      if (!user) return { ok: false, error: 'Not signed in.' };
      setPending(true);
      setLastError(null);
      try {
        await apiJson('/api/cohort/leave', {
          method: 'POST',
          body: { cohort_id: cohortId },
        });
        fireChange();
        return { ok: true };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Could not leave the cohort.';
        setLastError(message);
        return { ok: false, error: message };
      } finally {
        setPending(false);
      }
    },
    [user, fireChange]
  );

  const setShowDisplayName = useCallback(
    async (
      cohortId: string,
      show: boolean
    ): Promise<{ ok: boolean; error?: string }> => {
      if (!user) return { ok: false, error: 'Not signed in.' };
      setPending(true);
      setLastError(null);
      try {
        await apiJson('/api/cohort/preferences', {
          method: 'PATCH',
          body: { cohort_id: cohortId, show_display_name: show },
        });
        fireChange();
        return { ok: true };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Could not update cohort preference.';
        setLastError(message);
        return { ok: false, error: message };
      } finally {
        setPending(false);
      }
    },
    [user, fireChange]
  );

  return {
    pending,
    lastError,
    join,
    leave,
    setShowDisplayName,
  };
}
