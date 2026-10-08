'use client';

// CohortCard
//
// Header strip for the cohort section. Two-column layout at the
// top: countdown timer (left) + finish line (right). Below: identity,
// cohort actions, opt-in, high-five.
//
// Three states:
//   - 'upcoming' (cohort hasn't started): countdown + "starts today"
//     or "starts in N days" on the left; finish line on the right.
//   - 'active' (cohort is running): "Day N of 50" on the left;
//     finish line still shown on the right so the user can plan
//     ahead.
//   - 'completed' / 'left' (read-only): just the name + dates.
//
// Identity safety: shows the anonymous_handle by default, plus
// the cohort name. The user can opt-in to show their display_name
// via a settings row inside the card, but that text never appears
// here unless they've checked the box.

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCohortMembership } from '@/hooks/useCohortMembership';
import { useCohortKudos, COHORT_KUDOS_DAILY_CAP } from '@/hooks/useCohortKudos';
import type { CurrentCohort } from '@/hooks/useCurrentCohort';
import {
  cohortFinish,
  daysUntilStart,
} from '@/lib/cohort-events';

export interface CohortCardProps {
  cohort: CurrentCohort;
  onLeft: () => void;            // parent's refetch
}

export default function CohortCard({ cohort, onLeft }: CohortCardProps) {
  const { user } = useAuth();
  const { leave, setShowDisplayName, pending, lastError } =
    useCohortMembership();
  const { sendKudos, canSend, remaining, atCap, sending: kudosSending } =
    useCohortKudos();
  const [busy, setBusy] = useState(false);

  const isUpcoming = cohort.status === 'upcoming';
  const isActive = cohort.status === 'active';
  const dayNumber = cohort.cohortDayNumber;
  const startIn = daysUntilStart(cohort.startDate);
  const finish = cohortFinish(cohort.startDate);

  async function onLeave() {
    if (!confirm('Leave this cohort? You can join a future one anytime.')) {
      return;
    }
    setBusy(true);
    const res = await leave(cohort.cohortId);
    setBusy(false);
    if (res.ok) onLeft();
  }

  async function onToggleShowName(show: boolean) {
    await setShowDisplayName(cohort.cohortId, show);
  }

  return (
    <div
      data-section="cohort-card"
      data-cohort-id={cohort.cohortId}
      data-cohort-status={cohort.status}
      className="border border-ink/15 bg-cre-30 p-4"
    >
      <div className="flex items-baseline justify-between gap-2 flex-wrap">
        <p
          data-section="cohort-status-label"
          className="font-body text-caption uppercase tracking-widest text-coral"
        >
          {isUpcoming ? 'Upcoming cohort' : isActive ? 'Active cohort' : 'Cohort'}
        </p>
        <p
          data-section="cohort-name"
          className="font-body text-caption text-ink/40 tabular-nums"
        >
          {cohort.cohortName}
        </p>
      </div>

      {/* 2-column header: countdown (left) + finish line (right) */}
      <div
        data-section="cohort-two-column-header"
        className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <div data-section="cohort-countdown" className="border border-ink/15 bg-paper p-4">
          <p
            data-section="cohort-countdown-label"
            className="font-body text-caption uppercase tracking-widest text-ink/40 mb-1"
          >
            {isUpcoming ? 'Starts in' : 'Today is'}
          </p>
          <p
            data-section="cohort-countdown-value"
            className="font-display text-h2 text-ink leading-[1.05] tabular-nums"
          >
            {isUpcoming
                ? startIn > 0
                  ? `${startIn} day${startIn === 1 ? '' : 's'}`
                  : 'Today'
                : isActive
                  ? `Day ${Math.max(1, dayNumber)}`
                  : '—'}
          </p>
          <p className="font-body text-caption text-ink/50 mt-2">
            {isUpcoming
                ? `Cohort starts ${formatCohortDate(cohort.startDate)}`
                : isActive
                  ? 'Of 50 days'
                  : `Cohort window ${formatCohortDate(cohort.startDate)}`}
          </p>
        </div>
        <div data-section="cohort-finish" className="border border-ink/15 bg-paper p-4">
          <p
            data-section="cohort-finish-label"
            className="font-body text-caption uppercase tracking-widest text-ink/40 mb-1"
          >
            You finish on
          </p>
          <p
            data-section="cohort-finish-date"
            className="font-display text-h2 text-ink leading-[1.05] tabular-nums"
          >
            {formatCohortDate(finish.finishDate)}
          </p>
          {finish.eventName && (
            <p
              data-section="cohort-finish-event"
              className="font-body text-caption text-ink/50 mt-2"
            >
              {finish.eventName}
            </p>
          )}
        </div>
      </div>

      <p
        data-section="cohort-identity"
        className="font-body text-base text-ink/70 mt-3"
      >
        You're{' '}
        <span
          data-section="cohort-anonymous-handle"
          className="font-body text-base text-ink font-bold"
        >
          {cohort.anonymousHandle}
        </span>{' '}
        in this cohort.
      </p>

      <div
        data-section="cohort-actions"
        className="mt-4 flex items-center gap-3 flex-wrap"
      >
        {isActive && user && (
          <a
            href="/account?next=/#tracker"
            data-section="cohort-open-tracker"
            className="font-body text-caption uppercase tracking-widest bg-ink text-paper px-4 py-2 hover:bg-ink/85 transition-colors"
          >
            Open my tracker
          </a>
        )}
        <button
          type="button"
          onClick={onLeave}
          disabled={busy || pending}
          data-section="cohort-leave"
          className="font-body text-caption uppercase tracking-widest text-ink/60 hover:text-ink border border-ink/20 hover:border-ink/40 px-4 py-2 transition-colors disabled:opacity-40"
        >
          {busy || pending ? 'Leaving…' : 'Leave cohort'}
        </button>
      </div>

      <label
        data-section="cohort-opt-in-label"
        className="flex items-center gap-2 mt-4 font-body text-caption text-ink/60"
      >
        <input
          type="checkbox"
          checked={cohort.showDisplayName}
          onChange={(e) => onToggleShowName(e.target.checked)}
          data-section="cohort-opt-in-checkbox"
          className="w-4 h-4 border-ink/30"
        />
        Show my display name to other cohort members
      </label>

      {/* "High-five the cohort" — daily collective kudos, max 5 per
          local day. Targets the cohort as a whole, not any one
          member; the cap is enforced server-side. Disabled once
          the user has hit the 5/day cap; the button text switches
          to a "5 / 5 high-fives sent today" indicator in that
          state so the UI reflects the server's view of the count. */}
      {user && (
        <div
          data-section="cohort-kudos"
          className="mt-4 pt-3 border-t border-ink/10"
        >
          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => sendKudos()}
              disabled={!canSend}
              data-section="cohort-kudos-button"
              className="font-body text-caption uppercase tracking-widest border border-coral text-coral hover:bg-coral hover:text-paper px-4 py-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {kudosSending
                ? 'High-fiving…'
                : atCap
                ? `5 / ${COHORT_KUDOS_DAILY_CAP} high-fives sent today`
                : remaining !== null
                ? `High-five the cohort · ${remaining} left`
                : `High-five the cohort`}
            </button>
          </div>
          {lastError && (
            <p
              data-section="cohort-kudos-error"
              className="font-body text-caption text-coral mt-2"
            >
              {lastError}
            </p>
          )}
        </div>
      )}

      {lastError && (
        <p
          data-section="cohort-leave-error"
          className="font-body text-caption text-coral mt-3"
        >
          {lastError}
        </p>
      )}
    </div>
  );
}

function formatCohortDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
