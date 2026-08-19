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

// Bar zones (% of target):
//   0%–95%  : empty (ink/10 background)
//   95%–100%: teal hatched (close to target)
//   100%–105%: coral hatched (over-target but within tolerance)
//   >105%   : full coral (warning)
const TIGHT = 0.95;
const BUFFER = 0.05;
// Total bar width represents target × (TIGHT + BUFFER) = 100% of target.
const TOTAL_BAR = TIGHT + BUFFER; // 1.0

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
      <div className="p-6 space-y-5">
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
          // Positions on the bar (0 .. TOTAL_BAR):
          //   tightEndPct   = 95% mark  (teal zone starts)
          //   targetPct    = 100% mark (finish line)
          //   bufferEndPct = 105% mark (end of bar)
          const tightEnd = TIGHT / TOTAL_BAR;        // 0.95 / 1.0 = 0.95
          const targetPct = 1 / TOTAL_BAR;            // 1.0 / 1.0 = 1.0
          const bufferEndPct = TOTAL_BAR / TOTAL_BAR;  // 1.0
          // Fill position:
          const fillPct = Math.min(ratio / TOTAL_BAR, 1);  // how far across the visible bar

          // Status: only flag "over" past 105% — within 95-105% is
          // acceptable and shown in the standard teal/ink colour.
          let status: 'on-track' | 'over' = 'on-track';
          if (ratio > 1 + BUFFER) status = 'over';

          const fillPctLabel = Math.round(ratio * 100);

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
              <div
                className="h-4 bg-ink/10 relative"
                aria-label={`${label} ${fillPctLabel}% of target ${Math.round(target)} ${unit}, 5% buffer at 100-105%`}
              >
                {/* 95%→100% zone — teal hatched (you're getting close) */}
                <div
                  className="absolute inset-y-0"
                  style={{
                    left: `${tightEnd * 100}%`,
                    width: `${(targetPct - tightEnd) * 100}%`,
                    backgroundImage:
                      'repeating-linear-gradient(45deg, rgba(74,155,155,0.30) 0 4px, transparent 4px 8px)',
                    backgroundColor: 'rgba(74,155,155,0.10)',
                  }}
                  aria-hidden
                />
                {/* 100%→105% zone — coral hatched (over-target but within tolerance) */}
                <div
                  className="absolute inset-y-0"
                  style={{
                    left: `${targetPct * 100}%`,
                    width: `${(bufferEndPct - targetPct) * 100}%`,
                    backgroundImage:
                      'repeating-linear-gradient(45deg, rgba(232,139,90,0.30) 0 4px, transparent 4px 8px)',
                    backgroundColor: 'rgba(232,139,90,0.10)',
                  }}
                  aria-hidden
                />
                {/* Fill (clipped to bar width) */}
                <div
                  className="absolute inset-y-0 left-0 overflow-hidden"
                  style={{ width: `${fillPct * 100}%` }}
                >
                  <div
                    className={`h-full transition-all duration-300 ${
                      status === 'over' ? 'bg-coral' : 'bg-teal'
                    }`}
                    style={{ width: '100%' }}
                  />
                </div>
                {/* 100% target marker — thick line + flag + "100%" label */}
                <div
                  className="absolute inset-y-0 w-0.5 bg-ink"
                  style={{ left: `${targetPct * 100}%` }}
                  aria-hidden
                />
                <div
                  className="absolute top-0 -translate-x-1/2"
                  style={{ left: `${targetPct * 100}%` }}
                  aria-hidden
                >
                  <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-ink" />
                </div>
                <span
                  className="absolute top-3 -translate-x-1/2 font-body text-caption uppercase tracking-widest text-ink/70 font-medium"
                  style={{ left: `${targetPct * 100}%` }}
                  aria-hidden
                >
                  100%
                </span>
                {/* 95% and 105% boundary labels (small) */}
                <span
                  className="absolute -bottom-5 -translate-x-1/2 font-body text-[10px] uppercase tracking-widest text-ink/40"
                  style={{ left: `${tightEnd * 100}%` }}
                  aria-hidden
                >
                  95%
                </span>
                <span
                  className="absolute -bottom-5 -translate-x-1/2 font-body text-[10px] uppercase tracking-widest text-ink/40"
                  style={{ left: `${bufferEndPct * 100}%` }}
                  aria-hidden
                >
                  105%
                </span>
                {/* Percent-complete label — sits right of the fill's
                    leading edge, with a dark ink pill for readability. */}
                {fillPct > 0 && (
                  <span
                    className="absolute top-1/2 -translate-y-1/2 inline-flex items-center justify-center font-body text-caption tabular-nums font-semibold bg-ink text-paper px-1.5 py-0.5 pointer-events-none whitespace-nowrap"
                    style={{
                      left: `calc(${fillPct * 100}% + 4px)`,
                      transform: 'translate(0, -50%)',
                    }}
                    aria-hidden
                  >
                    {fillPctLabel}%
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
