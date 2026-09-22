'use client';

import type { AnalyticsTotals } from '@/hooks/useFoodAnalytics';

interface MacroSplitDonutProps {
  totals: AnalyticsTotals;
  loaded: boolean;
}

function arcStrokePath(
  cx: number,
  cy: number,
  r: number,
  startDeg: number,
  endDeg: number
): string {
  const startRad = (startDeg - 90) * (Math.PI / 180);
  const endRad = (endDeg - 90) * (Math.PI / 180);
  const x1 = cx + r * Math.cos(startRad);
  const y1 = cy + r * Math.sin(startRad);
  const x2 = cx + r * Math.cos(endRad);
  const y2 = cy + r * Math.sin(endRad);
  const largeArc = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${largeArc} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
}

const SLICES = [
  { key: 'protein' as const, label: 'Protein', color: '#1A1A1A' },
  { key: 'carbs' as const, label: 'Carbs', color: '#F2D9A2' },
  { key: 'fat' as const, label: 'Fat', color: '#E88B5A' },
];

export default function MacroSplitDonut({
  totals,
  loaded,
}: MacroSplitDonutProps) {
  const split = totals.avgMacroSplit;
  const total = split.protein + split.carbs + split.fat || 100;
  const cx = 60;
  const cy = 60;
  const r = 48;

  let deg = 0;
  const arcs = SLICES.map((s) => {
    const pct = (split[s.key] / total) * 360;
    const startDeg = deg;
    const endDeg = deg + pct;
    deg = endDeg;
    return { ...s, startDeg, endDeg, pct };
  });

  const avgKcal = Math.round(totals.avgKcalActual);

  return (
    <div className="flex flex-col items-center gap-4">
      <svg viewBox="0 0 120 120" className="w-32 h-32" aria-label="Macro split donut">
        {/* Background ring */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1A1A1A" strokeWidth={0.08} opacity={0.08} />

        {loaded && totals.daysLogged > 0 ? (
          arcs.map((arc) => (
            <path
              key={arc.key}
              d={arcStrokePath(cx, cy, r, arc.startDeg, arc.endDeg)}
              fill="none"
              stroke={arc.color}
              strokeWidth={12}
              strokeLinecap="butt"
            />
          ))
        ) : (
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1A1A1A" strokeWidth={12} opacity={0.1} />
        )}

        {/* Center label */}
        <text
          x={cx}
          y={cy - 6}
          textAnchor="middle"
          fontSize={11}
          fill="#1A1A1A"
          fontFamily="Fraunces, Georgia, serif"
          fontWeight={400}
        >
          {loaded ? `${avgKcal}` : '—'}
        </text>
        <text
          x={cx}
          y={cy + 8}
          textAnchor="middle"
          fontSize={8}
          fill="#1A1A1A"
          opacity={0.5}
          fontFamily="Inter, sans-serif"
        >
          kcal/day
        </text>
      </svg>

      <div className="flex gap-4">
        {SLICES.map((s) => (
          <div key={s.key} className="flex items-center gap-1.5">
            <span
              className="inline-block w-3 h-3"
              style={{ backgroundColor: s.color }}
            />
            <span className="font-body text-caption text-ink/60 uppercase tracking-widest">
              {s.label}{' '}
              <span className="font-display tabular-nums text-ink">
                {loaded && totals.daysLogged > 0 ? `${split[s.key]}%` : '—'}
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
