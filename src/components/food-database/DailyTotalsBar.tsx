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

// Bar represents 0% to BAR_MAX (110%) of the target. Extending past
// 100% gives room for the 105%+ over zone to be visible inside the
// bar track, and lets the fill reach the right edge only when the
// user truly blows past 110%.
const BAR_MAX = 1.10;
// Thresholds as fractions of target. 95% is the upper edge of the
// shaded teal zone; 105% is the lower edge of the shaded coral zone.
const TEAL_THRESHOLD = 0.95;
const CORAL_THRESHOLD = 1.05;

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

        // Bar-relative positions for the threshold zones.
        const tealEndPct = (TEAL_THRESHOLD / BAR_MAX) * 100; // ≈86.36
        const coralStartPct = (CORAL_THRESHOLD / BAR_MAX) * 100; // ≈95.45
        const targetLinePct = (1 / BAR_MAX) * 100; // ≈90.91
        const fillBarPct =
          (Math.min(value / target, BAR_MAX) / BAR_MAX) * 100;

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
              className="h-4 bg-ink/10 relative overflow-hidden"
              aria-label={`${label} ${fillPctLabel}% of target ${Math.round(target)} ${unit}`}
            >
              {/* Shaded teal zone: 0–95% of target. Marks the "good"
                  range the user is aiming for. */}
              <div
                className="absolute inset-y-0 left-0 bg-teal/15"
                style={{ width: `${tealEndPct}%` }}
                aria-hidden
              />
              {/* Shaded coral zone: 105%+ of target. Marks the over
                  budget band; fill turns coral once it crosses here. */}
              <div
                className="absolute inset-y-0 bg-coral/15"
                style={{ left: `${coralStartPct}%`, right: 0 }}
                aria-hidden
              />
              {/* Fill: solid teal under 100%, solid coral once over. */}
              <div
                className="absolute inset-y-0 left-0"
                style={{ width: `${fillBarPct}%` }}
              >
                <div
                  className={`h-full transition-all duration-300 ${
                    status === 'over' ? 'bg-coral' : 'bg-teal'
                  }`}
                />
              </div>
              {/* 95% / 100% / 105% tick marks — thin vertical rules so
                  the threshold positions are visible regardless of fill. */}
              <div
                className="absolute inset-y-0 w-px bg-ink/30"
                style={{ left: `${tealEndPct}%` }}
                aria-hidden
              />
              <div
                className="absolute inset-y-0 w-0.5 bg-ink"
                style={{ left: `${targetLinePct}%` }}
                aria-hidden
              />
              <div
                className="absolute inset-y-0 w-px bg-ink/30"
                style={{ left: `${coralStartPct}%` }}
                aria-hidden
              />
              {/* 100% label, anchored to the right of the target line */}
              <span className="absolute -bottom-5 font-body text-[10px] uppercase tracking-widest text-ink/40 whitespace-nowrap" style={{ left: `${targetLinePct}%`, transform: 'translateX(-50%)' }}>
                100%
              </span>
              {/* Fill percentage pinned to the leading edge of the fill */}
              {fillPct > 0 && (
                <span
                  className="absolute -bottom-5 -translate-x-1/2 font-body text-caption tabular-nums font-semibold text-ink/60 whitespace-nowrap"
                  style={{ left: `${fillBarPct}%` }}
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
//
// Each slice also gets a small text label sitting just outside
// the ring, anchored at the placeholder segment's midpoint
// (60°, 180°, 300°). Labels stay put as the slices grow /
// shrink — only the colored arc lengths move.
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

  // Background ring: three equal placeholder segments so the user
  // always sees three slots and watches them fill with colour as
  // the day's intake comes in.
  const PLACEHOLDER_SEGMENTS = 3;
  const placeholderDeg = 360 / PLACEHOLDER_SEGMENTS;

  // Per-slice labels are anchored at the placeholder midpoint so
  // they stay put as the actual slices resize. The wrapper
  // container is sized bigger than the SVG to fit the labels
  // outside the ring without clipping.
  const LABEL_PAD = 32;
  const containerSize = PIE_SIZE + LABEL_PAD * 2;
  const containerCenter = containerSize / 2;
  const labelDistance = PIE_OUTER + 18;

  return (
    <div className="flex flex-col items-center gap-6">
      <div
        className="relative"
        style={{ width: containerSize, height: containerSize }}
      >
        <svg
          width={PIE_SIZE}
          height={PIE_SIZE}
          viewBox={`0 0 ${PIE_SIZE} ${PIE_SIZE}`}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
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

        {/* Per-slice labels — sit just outside the ring at the
            placeholder midpoints so each macro's accumulated
            amount + % of target is readable next to its slice. */}
        {slices.map((s, i) => {
          const midDeg = i * placeholderDeg + placeholderDeg / 2;
          const midRad = ((midDeg - 90) * Math.PI) / 180;
          const x = containerCenter + labelDistance * Math.cos(midRad);
          const y = containerCenter + labelDistance * Math.sin(midRad);
          const pct =
            s.target > 0
              ? Math.round((s.gramValue / s.target) * 100)
              : null;
          const over = pct != null && pct > 100;
          return (
            <div
              key={s.key}
              className="absolute -translate-x-1/2 -translate-y-1/2 text-center"
              style={{ left: x, top: y }}
            >
              <p className="font-body text-[10px] uppercase tracking-widest text-ink/60">
                {s.label}
              </p>
              <p className="font-display text-sm tabular-nums leading-tight">
                {Math.round(s.gramValue)}
                {s.target > 0 && (
                  <span className="text-ink/40 ml-0.5">
                    / {Math.round(s.target)}
                  </span>
                )}
                <span className="text-ink/40 text-[10px] uppercase tracking-widest ml-0.5">
                  g
                </span>
              </p>
              {pct != null && (
                <p
                  className={`font-body text-[10px] tabular-nums mt-0.5 ${
                    over ? 'text-coral' : 'text-ink/60'
                  }`}
                >
                  {pct}%
                </p>
              )}
            </div>
          );
        })}
      </div>
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
