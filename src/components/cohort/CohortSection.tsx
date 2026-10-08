'use client';

// CohortSection
//
// The full cohort UI block. Reads the user's current cohort (if
// any) and renders three states:
//
//   - 'upcoming' cohort, sign-ups open: CohortCard (countdown),
//     no today panel yet, no arc yet. Joining routes through the
//     /api/cohort/join route via useCohortMembership.
//   - 'upcoming' cohort, sign-ups not yet open: CohortCard with
//     "Sign-ups open in N days" instead of "Join".
//   - 'active' cohort: CohortCard (day N), CohortTodayPanel
//     (today's per-habit counts), CohortArc (50-day timeline).
//   - no live cohort: returns null. The account page's other
//     sections cover the empty state.
//
// The "join from the account page" path is intentionally absent —
// joining happens from the StartSplash on the tracker section so
// the user can see the choice in the right context (they're
// about to start a challenge anyway). Leaving is the only action
// exposed here.

import { useCurrentCohort } from '@/hooks/useCurrentCohort';
import { useCohortProgress } from '@/hooks/useCohortProgress';
import CohortCard from './CohortCard';
import CohortTodayPanel from './CohortTodayPanel';
import CohortArc from './CohortArc';
import CohortJoinCard from './CohortJoinCard';
import { finishLineSentence } from '@/lib/cohort-events';

export default function CohortSection() {
  const { current, loaded } = useCurrentCohort();
  const progress = useCohortProgress(
    current?.cohortId ?? null,
    current?.startDate ?? null
  );

  if (!loaded) {
    return (
      <div className="border border-ink/15 bg-cre-30 p-4">
        <p className="font-body text-ink/40 text-sm">Loading…</p>
      </div>
    );
  }

  // No live cohort yet — show the join card so the user can
  // discover the cohort feature from the account page (not just
  // the start splash, which only renders for users who haven't
  // started a challenge yet). Existing users who started solo can
  // hop into a cohort here; the card's confirm dialog warns them
  // about the day-number reset.
  if (!current) return <CohortJoinCard />;

  // Headline for the today panel: "X of Y of you hit 9/9 today".
  // We don't have the strict count as a separate field — the arc
  // map has it for today, so look it up. If the today value is
  // missing (e.g. first day of cohort, no completers yet), it
  // defaults to 0.
  const todayCompleters = progress.arcStrictCounts[current.cohortDayNumber] || 0;
  const headline =
    progress.cohortSize > 0
      ? `${todayCompleters} of ${progress.cohortSize} of you hit 9/9 today`
      : 'No one in the cohort yet';

  return (
    <div
      data-section="cohort-section"
      data-cohort-id={current.cohortId}
      className="space-y-6"
    >
      <CohortCard
        cohort={current}
        onLeft={() => window.location.reload()}
      />
      <div
        data-section="cohort-finish-line-card"
        className="border border-coral bg-coral/[0.05] p-4"
      >
        <p className="font-body text-caption uppercase tracking-widest text-coral mb-2">
          The finish line
        </p>
        <p
          data-section="cohort-finish-line-sentence"
          className="font-display text-h3 text-ink leading-[1.05]"
        >
          {finishLineSentence(current.startDate)}
        </p>
      </div>
      {current.status === 'active' && progress.loaded && (
        <>
          <CohortTodayPanel
            perHabit={progress.todayPerHabit}
            cohortSize={progress.cohortSize}
            headline={headline}
            highFiversToday={progress.highFiversToday}
          />
          <CohortArc
            cohortDayNumber={current.cohortDayNumber}
            cohortSize={progress.cohortSize}
            arcStrictCounts={progress.arcStrictCounts}
            stillGoing={progress.stillGoing}
          />
        </>
      )}
    </div>
  );
}
