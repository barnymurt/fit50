'use client';

import type { AnalyticsTotals } from '@/hooks/useFoodAnalytics';

interface WorkoutImpactCardProps {
  totals: AnalyticsTotals;
  loaded: boolean;
}

export default function WorkoutImpactCard({
  totals,
  loaded,
}: WorkoutImpactCardProps) {
  const workoutDays = totals.daysWorkedOut;
  const totalKcal = Math.round(totals.totalWorkoutKcal);
  const perDay = workoutDays > 0 ? Math.round(totalKcal / workoutDays) : 0;
  const avgUnderOver = Math.round(totals.avgUnderOver);
  const adjusted = Math.round(totals.avgUnderOverAdjusted);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 border border-ink/15">
          <p className="font-body text-caption uppercase tracking-widest text-ink/50 mb-1">
            Total burned
          </p>
          {loaded ? (
            <p className="font-display text-h2 text-ink tabular-nums leading-none">
              {totalKcal.toLocaleString()}
              <span className="text-base text-ink/50 font-body ml-1">kcal</span>
            </p>
          ) : (
            <div className="h-7 w-24 bg-ink/10 animate-pulse" />
          )}
        </div>
        <div className="p-4 border border-ink/15">
          <p className="font-body text-caption uppercase tracking-widest text-ink/50 mb-1">
            Per workout day
          </p>
          {loaded ? (
            <p className="font-display text-h2 text-ink tabular-nums leading-none">
              ≈{perDay}
              <span className="text-base text-ink/50 font-body ml-1">kcal</span>
            </p>
          ) : (
            <div className="h-7 w-24 bg-ink/10 animate-pulse" />
          )}
        </div>
      </div>

      {loaded && (
        <div className="p-4 border border-teal/30 bg-teal/5 space-y-2">
          <p className="font-body text-caption uppercase tracking-widest text-ink/60">
            Budget balance (food only)
          </p>
          <p className="font-display text-h2 text-ink tabular-nums leading-none">
            {avgUnderOver >= 0 ? '+' : ''}{avgUnderOver}
            <span className="text-base text-ink/50 font-body ml-1">kcal/day</span>
          </p>
          <p className="font-body text-xs text-ink/50">
            Your target minus what you ate.
          </p>
        </div>
      )}

      {loaded && workoutDays > 0 && (
        <div className="p-4 border border-ink/15 bg-ink/[0.03] space-y-2">
          <p className="font-body text-caption uppercase tracking-widest text-ink/60">
            If you ate back your workouts
          </p>
          <p className="font-display text-h2 text-ink tabular-nums leading-none">
            {adjusted >= 0 ? '+' : ''}{adjusted}
            <span className="text-base text-ink/50 font-body ml-1">kcal/day</span>
          </p>
          <p className="font-body text-xs text-ink/50">
            Based on {workoutDays} workout day{workoutDays !== 1 ? 's' : ''} totalling ~{totalKcal.toLocaleString()} kcal.
          </p>
        </div>
      )}

      {loaded && workoutDays === 0 && (
        <div className="p-4 border border-dashed border-ink/20">
          <p className="font-body text-sm text-ink/50 italic">
            No workouts logged in this period. Log a FIT50 workout to see its impact here.
          </p>
        </div>
      )}
    </div>
  );
}
