'use client';

import type { AnalyticsTotals } from '@/hooks/useFoodAnalytics';

interface AnalyticsHeroProps {
  totals: AnalyticsTotals;
  loaded: boolean;
}

function StatTile({
  label,
  value,
  suffix,
  description,
  loaded,
}: {
  label: string;
  /** Either a plain string/number or JSX for tiles that need a
   *  structured value (e.g. a big number on one line + a small
   *  per-day caption on the next). */
  value: string | number | React.ReactNode;
  suffix?: string;
  description?: string;
  loaded: boolean;
}) {
  return (
    <div className="px-5 py-5 border border-ink/15 bg-ink/[0.03] min-w-0 overflow-hidden">
      <p className="font-body text-caption uppercase tracking-widest text-ink/50 mb-2">
        {label}
      </p>
      {loaded ? (
        <>
          <div className="font-display text-h1 text-ink leading-none tabular-nums">
            {value}
            {suffix && (
              <span className="text-base text-ink/50 font-body font-normal ml-1.5">
                {suffix}
              </span>
            )}
          </div>
          {description && (
            <p className="font-body text-caption text-ink/40 mt-2 leading-relaxed">
              {description}
            </p>
          )}
        </>
      ) : (
        <div className="h-8 w-24 bg-ink/10 animate-pulse" />
      )}
    </div>
  );
}

export default function AnalyticsHero({ totals, loaded }: AnalyticsHeroProps) {
  const deficitDays = totals.daysUnderBudget;
  const overDays = totals.daysOverBudget;
  const deficitKcal = Math.round(totals.avgUnderOver);
  const deficitPerDay = Math.round(totals.avgUnderOverAdjusted);
  const workoutKcal = Math.round(totals.totalWorkoutKcal);
  const workoutPerDay =
    totals.daysLogged > 0
      ? Math.round(workoutKcal / totals.daysLogged)
      : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 min-w-0">
      <StatTile
        label="Days under budget"
        value={loaded ? `${deficitDays}/${totals.daysLogged}` : '—'}
        description="Days where you ate less than your calorie target. Key for building a sustainable deficit."
        loaded={loaded}
      />
      <StatTile
        label="Days over budget"
        value={loaded ? `${overDays}/${totals.daysLogged}` : '—'}
        description="Days where you ate more than your target. Occasional overages are normal — what matters is the trend."
        loaded={loaded}
      />
      <StatTile
        label="Avg daily balance"
        value={
          loaded
            ? `${deficitKcal >= 0 ? '+' : ''}${deficitKcal} kcal`
            : '—'
        }
        description="Average gap between your target and what you ate. Negative = deficit. Positive = surplus."
        loaded={loaded}
      />
      <StatTile
        label="Workouts burned"
        value={
          loaded ? (
            <>
              <span className="block">{workoutKcal} kcal</span>
              {workoutPerDay > 0 && (
                <span className="block text-base text-ink/50 font-body font-normal mt-1">
                  ≈{workoutPerDay}/day
                </span>
              )}
            </>
          ) : (
            '—'
          )
        }
        description="Estimated calories burned through FIT50 workouts. This is already factored into your adjusted balance below."
        loaded={loaded}
      />
    </div>
  );
}
