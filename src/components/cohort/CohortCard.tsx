'use client';

// CohortCard
//
// Header strip for the cohort section. Renders three states:
//   - 'upcoming' (cohort hasn't started): countdown, "starts in N
//     days", join / leave buttons (join disabled if signups not
//     open yet).
//   - 'active' (cohort is running): "Day N of 50", link to the
//     user's own tracker, leave button.
//   - 'completed' / 'left' (read-only): just the name + dates.
//
// The card never shows individual members or per-member data.
// Identity safety: shows the anonymous_handle by default, plus
// the cohort name. The user can opt-in to show their display_name
// via a settings row inside the card, but that text never appears
// here unless they've checked the box.

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCohortMembership } from '@/hooks/useCohortMembership';
import { useCohortKudos, COHORT_KUDOS_DAILY_CAP } from '@/hooks/useCohortKudos';
import type { CurrentCohort } from '@/hooks/useCurrentCohort';

export interface CohortCardProps {
  cohort: CurrentCohort;
  onLeft: () => void;            // parent's refetch
}

function daysUntil(dateIso: string): number {
  const target = new Date(dateIso + 'T00:00:00').getTime();
  const today = new Date(new Date().toDateString()).getTime();
  return Math.ceil((target - today) / 86_400_000);
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
  const startIn = daysUntil(cohort.startDate);

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
    <div className="border border-ink/15 bg-cre-30 p-4">
      <div className="flex items-baseline justify-between gap-2 flex-wrap">
        <p className="font-body text-caption uppercase tracking-widest text-coral">
          {isUpcoming ? 'Upcoming cohort' : 'Active cohort'}
        </p>
        <p className="font-body text-caption text-ink/40 tabular-nums">
          {cohort.cohortName}
        </p>
      </div>
      <p className="font-display text-h2 text-ink mt-2 leading-tight">
        {isUpcoming
          ? startIn > 0
            ? `Starts in ${startIn} day${startIn === 1 ? '' : 's'}`
            : 'Starts today'
          : `Day ${Math.max(1, dayNumber)} of 50`}
      </p>
      <p className="font-body text-base text-ink/70 mt-1">
        You're <span className="font-body text-base text-ink font-bold">{cohort.anonymousHandle}</span> in this cohort.
      </p>

      <div className="mt-4 flex items-center gap-3 flex-wrap">
        {isActive && user && (
          <a
            href="/account?next=/#tracker"
            className="font-body text-caption uppercase tracking-widest bg-ink text-paper px-4 py-2 hover:bg-ink/85 transition-colors"
          >
            Open my tracker
          </a>
        )}
        <button
          type="button"
          onClick={onLeave}
          disabled={busy || pending}
          className="font-body text-caption uppercase tracking-widest text-ink/60 hover:text-ink border border-ink/20 hover:border-ink/40 px-4 py-2 transition-colors disabled:opacity-40"
        >
          {busy || pending ? 'Leaving…' : 'Leave cohort'}
        </button>
      </div>

      <label className="flex items-center gap-2 mt-4 font-body text-caption text-ink/60">
        <input
          type="checkbox"
          checked={cohort.showDisplayName}
          onChange={(e) => onToggleShowName(e.target.checked)}
          className="w-4 h-4 border-ink/30"
        />
        Show my display name to other cohort members
      </label>

      {/* "High-five the cohort" — daily collective kudos, max 5 per
          local day. Targets the cohort as a whole, not any one
          member; the cap is enforced server-side. Disabled once
          the cap is hit (button text switches to a 5/5 indicator)
          so the UI reflects the server's view of the count. */}
      {user && (
        <div className="mt-4 pt-3 border-t border-ink/10">
          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => sendKudos()}
              disabled={!canSend}
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
            <p className="font-body text-caption text-coral mt-2">
              {lastError}
            </p>
          )}
        </div>
      )}

      {lastError && (
        <p className="font-body text-caption text-coral mt-3">
          {lastError}
        </p>
      )}
    </div>
  );
}
