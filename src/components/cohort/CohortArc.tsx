'use client';

// CohortArc
//
// The 50-day "cohort arc" — a horizontal timeline where each cell
// is one day of the cohort. Cell value: members who hit 9/9 that
// day (strict, reset every day). Cells that haven't happened yet
// are muted. Today is highlighted. Past cells are filled.
//
// Below the arc: "X of Y still going" line. This is the lenient
// engagement test (≥ 1 habit in the last 4 days), separate from
// the per-day strict count.

export interface CohortArcProps {
  cohortDayNumber: number;        // 1..50 (0 = before start)
  cohortSize: number;             // denominator for "X of Y"
  arcStrictCounts: Record<number, number>;  // day_number → completers
  stillGoing: number;              // ≥ 1 habit in last 4 days
}

const TOTAL_DAYS = 50;
const ARC_DOTS = TOTAL_DAYS;        // 50 cells, one per day

export default function CohortArc({
  cohortDayNumber,
  cohortSize,
  arcStrictCounts,
  stillGoing,
}: CohortArcProps) {
  const today = cohortDayNumber;
  const days = Array.from({ length: ARC_DOTS }, (_, i) => i + 1);

  return (
    <div className="border border-ink/15 bg-cre-30 p-4">
      <p className="font-body text-caption uppercase tracking-widest text-ink/60 mb-3">
        Cohort arc · Day {Math.max(1, today)} of {TOTAL_DAYS}
      </p>
      <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(25, minmax(0, 1fr))' }}>
        {days.map((day) => {
          const count = arcStrictCounts[day] || 0;
          const isFuture = day > today;
          const isToday = day === today;
          const pct = cohortSize > 0 ? count / cohortSize : 0;
          const title = isFuture
            ? `Day ${day} (future)`
            : `Day ${day}: ${count} of ${cohortSize} hit 9/9 (${Math.round(
                pct * 100
              )}%)`;
          return (
            <div
              key={day}
              title={title}
              aria-label={title}
              className={[
                'aspect-square border tabular-nums flex items-center justify-center font-body text-[10px]',
                isFuture
                  ? 'border-ink/10 bg-paper/40 text-ink/20'
                  : isToday
                  ? 'border-coral bg-coral/20 text-ink font-bold'
                  : count > 0
                  ? 'border-ink/15 bg-teal/20 text-ink'
                  : 'border-ink/15 bg-paper text-ink/40',
              ].join(' ')}
            >
              {day}
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between mt-4 font-body text-caption text-ink/50 uppercase tracking-widest">
        <span>Day 1</span>
        <span>Day {TOTAL_DAYS}</span>
      </div>
      <p className="font-body text-base text-ink mt-4">
        <span className="font-display text-h3 text-ink tabular-nums">
          {stillGoing}
        </span>
        <span className="text-ink/60"> of {cohortSize} still going</span>
      </p>
      <p className="font-body text-caption text-ink/40 mt-1">
        Members who tapped at least one habit in the last 4 days.
        Resets every day.
      </p>
    </div>
  );
}
