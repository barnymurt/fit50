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

// Pie dimensions. The ring is drawn with a stroked arc (not a
// filled pie + donut hole) so the thickness is a single tunable
// constant. Inner radius is large enough to host the kcal number
// without the stroke clipping it.
const PIE_RADIUS = 110;
const PIE_STROKE = 22;
const PIE_PADDING = 10;
const PIE_OUTER = PIE_RADIUS + PIE_STROKE / 2;
const PIE_SIZE = (PIE_OUTER + PIE_PADDING) * 2;
const PIE_CENTER = PIE_SIZE / 2;

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
          <PieView totals={totals} targets={targets} />
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
    <div className="space-y-7">
      {BARS.map(({ key, label, unit }) => {
        const value = totals[key];
        const target = targets?.[key] ?? 0;
        if (target <= 0) {
          return (
            <div key={key} className="relative pb-6">
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
          <div key={key} className="relative pb-6">
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
              {/* 100% marker label at the right edge of the bar */}
              <span className="absolute left-full -bottom-5 ml-1 font-body text-[10px] uppercase tracking-widest text-ink/40 whitespace-nowrap">
                100%
              </span>
              {/* Fill percentage pinned to the leading edge of the fill */}
              {fillPct > 0 && (
                <span
                  className="absolute -bottom-5 -translate-x-1/2 font-body text-caption tabular-nums font-semibold text-ink/60 whitespace-nowrap"
                  style={{ left: `${fillPct * 100}%` }}
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
  );
}

// SVG arc starts at 12 o'clock and proceeds clockwise. Stroked
// (not filled) — the visible ring is just the stroke, no donut
// hole to mask. Inner radius is large enough that the center
// text never clips the stroke.
function PieView({
  totals,
  targets,
}: {
  totals: { kcal: number; protein: number; carbs: number; fat: number };
  targets: MacroTargets | null;
}) {
  const pKcal = totals.protein * PROTEIN_KCAL_PER_G;
  const cKcal = totals.carbs * CARBS_KCAL_PER_G;
  const fKcal = totals.fat * FAT_KCAL_PER_G;
  const total = pKcal + cKcal + fKcal;

  const slices = [
    {
      key: 'protein',
      label: 'Protein',
      kcalValue: pKcal,
      gramValue: totals.protein,
      target: targets?.protein ?? 0,
      color: '#4A9B9B', // teal
    },
    {
      key: 'carbs',
      label: 'Carbs',
      kcalValue: cKcal,
      gramValue: totals.carbs,
      target: targets?.carbs ?? 0,
      color: '#E88B5A', // coral
    },
    {
      key: 'fat',
      label: 'Fat',
      kcalValue: fKcal,
      gramValue: totals.fat,
      target: targets?.fat ?? 0,
      color: '#1A1A1A', // ink
    },
  ];

  // The legend lists all four tracked totals — the three macros
  // (matching the ring) plus the calorie total (matching the
  // number in the center). Each row carries current + target +
  // percent of target.
  const legendItems = [
    {
      key: 'kcal',
      label: 'Calories',
      value: totals.kcal,
      target: targets?.kcal ?? 0,
      unit: 'kcal',
      color: '#1A1A1A',
    },
    ...slices.map((s) => ({
      key: s.key,
      label: s.label,
      value: s.gramValue,
      target: s.target,
      unit: 'g',
      color: s.color,
    })),
  ];

  // Background ring: three equal placeholder segments so the user
  // always sees three slots and watches them fill with colour as
  // the day's intake comes in.
  const PLACEHOLDER_SEGMENTS = 3;
  const placeholderDeg = 360 / PLACEHOLDER_SEGMENTS;

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="shrink-0">
        <svg
          width={PIE_SIZE}
          height={PIE_SIZE}
          viewBox={`0 0 ${PIE_SIZE} ${PIE_SIZE}`}
          aria-label={`Today's macro split — protein ${pKcal.toFixed(0)} kcal, carbs ${cKcal.toFixed(0)} kcal, fat ${fKcal.toFixed(0)} kcal`}
          role="img"
        >
          {/* Placeholder segments: always rendered, faint, equal thirds */}
          {Array.from({ length: PLACEHOLDER_SEGMENTS }).map((_, i) => {
            const startDeg = i * placeholderDeg;
            const endDeg = (i + 1) * placeholderDeg;
            const slice = slices[i];
            return (
              <path
                key={`bg-${slice.key}`}
                d={arcStrokePath(
                  PIE_CENTER,
                  PIE_CENTER,
                  PIE_RADIUS,
                  startDeg,
                  endDeg
                )}
                fill="none"
                stroke={slice.color}
                strokeOpacity="0.15"
                strokeWidth={PIE_STROKE}
              />
            );
          })}

          {/* Colored slices: overlay proportional to actual intake */}
          {total > 0 &&
            (() => {
              let cursor = 0;
              return slices.map((s) => {
                if (s.kcalValue <= 0) return null;
                const sliceDeg = (s.kcalValue / total) * 360;
                const startDeg = cursor;
                const endDeg = cursor + sliceDeg;
                cursor = endDeg;
                return (
                  <path
                    key={s.key}
                    d={arcStrokePath(
                      PIE_CENTER,
                      PIE_CENTER,
                      PIE_RADIUS,
                      startDeg,
                      endDeg
                    )}
                    fill="none"
                    stroke={s.color}
                    strokeWidth={PIE_STROKE}
                    aria-label={`${s.label}: ${s.kcalValue.toFixed(0)} kcal`}
                  />
                );
              });
            })()}

          {/* Center text — kcal accumulated, target below, KCAL label.
              The target value only shows when targets are configured. */}
          <text
            x={PIE_CENTER}
            y={PIE_CENTER - 6}
            textAnchor="middle"
            fontFamily="Georgia, serif"
            fontSize="36"
            fontWeight="400"
            fill="#1A1A1A"
          >
            {Math.round(totals.kcal).toLocaleString()}
          </text>
          <text
            x={PIE_CENTER}
            y={PIE_CENTER + 18}
            textAnchor="middle"
            fontFamily="ui-sans-serif, system-ui, sans-serif"
            fontSize="11"
            letterSpacing="0.16em"
            fill="#1A1A1A"
            fillOpacity="0.55"
          >
            {targets?.kcal
              ? `/ ${Math.round(targets.kcal)} KCAL`
              : 'KCAL'}
          </text>
        </svg>
      </div>

      <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 font-body text-sm">
        {legendItems.map((item) => {
          const pct =
            item.target > 0
              ? Math.round((item.value / item.target) * 100)
              : null;
          const over = pct != null && pct > 100;
          return (
            <li key={item.key} className="flex items-center gap-2">
              <span
                aria-hidden
                className="inline-block w-3 h-3"
                style={{ backgroundColor: item.color }}
              />
              <span className="font-body text-caption uppercase tracking-widest text-ink/60">
                {item.label}
              </span>
              <span className="font-display tabular-nums">
                {Math.round(item.value)}
                {item.target > 0 && (
                  <span className="text-ink/40 ml-1">
                    / {Math.round(item.target)}
                  </span>
                )}
                <span className="text-ink/40 text-xs uppercase tracking-widest ml-1">
                  {item.unit}
                </span>
              </span>
              {pct != null && (
                <span
                  className={`text-xs uppercase tracking-widest tabular-nums ${
                    over ? 'text-coral' : 'text-ink/40'
                  }`}
                >
                  {pct}%
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// Generate an SVG path for a stroked arc starting at `startDeg`
// (clockwise from 12 o'clock) ending at `endDeg`. The arc runs
// along the ring's centerline; no fill, no Z (no back-to-center
// line). Used by the donut-style pie to draw both the placeholder
// segments and the colored intake slices.
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
  return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
}
