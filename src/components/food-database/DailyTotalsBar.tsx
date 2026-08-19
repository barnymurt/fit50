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

// ±5% buffer zone. Within 5% of target → acceptable.
// Past 105% → over (warning).
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
          const fillPct = Math.round(fillRatio * 100);
          const targetPct = 100; // bar's 100% mark is the target
          const bufferEndPct = 105;

          // Status:
          //  on track   : 95% ≤ ratio ≤ 100%   → fill teal
          //  acceptable : 100% < ratio ≤ 105%  → fill 100% teal, buffer orange to 105%
          //  over       : ratio > 105%        → fill 100% red, ratio continues
          //  under      : ratio < 95%          → fill teal to ratio, no warning
          let status: 'on-track' | 'acceptable' | 'over' | 'under' = 'on-track';
          if (ratio > 1.05) status = 'over';
          else if (ratio > 1) status = 'acceptable';
          else if (ratio < 0.95) status = 'under';

          // Bar visible region: 0% → 105% of target (so the 5% buffer
          // is part of the bar, not a separate strip clipped off). Total
          // bar width represents 105% of target.
          const barTotalPct = 105;

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
                  <span
                    className={`ml-2 font-body text-caption uppercase tracking-widest tabular-nums ${
                      status === 'over'
                        ? 'text-coral'
                        : status === 'acceptable'
                        ? 'text-coral/80'
                        : 'text-ink/50'
                    }`}
                  >
                    {fillPct}%
                  </span>
                </span>
              </div>
              <div
                className="h-3 bg-ink/10 relative"
                aria-label={`${label} ${fillPct}% of target ${Math.round(target)} ${unit} with 5% buffer`}
              >
                {/* Filled portion (clipped to bar width) */}
                <div
                  className="absolute inset-y-0 left-0 overflow-hidden"
                  style={{ width: `${(fillRatio / 1.05) * 100}%` }}
                >
                  <div
                    className={`h-full transition-all duration-300 ${
                      status === 'over' ? 'bg-coral' : 'bg-teal'
                    }`}
                    style={{ width: `${(fillPct / bufferEndPct) * 100}%` }}
                  />
                </div>
                {/* 5% buffer zone — always visible. Hatched coral pattern
                    so it reads as 'acceptable tolerance' rather than
                    'extra room to fill'. Sits at 100-105% of target. */}
                <div
                  className="absolute inset-y-0 bg-coral/25"
                  style={{
                    left: `${(100 / 105) * 100}%`,
                    width: `${(5 / 105) * 100}%`,
                    backgroundImage:
                      'repeating-linear-gradient(45deg, rgba(232,139,90,0.22) 0 4px, transparent 4px 8px)',
                  }}
                  aria-hidden
                />
                {/* Target marker (solid line at 100%) */}
                <div
                  className="absolute inset-y-0 w-px bg-ink/60"
                  style={{ left: `${(100 / 105) * 100}%` }}
                  aria-hidden
                />
                {/* +5% buffer label, sits to the right of the bar */}
                <span
                  className="absolute top-1/2 -translate-y-1/2 left-full ml-1 text-[10px] font-body uppercase tracking-widest text-coral/80 pointer-events-none whitespace-nowrap"
                  aria-hidden
                >
                  +5%
                </span>
                {/* Percent-complete label on the fill (only when fill is
                    wide enough to host it without clipping) */}
                {fillRatio >= 0.18 && (
                  <span
                    className={`absolute top-1/2 -translate-y-1/2 font-body text-caption tabular-nums font-medium ${
                      status === 'over' ? 'text-paper' : 'text-paper'
                    }`}
                    style={{
                      left: `${(fillRatio / 1.05) * 100}%`,
                      transform: 'translate(-50%, -50%)',
                      textShadow: '0 1px 2px rgba(0,0,0,0.4)',
                      pointerEvents: 'none',
                    }}
                    aria-hidden
                  >
                    {fillPct}%
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
