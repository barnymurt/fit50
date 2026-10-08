'use client';

// CohortTodayPanel
//
// The 9-cell "today" row of the cohort section. One cell per
// habit, each cell showing "X / cohort_size" of members who
// completed that habit today. Strict definition: a habit counts
// as completed only if the user's `daily_totals.completed` for
// today's day_number is true.
//
// No individual handles here. No per-member row. This panel is
// the cohort-level "how did we do today" check, nothing more.

import { HABIT_IDS, HABIT_COUNT } from '@/lib/habits';

export interface CohortTodayPanelProps {
  perHabit: Record<string, number>;
  cohortSize: number;
  headline: string;     // e.g. "37 of 80 of you hit 9/9 today"
  highFiversToday: number; // members who high-fived the cohort today
}

export default function CohortTodayPanel({
  perHabit,
  cohortSize,
  headline,
  highFiversToday,
}: CohortTodayPanelProps) {
  // For each habit, how many of the cohort hit it today. Fills
  // missing habits with 0 so the row is always 9 cells.
  const counts = HABIT_IDS.map((id) => perHabit[id] || 0);

  // Find the cell with the highest count — used to scale the
  // optional bar fill so the user can see at a glance which
  // habits landed and which didn't.
  const max = Math.max(1, ...counts);

  return (
    <div className="border border-ink/15 bg-cre-30 p-4">
      <p className="font-body text-caption uppercase tracking-widest text-ink/60 mb-3">
        Today in your cohort
      </p>
      <p className="font-body text-base text-ink mb-4">{headline}</p>
      <div className="grid grid-cols-9 gap-1.5" role="group" aria-label="Today's habit completion by your cohort">
        {counts.map((count, i) => {
          const habitId = HABIT_IDS[i];
          const pctOfCohort = cohortSize > 0 ? count / cohortSize : 0;
          const fillPct = Math.round((count / max) * 100);
          return (
            <div
              key={habitId}
              className="flex flex-col items-center gap-1"
              title={`${habitId}: ${count} of ${cohortSize} (${Math.round(pctOfCohort * 100)}%)`}
            >
              <div
                aria-label={`${habitId} ${count} of ${cohortSize}`}
                className="w-full aspect-square border border-ink/15 bg-paper flex items-center justify-center tabular-nums text-sm font-body text-ink"
              >
                <div
                  className="w-full h-full flex items-center justify-center bg-teal/30"
                  style={{
                    // The fill grows from the top down. 0 = empty
                    // (just border), 100 = full teal. Subtle so the
                    // number stays the primary read.
                    clipPath:
                      count === 0
                        ? 'none'
                        : `inset(${(100 - fillPct).toFixed(1)}% 0 0 0)`,
                  }}
                >
                  {count}
                </div>
              </div>
              <span className="font-body text-[10px] uppercase tracking-widest text-ink/40 truncate w-full text-center">
                {habitLabel(habitId)}
              </span>
            </div>
          );
        })}
      </div>
      <p className="font-body text-caption text-ink/40 mt-3">
        Cells show &ldquo;{cohortSize > 0 ? 'X' : '–'} of {cohortSize}&rdquo; members who completed each habit today. The headline above counts members who completed all {HABIT_COUNT}.
      </p>
      {cohortSize > 0 && (
        <p className="font-body text-caption text-ink/50 mt-1">
          {highFiversToday} of {cohortSize} high-fived the cohort today.
        </p>
      )}
    </div>
  );
}

// Short, scannable label for each habit. Kept inline so the
// component is self-contained. Updates here are cheap and don't
// touch the rest of the app.
const HABIT_LABELS: Record<string, string> = {
  'chill-out': 'Chill',
  'fuel-right': 'Fuel',
  'crispy-clarity': 'Clear',
  'fresh-lungs': 'Lungs',
  'open-mind': 'Mind',
  'move-body': 'Move',
  'wet-lips': 'Water',
  'step-it-up': 'Steps',
  'feed-brain': 'Feed',
};

function habitLabel(id: string): string {
  return HABIT_LABELS[id] || id;
}
