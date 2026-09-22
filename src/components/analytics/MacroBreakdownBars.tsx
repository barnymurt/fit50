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
  const over = pct > 100;
  const barColor =
    pct >= 95 && pct <= 105
      ? 'bg-teal'
      : pct > 105
      ? 'bg-coral'
      : 'bg-ink/30';

  const deficit = actual - target;
  const deficitLabel =
    over
      ? `+${Math.round(actual - target)}${unit} over (${Math.round(pct)}% of target)`
      : deficit > 0
      ? `+${Math.round(deficit)}${unit}`
      : `${Math.round(deficit)}${unit}`;

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <span className="font-body text-caption uppercase tracking-widest text-paper/80">
          {label}
        </span>
        {loaded ? (
          <span className="font-display text-h3 tabular-nums text-paper">
            {Math.round(actual)}{unit}
            {over && (
              <span className="font-body text-caption text-coral ml-1">
                ({Math.round(pct)}%)
              </span>
            )}
            <span className="font-body text-caption text-paper/50 ml-1">
              / {Math.round(target)}{unit}
            </span>
          </span>
        ) : (
          <div className="h-5 w-20 bg-paper/10 animate-pulse" />
        )}
      </div>
      <div className="relative h-3 bg-paper/10 overflow-hidden rounded-none">
        {/* Target marker at 100% */}
        <div
          className="absolute top-0 bottom-0 w-px bg-paper/40"
          style={{ left: '100%' }}
        />
        {loaded ? (
          <div
            className={`h-full transition-all duration-300 ${barColor}`}
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        ) : (
          <div className="h-full bg-paper/10 animate-pulse" />
        )}
        {/* Overflow arrow when over 100% */}
        {over && (
          <div
            className="absolute top-0 bottom-0 flex items-center"
            style={{ left: '100%', transform: 'translateX(-1px)' }}
          >
            <span className="text-coral text-xs leading-none">→</span>
          </div>
        )}
      </div>
      {loaded && (
        <p className="font-body text-caption text-paper/60 tabular-nums text-right">
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
        <p className="font-body text-caption text-ink/70 pt-2 border-t border-ink/10 leading-relaxed">
          Average macro split across {totals.daysLogged} logged days. Teal bar = on target (95–105%). Watch protein — it&apos;s the most important macro for preserving muscle during a deficit.
        </p>
      )}
    </div>
  );
}
