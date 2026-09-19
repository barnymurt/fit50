'use client';

import type { AnalyticsDay } from '@/hooks/useFoodAnalytics';

interface HabitCorrelationCardProps {
  days: AnalyticsDay[];
  loaded: boolean;
}

export default function HabitCorrelationCard({
  days,
  loaded,
}: HabitCorrelationCardProps) {
  const loggedDays = days.filter((d) => d.hadLoggedFood);

  const workoutDays = loggedDays.filter((d) => d.hadWorkout);
  const restDays = loggedDays.filter((d) => !d.hadWorkout);

  const avgWorkoutBalance =
    workoutDays.length > 0
      ? workoutDays.reduce((s, d) => s + d.kcalUnderOver, 0) / workoutDays.length
      : 0;

  const avgRestBalance =
    restDays.length > 0
      ? restDays.reduce((s, d) => s + d.kcalUnderOver, 0) / restDays.length
      : 0;

  const diff = avgWorkoutBalance - avgRestBalance;

  if (!loaded || loggedDays.length === 0) {
    return (
      <div className="p-5 border border-ink/15 bg-ink/[0.03] space-y-2">
        <div className="h-4 w-48 bg-ink/10 animate-pulse" />
        <div className="h-4 w-32 bg-ink/10 animate-pulse" />
      </div>
    );
  }

  if (workoutDays.length === 0) {
    return (
      <div className="p-5 border border-dashed border-ink/20">
        <p className="font-body text-sm text-ink/50 italic">
          Log some workouts to see how they correlate with your budget balance.
        </p>
      </div>
    );
  }

  return (
    <div className="p-5 border border-ink/15 bg-ink/[0.03] space-y-4">
      <p className="font-body text-caption uppercase tracking-widest text-ink/50">
        Workout vs rest days
      </p>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="font-body text-caption text-ink/50 uppercase tracking-widest mb-1">
            Workout days avg
          </p>
          <p className="font-display text-h2 text-ink tabular-nums leading-none">
            {avgWorkoutBalance >= 0 ? '+' : ''}{Math.round(avgWorkoutBalance)}
            <span className="text-base text-ink/50 font-body ml-1">kcal</span>
          </p>
          <p className="font-body text-caption text-ink/40 mt-0.5">
            across {workoutDays.length} day{workoutDays.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div>
          <p className="font-body text-caption text-ink/50 uppercase tracking-widest mb-1">
            Rest days avg
          </p>
          <p className="font-display text-h2 text-ink tabular-nums leading-none">
            {avgRestBalance >= 0 ? '+' : ''}{Math.round(avgRestBalance)}
            <span className="text-base text-ink/50 font-body ml-1">kcal</span>
          </p>
          <p className="font-body text-caption text-ink/40 mt-0.5">
            across {restDays.length} day{restDays.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>
      {Math.abs(diff) > 10 && (
        <div className="pt-3 border-t border-ink/10">
          <p className="font-body text-sm text-ink/70">
            {diff > 0
              ? `On days you worked out, you were ${Math.abs(Math.round(diff))} kcal more under budget.`
              : `On workout days you were ${Math.abs(Math.round(diff))} kcal less under budget than rest days.`}
          </p>
        </div>
      )}
    </div>
  );
}
