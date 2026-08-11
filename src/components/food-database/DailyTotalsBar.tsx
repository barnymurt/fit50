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
          const pct = target > 0 ? (value / target) * 100 : 0;
          const over = pct > 100;
          const fillPct = Math.min(100, pct);
          return (
            <div key={key}>
              <div className="flex items-baseline justify-between mb-1">
                <span className="font-body text-caption uppercase tracking-widest text-ink/70">
                  {label}
                </span>
                <span
                  className={`font-display text-h3 tabular-nums leading-none ${
                    over ? 'text-coral' : 'text-ink'
                  }`}
                >
                  {Math.round(value)}
                  <span className="text-ink/40 font-body text-sm font-normal ml-1">
                    / {target > 0 ? Math.round(target) : '—'} {unit}
                  </span>
                </span>
              </div>
              <div className="h-2 bg-ink/10 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    over ? 'bg-coral' : 'bg-teal'
                  }`}
                  style={{ width: `${fillPct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
