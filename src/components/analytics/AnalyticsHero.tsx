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
  value: string | number;
  suffix?: string;
  description?: string;
  loaded: boolean;
}) {
  return (
    <div className="px-5 py-5 border border-ink/15 bg-ink/[0.03]">
      <p className="font-body text-caption uppercase tracking-widest text-ink/50 mb-2">
        {label}
      </p>
      {loaded ? (
        <>
          <p className="font-display text-h1 text-ink leading-none tabular-nums">
            {value}
            {suffix && (
              <span className="text-base text-ink/50 font-body font-normal ml-1.5">
                {suffix}
              </span>
            )}
          </p>
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
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
          loaded
            ? `${workoutKcal} kcal${workoutPerDay > 0 ? ` (≈${workoutPerDay}/day)` : ''}`
            : '—'
        }
        description="Estimated calories burned through FIT50 workouts. This is already factored into your adjusted balance below."
        loaded={loaded}
      />
    </div>
  );
}
