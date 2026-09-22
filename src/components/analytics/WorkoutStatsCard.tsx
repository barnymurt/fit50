'use client';

import type { AnalyticsTotals } from '@/hooks/useFoodAnalytics';

interface WorkoutStatsCardProps {
  totals: AnalyticsTotals;
  loaded: boolean;
  /** Day number the user is currently on (from tracker startDate) */
  currentDay?: number | null;
}

export default function WorkoutStatsCard({
  totals,
  loaded,
  currentDay,
}: WorkoutStatsCardProps) {
  if (!loaded) {
    return (
      <div className="p-5 border border-ink/15 bg-ink/[0.03] space-y-3">
        <div className="h-4 w-40 bg-ink/10 animate-pulse" />
        <div className="h-8 w-24 bg-ink/10 animate-pulse" />
      </div>
    );
  }

  const { totalWorkoutDays, totalWorkoutRows, daysInRange } = totals;
  const completionRate =
    daysInRange > 0 ? Math.round((totalWorkoutDays / daysInRange) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Row 1: two tiles */}
      <div className="grid grid-cols-2 gap-3">
        {/* Completed days */}
        <div className="px-4 py-4 border border-ink/15 bg-ink/[0.03]">
          <p className="font-body text-caption uppercase tracking-widest text-ink/50 mb-1">
            Days completed
          </p>
          <p className="font-display text-h2 text-ink tabular-nums leading-none">
            {totalWorkoutDays}
          </p>
          <p className="font-body text-caption text-ink/40 mt-0.5">
            FIT50 workout sessions
          </p>
        </div>

        {/* Rows done */}
        <div className="px-4 py-4 border border-ink/15 bg-ink/[0.03]">
          <p className="font-body text-caption uppercase tracking-widest text-ink/50 mb-1">
            Rows done
          </p>
          <p className="font-display text-h2 text-ink tabular-nums leading-none">
            {totalWorkoutRows}
          </p>
          <p className="font-body text-caption text-ink/40 mt-0.5">
            completed FIT50 rows
          </p>
        </div>
      </div>

      {/* Row 2: completion rate bar */}
      {daysInRange > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between">
            <p className="font-body text-caption uppercase tracking-widest text-ink/50">
              Completion rate
            </p>
            <p className="font-display text-h3 text-ink tabular-nums">
              {completionRate}
              <span className="text-base text-ink/40 font-body ml-0.5">%</span>
            </p>
          </div>
          <div className="relative h-3 bg-ink/10 overflow-hidden">
            <div
              className="absolute top-0 left-0 h-full bg-teal transition-all duration-500"
              style={{ width: `${Math.min(completionRate, 100)}%` }}
            />
            {completionRate > 100 && (
              <div
                className="absolute top-0 h-full bg-coral/60"
                style={{
                  left: '100%',
                  width: `${Math.min(completionRate - 100, 100)}%`,
                }}
              />
            )}
          </div>
          <p className="font-body text-caption text-ink/40">
            {totalWorkoutDays} of {daysInRange} days in this period
            {currentDay != null && totalWorkoutDays < currentDay
              ? ` · day ${currentDay} of challenge`
              : ''}
          </p>
        </div>
      )}

      {totalWorkoutDays === 0 && daysInRange === 0 && (
        <div className="p-4 border border-dashed border-ink/20">
          <p className="font-body text-sm text-ink/50 italic">
            No workouts logged yet. Complete a FIT50 session to see your stats here.
          </p>
        </div>
      )}
    </div>
  );
}
