'use client';

import { useState } from 'react';
import { Food, MacroTargets } from './types';

interface Props {
  totals: { kcal: number; protein: number; carbs: number; fat: number };
  targets: MacroTargets | null;
}

// Protein = 4 kcal/g, carbs = 4 kcal/g, fat = 9 kcal/g. Alcohol
// and other macros are out of scope — pie shows the three
// macronutrients only.
const PROTEIN_KCAL_PER_G = 4;
const CARBS_KCAL_PER_G = 4;
const FAT_KCAL_PER_G = 9;

export default function DailyTotalsBar({ totals, targets }: Props) {
  const [mode, setMode] = useState<'bar' | 'pie'>('bar');

  return (
    <div className="bg-paper border border-ink/15">
      <div className="px-6 py-4 border-b border-ink/10 flex items-baseline justify-between gap-3 flex-wrap">
        <p className="font-body text-caption uppercase tracking-widest text-ink/50">
          Daily totals
        </p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setMode('bar')}
            aria-pressed={mode === 'bar'}
            className={`px-3 py-1 font-body text-caption uppercase tracking-widest border transition-colors ${
              mode === 'bar'
                ? 'border-coral bg-coral text-paper'
                : 'border-ink/20 text-ink/60 hover:border-ink/40'
            }`}
          >
            Bar
          </button>
          <button
            type="button"
            onClick={() => setMode('pie')}
            aria-pressed={mode === 'pie'}
            className={`px-3 py-1 font-body text-caption uppercase tracking-widest border transition-colors ${
              mode === 'pie'
                ? 'border-coral bg-coral text-paper'
                : 'border-ink/20 text-ink/60 hover:border-ink/40'
            }`}
          >
            Pie
          </button>
        </div>
      </div>
      <div className="p-6">
        {mode === 'bar' ? (
          <BarView totals={totals} targets={targets} />
        ) : (
          <PieView totals={totals} />
        )}
      </div>
    </div>
  );
}

const BARS: { key: 'kcal' | 'protein' | 'carbs' | 'fat'; label: string; unit: string }[] = [
  { key: 'kcal', label: 'Calories', unit: 'kcal' },
  { key: 'protein', label: 'Protein', unit: 'g' },
  { key: 'carbs', label: 'Carbs', unit: 'g' },
  { key: 'fat', label: 'Fat', unit: 'g' },
];

