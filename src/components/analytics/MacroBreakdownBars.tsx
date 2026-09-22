'use client';

import type { AnalyticsTotals } from '@/hooks/useFoodAnalytics';

interface MacroBreakdownBarsProps {
  totals: AnalyticsTotals;
  loaded: boolean;
}

interface MacroDisplay {
  label: string;
  actual: number;
  target: number;
}

function MacroRow({
  label,
  actual,
  target,
  loaded,
}: {
  label: string;
  actual: number;
  target: number;
  loaded: boolean;
}) {
  if (!loaded) {
    return (
      <div className="flex items-center gap-4 py-3">
        <div className="h-4 w-20 bg-paper/10 animate-pulse" />
        <div className="h-4 w-32 bg-paper/10 animate-pulse" />
      </div>
    );
  }

  const diff = actual - target;
  const absDiff = Math.abs(diff);
  const pctOfTarget = target > 0 ? Math.round((actual / target) * 100) : 0;
  const onTarget = Math.abs(diff) <= 3; // within 3 percentage points

  return (
    <div className="flex items-center gap-4 py-3 border-b border-paper/10 last:border-b-0">
      <span className="font-body text-caption uppercase tracking-widest text-paper/70 w-20">
        {label}
      </span>
      <div className="flex items-baseline gap-1">
        <span className="font-display text-h2 text-paper tabular-nums">
          {pctOfTarget}
        </span>
        <span className="font-body text-caption text-paper/50">%</span>
      </div>
      <span className="font-body text-caption text-paper/40">of {target}% target</span>
      <div className="ml-auto flex items-center gap-2">
        {onTarget ? (
          <span className="text-teal text-lg" title="On target">●</span>
        ) : diff > 0 ? (
          <span className="text-coral text-lg" title={`${absDiff}% over target`}>▲</span>
        ) : (
          <span className="text-paper/50 text-lg" title={`${absDiff}% under target`}>▼</span>
        )}
        <span className={`font-body text-caption ${
          onTarget ? 'text-teal' : diff > 0 ? 'text-coral' : 'text-paper/50'
        }`}>
          {diff > 0 ? `+${absDiff}%` : diff < 0 ? `-${absDiff}%` : 'on target'}
        </span>
      </div>
    </div>
  );
}

export default function MacroBreakdownBars({
  totals,
  loaded,
}: MacroBreakdownBarsProps) {
  const avgProtein =
    totals.daysLogged > 0 ? totals.avgMacroSplit.protein : 0;
  const avgCarbs =
    totals.daysLogged > 0 ? totals.avgMacroSplit.carbs : 0;
  const avgFat =
    totals.daysLogged > 0 ? totals.avgMacroSplit.fat : 0;

  const macros: MacroDisplay[] = [
    { label: 'Protein', actual: avgProtein, target: 33 },
    { label: 'Carbs', actual: avgCarbs, target: 40 },
    { label: 'Fat', actual: avgFat, target: 27 },
  ];

  return (
    <div className="space-y-2">
      {macros.map((m) => (
        <MacroRow
          key={m.label}
          label={m.label}
          actual={m.actual}
          target={m.target}
          loaded={loaded}
        />
      ))}
      {loaded && totals.daysLogged > 0 && (
        <p className="font-body text-caption text-paper/50 pt-3 border-t border-paper/10 leading-relaxed">
          Average macro split across {totals.daysLogged} logged days. ● on target = within 3% of goal. Protein is the priority — it preserves muscle during a deficit.
        </p>
      )}
    </div>
  );
}
