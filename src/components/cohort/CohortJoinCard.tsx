'use client';

// CohortJoinCard
//
// Rendered in the Cohort section on the account page when the
// user has no live (upcoming or active) cohort membership yet.
// Shows the next 1-4 cohorts with sign-ups currently open, with a
// Join button on each. The StartSplash on the tracker section
// shows a similar block for users who haven't started a challenge
// at all — this card is for users who have started solo and want
// to hop into a cohort mid-flight.
//
// Joining overwrites profiles.challenge_started_at with the
// cohort's start_date. The cohort migration archives the user's
// previous daily_totals rows (they're never deleted) so a user
// who leaves the cohort and goes back to a personal challenge
// still has their history. We confirm the reset explicitly via
// ConfirmDialog so the user doesn't lose day-N progress by
// accident.

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTrackerState } from '@/hooks/useTrackerState';
import { useAvailableCohorts, type AvailableCohort } from '@/hooks/useAvailableCohorts';
import { useCohortMembership } from '@/hooks/useCohortMembership';
import ConfirmDialog from '@/components/ConfirmDialog';
import { COHORT_MEMBERSHIP_CHANGED_EVENT } from '@/hooks/useCurrentCohort';

function formatDate(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function daysUntil(iso: string): number {
  const target = new Date(iso + 'T00:00:00').getTime();
  const today = new Date(new Date().toDateString()).getTime();
  return Math.ceil((target - today) / 86_400_000);
}

export default function CohortJoinCard() {
  const { user } = useAuth();
  const tracker = useTrackerState();
  const { cohorts, loaded } = useAvailableCohorts();
  const { join, pending, lastError } = useCohortMembership();
  const [confirmCohort, setConfirmCohort] = useState<AvailableCohort | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  if (!loaded) {
    return (
      <div className="border border-ink/15 bg-cre-30 p-4">
        <p className="font-body text-ink/40 text-sm">Loading cohorts…</p>
      </div>
    );
  }

  if (cohorts.length === 0) {
    return (
      <div className="border border-ink/15 bg-cre-30 p-4">
        <p className="font-body text-caption uppercase tracking-widest text-ink/60 mb-2">
          No cohorts open right now
        </p>
        <p className="font-body text-base text-ink/70">
          Cohorts open for sign-up on the 1st of each month. Check back
          soon, or wait for the next round.
        </p>
      </div>
    );
  }

  // Whether the user already has a started challenge. Joining
  // resets their day number to the cohort's day 1; if they have
  // progress, that's a real loss — confirm explicitly.
  const hasStarted = !!tracker.hasStarted;

  const onJoin = async (c: AvailableCohort) => {
    setError(null);
    const res = await join(c.id);
    if (res.ok) {
      // Tell every cohort-aware listener (useCurrentCohort +
      // useCohortProgress) to refetch.
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new Event(COHORT_MEMBERSHIP_CHANGED_EVENT)
        );
      }
      // Reload so useTrackerState re-reads challenge_started_at
      // and the section / start splash update.
      window.location.reload();
    } else {
      setError(res.error || 'Could not join the cohort.');
    }
  };

  const onClickJoin = (c: AvailableCohort) => {
    if (hasStarted) {
      setConfirmCohort(c);
    } else {
      void onJoin(c);
    }
  };

  return (
    <div className="border border-ink/15 bg-cre-30 p-4">
      <p className="font-body text-caption uppercase tracking-widest text-coral mb-2">
        Open for sign-up
      </p>
      <p className="font-body text-base text-ink/80 mb-4">
        {user
          ? 'Pick a cohort to start the 50 days alongside other people. Your day number and habit grid stay yours — the cohort section just shows you the collective count.'
          : 'Sign in to join a cohort.'}
      </p>
      <div className="space-y-3">
        {cohorts.map((c) => {
          const inDays = daysUntil(c.start_date);
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onClickJoin(c)}
              disabled={!user || pending}
              className="w-full border border-ink/15 bg-paper p-4 text-left hover:border-coral transition-colors disabled:opacity-50"
            >
              <div className="flex items-baseline justify-between gap-2 mb-1">
                <span className="font-display text-base text-ink">
                  {c.name}
                </span>
                <span className="font-body text-caption uppercase tracking-widest text-coral">
                  Join →
                </span>
              </div>
              <p className="font-body text-caption text-ink/60">
                Starts {formatDate(c.start_date)}
                {inDays > 0
                  ? ` · ${inDays} day${inDays === 1 ? '' : 's'} away`
                  : ' · today'}
              </p>
            </button>
          );
        })}
      </div>
      {(error || lastError) && (
        <p className="font-body text-caption text-coral mt-3">
          {error || lastError}
        </p>
      )}
      <ConfirmDialog
        open={confirmCohort !== null}
        onClose={() => setConfirmCohort(null)}
        title="Join this cohort?"
        description={
          confirmCohort
            ? `You've already started the 50 days. Joining "${confirmCohort.name}" will set your day number to day 1 of the cohort (${formatDate(confirmCohort.start_date)}). Your previous progress is archived (never deleted) and will be visible again if you go back to a personal challenge later.`
            : ''
        }
        confirmLabel="Reset my day number"
        cancelLabel="Keep my solo challenge"
        destructive
        onConfirm={() => {
          if (confirmCohort) void onJoin(confirmCohort);
        }}
      />
    </div>
  );
}