function BarView({
  totals,
  targets,
}: {
  totals: { kcal: number; protein: number; carbs: number; fat: number };
  targets: MacroTargets | null;
}) {
  return (
    <div className="space-y-5">
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
        const status: 'on-track' | 'over' = ratio > 1 ? 'over' : 'on-track';
        const fillPct = Math.min(ratio, 1);
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
              aria-label={`${label} ${fillPctLabel}% of target ${Math.round(target)} ${unit}`}
            >
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
              <div
                className="absolute inset-y-0 w-0.5 bg-ink"
                style={{ left: '100%' }}
                aria-hidden
              />
              <span
                className="absolute -bottom-5 left-full -translate-x-full -ml-1 font-body text-[10px] uppercase tracking-widest text-ink/40"
                aria-hidden
              >
                100%
              </span>
            </div>
            {fillPct > 0 && (
              <span
                className="absolute -bottom-5 inline-flex items-center justify-center font-body text-caption tabular-nums font-semibold text-ink/60"
                aria-hidden
              >
                {fillPctLabel}%
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

const PIE_RADIUS = 72;
const PIE_CENTER = 84;

function PieView({
  totals,
}: {
  totals: { kcal: number; protein: number; carbs: number; fat: number };
}) {
  const pKcal = totals.protein * PROTEIN_KCAL_PER_G;
  const cKcal = totals.carbs * CARBS_KCAL_PER_G;
  const fKcal = totals.fat * FAT_KCAL_PER_G;
  const total = pKcal + cKcal + fKcal;

  const slices = [
    {
      key: 'protein',
      label: 'Protein',
      value: pKcal,
      color: '#4A9B9B', // teal
    },
    {
      key: 'carbs',
      label: 'Carbs',
      value: cKcal,
      color: '#E88B5A', // coral
    },
    {
      key: 'fat',
      label: 'Fat',
      value: fKcal,
      color: '#1A1A1A', // ink
    },
  ];

  // SVG arc starts at 12 o'clock and proceeds clockwise. The pie
  // circumference maps degrees to arc lengths; each slice gets
  // `startAngle..startAngle + sliceDegrees` degrees.
  return (
    <div className="flex flex-col md:flex-row items-center gap-6">
      <div className="shrink-0">
        <svg
          width={PIE_CENTER * 2}
          height={PIE_CENTER * 2}
          viewBox={`0 0 ${PIE_CENTER * 2} ${PIE_CENTER * 2}`}
          aria-label={`Today's macro split — protein ${pKcal.toFixed(0)} kcal, carbs ${cKcal.toFixed(0)} kcal, fat ${fKcal.toFixed(0)} kcal`}
          role="img"
        >
          {total <= 0 ? (
            <circle
              cx={PIE_CENTER}
              cy={PIE_CENTER}
              r={PIE_RADIUS}
              fill="none"
              stroke="#1A1A1A"
              strokeOpacity="0.15"
              strokeWidth="2"
              strokeDasharray="4 4"
            />
          ) : (
            (() => {
              let cursor = 0;
              return slices.map((s) => {
                if (s.value <= 0) return null;
                const sliceDeg = (s.value / total) * 360;
                const startDeg = cursor;
                const endDeg = cursor + sliceDeg;
                cursor = endDeg;
                return (
                  <path
                    key={s.key}
                    d={arcPath(PIE_CENTER, PIE_CENTER, PIE_RADIUS, startDeg, endDeg)}
                    fill={s.color}
                    aria-label={`${s.label}: ${s.value.toFixed(0)} kcal`}
                  />
                );
              });
            })()
          )}
          <circle cx={PIE_CENTER} cy={PIE_CENTER} r="20" fill="#FAF6EE" />
          {total > 0 && (
            <text
              x={PIE_CENTER}
              y={PIE_CENTER - 4}
              textAnchor="middle"
              fontFamily="Georgia, serif"
              fontSize="16"
              fill="#1A1A1A"
              className="font-display"
            >
              {Math.round(totals.kcal).toLocaleString()}
            </text>
          )}
          {total > 0 && (
            <text
              x={PIE_CENTER}
              y={PIE_CENTER + 12}
              textAnchor="middle"
              fontFamily="ui-sans-serif, system-ui, sans-serif"
              fontSize="9"
              letterSpacing="0.16em"
              fill="#1A1A1A"
              fillOpacity="0.6"
              className="font-body uppercase"
            >
              KCAL
            </text>
          )}
        </svg>
      </div>
      <ul className="flex flex-col gap-2 font-body text-sm w-full md:flex-1">
        {slices.map((s) => (
          <li key={s.key} className="flex items-center gap-3">
            <span
              aria-hidden
              className="inline-block w-3 h-3"
              style={{ backgroundColor: s.color }}
            />
            <span className="font-body text-caption uppercase tracking-widest text-ink/60 min-w-20">
              {s.label}
            </span>
            <span className="font-display tabular-nums">
              {s.value.toFixed(0)}
              <span className="text-ink/40 text-xs uppercase tracking-widest ml-1">
                kcal
              </span>
            </span>
            {total > 0 && (
              <span className="text-ink/40 text-xs uppercase tracking-widest ml-auto">
                {Math.round((s.value / total) * 100)}%
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

// Generate an SVG path for an arc slice starting at `startDeg` (clockwise
// from 12 o'clock) ending at `endDeg`. The slice starts at 12 o'clock
// (cx, cy - r) and sweeps clockwise.
function arcPath(
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
  return [
    `M ${cx} ${cy}`,
    `L ${x1} ${y1}`,
    `A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`,
    'Z',
  ].join(' ');
}
