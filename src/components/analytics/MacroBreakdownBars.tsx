'use client';

import type { AnalyticsTotals } from '@/hooks/useFoodAnalytics';

interface MacroBreakdownBarsProps {
  totals: AnalyticsTotals;
  loaded: boolean;
}

interface MacroBar {
  label: string;
  actual: number;
  target: number;
  unit: string;
}

function Bar({
  label,
  actual,
  target,
  unit,
  loaded,
}: {
  label: string;
  actual: number;
  target: number;
  unit: string;
  loaded: boolean;
}) {
  const pct = target > 0 ? (actual / target) * 100 : 0;
  const cappedPct = Math.min(pct, 150);
  const barColor =
    pct >= 95 && pct <= 105
      ? 'bg-teal'
      : pct > 105
      ? 'bg-coral'
      : 'bg-ink/30';

  const deficit = actual - target;
  const deficitLabel =
    deficit > 0 ? `+${Math.round(deficit)}${unit}` : `${Math.round(deficit)}${unit}`;

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <span className="font-body text-caption uppercase tracking-widest text-ink/60">
          {label}
        </span>
        {loaded ? (
          <span className="font-display text-h3 tabular-nums text-ink">
            {Math.round(actual)}{unit}
            <span className="font-body text-caption text-ink/40 ml-1">
              / {Math.round(target)}{unit}
            </span>
          </span>
        ) : (
          <div className="h-5 w-20 bg-ink/10 animate-pulse" />
        )}
      </div>
      <div className="relative h-3 bg-ink/10 overflow-hidden">
        {/* Target marker */}
        <div
          className="absolute top-0 bottom-0 w-px bg-ink/40"
          style={{ left: `${Math.min((100 / 150) * 100, 100)}%` }}
        />
        {loaded ? (
          <div
            className={`h-full transition-all duration-300 ${barColor}`}
            style={{ width: `${cappedPct}%` }}
          />
        ) : (
          <div className="h-full bg-ink/10 animate-pulse" />
        )}
      </div>
      {loaded && (
        <p className="font-body text-caption text-ink/40 tabular-nums text-right">
          {deficitLabel}
        </p>
      )}
    </div>
  );
}

export default function MacroBreakdownBars({
  totals,
  loaded,
}: MacroBreakdownBarsProps) {
  const avgProtein =
    totals.daysLogged > 0
      ? totals.avgMacroSplit.protein
      : 0;
  const avgCarbs =
    totals.daysLogged > 0
      ? totals.avgMacroSplit.carbs
      : 0;
  const avgFat =
    totals.daysLogged > 0
      ? totals.avgMacroSplit.fat
      : 0;

  // Recompute raw g/day averages from totals (for target comparison)
  // These come from the totals which store avg actuals per logged day
  const macros: MacroBar[] = [
    { label: 'Protein', actual: avgProtein, target: 33, unit: '%' },
    { label: 'Carbs', actual: avgCarbs, target: 40, unit: '%' },
    { label: 'Fat', actual: avgFat, target: 27, unit: '%' },
  ];

  return (
    <div className="space-y-5">
      {macros.map((m) => (
        <Bar
          key={m.label}
          label={m.label}
          actual={m.actual}
          target={m.target}
          unit={m.unit}
          loaded={loaded}
        />
      ))}
      {loaded && totals.daysLogged > 0 && (
        <p className="font-body text-caption text-ink/40 pt-2 border-t border-ink/10">
          Average split across {totals.daysLogged} logged days.
          Target band is 95–105% of goal (teal).
        </p>
      )}
    </div>
  );
}
