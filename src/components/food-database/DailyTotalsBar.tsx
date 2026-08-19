'use client';

import { Food, MacroTargets } from './types';

interface Props {
  totals: { kcal: number; protein: number; carbs: number; fat: number };
  targets: MacroTargets | null;
}

const BARS: { key: 'kcal' | 'protein' | 'carbs' | 'fat'; label: string; unit: string }[] = [
  { key: 'kcal', label: 'Calories', unit: 'kcal' },
  { key: 'protein', label: 'Protein', unit: 'g' },
  { key: 'carbs', label: 'Carbs', unit: 'g' },
  { key: 'fat', label: 'Fat', unit: 'g' },
];

// ±5% buffer zone. Within 5% of target → orange (acceptable).
// Past 105% → red (warning).
const BUFFER = 0.05;

export default function DailyTotalsBar({ totals, targets }: Props) {
  return (
    <div className="bg-paper border border-ink/15">
      <div className="px-6 py-4 border-b border-ink/10 flex items-baseline justify-between">
        <p className="font-body text-caption uppercase tracking-widest text-ink/50">
          Daily totals
        </p>
        <p className="font-body text-caption uppercase text-ink/40">
          Today
        </p>
      </div>
      <div className="p-6 space-y-4">
        {BARS.map(({ key, label, unit }) => {
          const value = totals[key];
          const target = targets?.[key] ?? 0;
          if (target <= 0) {
            return (
              <div key={key}>
                <div className="flex items-baseline justify-between mb-1">
                  <span className="font-body text-caption uppercase tracking-widest text-ink/70">
                    {label}
                  </span>
                  <span className="font-display text-h3 tabular-nums leading-none text-ink">
                    {Math.round(value)}
                    <span className="text-ink/40 font-body text-sm font-normal ml-1">
                      / — {unit}
                    </span>
                  </span>
                </div>
              </div>
            );
          }

          const ratio = value / target;
          const fillRatio = Math.min(1, ratio);
          const bufferRatio = Math.min(1, 1 + BUFFER);  // 1.05

          // Status:
          //  on track   : 95% ≤ ratio ≤ 100%   → fill teal
          //  acceptable : 100% < ratio ≤ 105%  → fill 100% teal, buffer orange to 105%
          //  over       : ratio > 105%        → fill 100% red, ratio continues
          //  under      : ratio < 95%          → fill teal to ratio, no warning
          let status: 'on-track' | 'acceptable' | 'over' | 'under' = 'on-track';
          if (ratio > 1.05) status = 'over';
          else if (ratio > 1) status = 'acceptable';
          else if (ratio < 0.95) status = 'under';

          return (
            <div key={key}>
              <div className="flex items-baseline justify-between mb-1">
                <span className="font-body text-caption uppercase tracking-widest text-ink/70">
                  {label}
                </span>
                <span
                  className={`font-display text-h3 tabular-nums leading-none ${
                    status === 'over' ? 'text-coral' : 'text-ink'
                  }`}
                >
                  {Math.round(value)}
                  <span className="text-ink/40 font-body text-sm font-normal ml-1">
                    / {Math.round(target)} {unit}
                  </span>
                </span>
              </div>
              <div className="h-2 bg-ink/10 relative overflow-hidden">
                {/* Buffer zone (only visible if value >= target) */}
                {ratio > 1 && ratio <= 1.05 && (
                  <div
                    className="absolute inset-y-0 left-0 bg-coral/40"
                    style={{ width: `${bufferRatio * 100}%` }}
                    aria-hidden
                  />
                )}
                {/* Filled portion */}
                <div
                  className={`absolute inset-y-0 left-0 transition-all duration-300 ${
                    status === 'over' ? 'bg-coral' : 'bg-teal'
                  }`}
                  style={{ width: `${fillRatio * 100}%` }}
                />
                {/* Target marker (small line at 100%) */}
                <div
                  className="absolute inset-y-0 w-px bg-ink/40"
                  style={{ left: '100%' }}
                  aria-hidden
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
