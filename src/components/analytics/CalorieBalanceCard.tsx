'use client';

import type { AnalyticsTotals } from '@/hooks/useFoodAnalytics';

interface CalorieBalanceCardProps {
  totals: AnalyticsTotals;
  loaded: boolean;
}

export default function CalorieBalanceCard({
  totals,
  loaded,
}: CalorieBalanceCardProps) {
  if (!loaded) {
    return (
      <div className="space-y-4 p-5 border border-ink/15 bg-ink/[0.03]">
        <div className="h-4 w-48 bg-ink/10 animate-pulse" />
        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-20 bg-ink/10 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const { totalKcalEaten, totalWorkoutKcal, daysLogged, totalWorkoutDays } = totals;
  const netDeficit = totalKcalEaten - totalWorkoutKcal;

  const kcalEatenDisplay = totalKcalEaten.toLocaleString();
  const kcalBurnedDisplay = Math.round(totalWorkoutKcal).toLocaleString();
  const netDisplay = Math.abs(netDeficit).toLocaleString();

  const hasData = daysLogged > 0 || totalWorkoutKcal > 0;

  if (!hasData) {
    return (
      <div className="p-5 border border-ink/15 bg-ink/[0.03]">
        <p className="font-body text-sm text-ink/50 italic">
          Log food and complete workouts to see your energy balance here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {/* Eaten */}
        <div className="px-4 py-4 border border-ink/15 bg-ink/[0.03]">
          <p className="font-body text-caption uppercase tracking-widest text-ink/50 mb-1">
            Eaten
          </p>
          <p className="font-display text-h2 text-ink tabular-nums leading-none">
            {kcalEatenDisplay}
          </p>
          <p className="font-body text-caption text-ink/40 mt-0.5">kcal total</p>
        </div>

        {/* Burned */}
        <div className="px-4 py-4 border border-ink/15 bg-ink/[0.03]">
          <p className="font-body text-caption uppercase tracking-widest text-ink/50 mb-1">
            Burned
          </p>
          <p className="font-display text-h2 text-ink tabular-nums leading-none">
            {kcalBurnedDisplay}
          </p>
          <p className="font-body text-caption text-ink/40 mt-0.5">kcal from FIT50</p>
        </div>

        {/* Net */}
        <div
          className={`px-4 py-4 border ${
            netDeficit >= 0 ? 'border-teal/40 bg-teal/5' : 'border-coral/40 bg-coral/5'
          }`}
        >
          <p className="font-body text-caption uppercase tracking-widest text-ink/50 mb-1">
            Net {netDeficit >= 0 ? 'deficit' : 'surplus'}
          </p>
          <p
            className={`font-display text-h2 tabular-nums leading-none ${
              netDeficit >= 0 ? 'text-teal' : 'text-coral'
            }`}
          >
            {netDeficit >= 0 ? '-' : '+'}{netDisplay}
          </p>
          <p className="font-body text-caption text-ink/40 mt-0.5">
            {netDeficit >= 0 ? 'kcal not eaten' : 'kcal over eaten'}
          </p>
        </div>
      </div>

      <details className="space-y-1">
        <summary className="font-body text-caption text-ink/40 cursor-pointer hover:text-ink/60 transition-colors list-none">
          How are these calculated?
        </summary>
        <div className="pt-2 space-y-2 border-t border-ink/10">
          <p className="font-body text-caption text-ink/50 leading-relaxed">
            <strong className="text-ink">Eaten</strong> — sum of all calories logged in your food diary across {daysLogged} day{daysLogged === 1 ? '' : 's'} in this period.
          </p>
          <p className="font-body text-caption text-ink/50 leading-relaxed">
            <strong className="text-ink">Burned</strong> — estimated calorie burn from your FIT50 workouts using metabolic equivalents (MET). Each exercise has a MET value scaled to your body metrics (age, sex, height, weight). Sessions on days with or without food logged are both counted here ({totalWorkoutDays} workout day{totalWorkoutDays === 1 ? '' : 's'}).
          </p>
          <p className="font-body text-caption text-ink/50 leading-relaxed">
            <strong className="text-ink">Net deficit</strong> — Eaten minus Burned. A positive number means you ate less than you burned (good for fat loss). A negative number means you ate more than you burned (caloric surplus). These totals cover all days with activity in this period — some days may have only food, some only workouts.
          </p>
        </div>
      </details>
    </div>
  );
}
