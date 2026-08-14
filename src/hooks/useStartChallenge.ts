'use client';

import { useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase';
import { dateKeyLocal } from '@/lib/dates';
import { saveTrackerV2, TRACKER_KEY } from '@/lib/storage';

/**
 * Single-purpose hook: starts (or resets) the user's 50-day challenge.
 * For anon users, it writes `startDate` directly into the v2 localStorage
 * blob. For auth users, it upserts `profiles.challenge_started_at` on
 * Supabase so cross-device reads see the same anchor.
 *
 * Returned `start(isoDate)` accepts an ISO; the caller decides whether
 * it's today, a past date (back-fill), or a future date. We pass the
 * start of the chosen day in the user's local timezone so day 1
 * actually corresponds to calendar day 1.
 */
export function useStartChallenge() {
  const { user } = useAuth();
  const supabase = createClient();

  const start = useCallback(
    async (isoDate?: string) => {
      const resolved =
        isoDate || dateKeyLocal(new Date()) + 'T00:00:00';

      if (typeof window !== 'undefined') {
        try {
          const raw = localStorage.getItem(TRACKER_KEY);
          const parsed = raw ? JSON.parse(raw) : null;
          const existing =
            parsed && typeof parsed === 'object' && 'data' in parsed
              ? (parsed as { data: unknown }).data
              : null;
          if (existing && typeof existing === 'object') {
            const next = {
              ...(existing as Record<string, unknown>),
              startDate: resolved,
            };
            saveTrackerV2(next as Parameters<typeof saveTrackerV2>[0]);
          } else {
            saveTrackerV2({
              schemaVersion: 2,
              startDate: resolved,
              pendingTaps: {},
              closedDays: {},
              streakUsedWeekKeys: [],
              waterByDate: {},
            });
          }
        } catch (err) {
          console.error('localStorage start write failed:', err);
        }
      }

      if (user && supabase) {
        try {
          await (supabase.from('profiles') as any)
            .update({ challenge_started_at: resolved })
            .eq('id', user.id);
        } catch (err) {
          console.error('profile challenge_started_at update failed:', err);
        }
      }
    },
    [user, supabase]
  );

  return { start };
}
