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
const PIE_RADIUS = 130;
const PIE_STROKE = 26;
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

// Bar visualises 0% to TRACK_MAX (105%) of target. Shaded zones
// sit inside that range — there's no plain-grey track beyond
// 105% of target for the user to second-guess when they're under
// 100%. The fill grows from 0 up to FILL_CAP (110% of target) and
// is allowed to overflow past the right edge of the bar track so
// the user sees they've blown past 105%. Past the cap, the bar
// stops extending visually while the % label keeps climbing
// uncapped.
const TRACK_MAX = 1.05;
const FILL_CAP = 1.10;
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
        const fillPctLabel = Math.round(ratio * 100); // uncapped

        // Track positions (as % of bar width). The track itself
        // represents 0–105% of target, so 100% of target sits at
        // 100/105 ≈ 95.24% of bar width.
        const tealStartPct =
          (TEAL_THRESHOLD / TRACK_MAX) * 100; // ≈90.48
        const tealEndPct = (1.0 / TRACK_MAX) * 100; // ≈95.24
        const coralEndPct = (CORAL_THRESHOLD / TRACK_MAX) * 100; // 100
        const targetLinePct = tealEndPct; // 100% of target
        const fillCapPct = (FILL_CAP / TRACK_MAX) * 100; // ≈104.76
        const fillBarPct =
          (Math.min(value / target, FILL_CAP) / TRACK_MAX) * 100;

        return (
          <div key={key} className="relative pb-6 pt-5">
            <div className="flex items-baseline justify-between mb-2">
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
            {/* Bar wrapper: contains the labels above the tick
                marks, the bar track itself, and the fill-% label
                below. pt-5 on the parent gives the labels above
                room without colliding with the header. */}
            <div className="relative">
              {/* Tick labels above the bar. Pinned to the same
                  percentages as the tick marks underneath so the
                  95 / 100 / 105 numbers visually anchor to the
                  thresholds. */}
              <span
                className="absolute top-0 -translate-x-1/2 -translate-y-full font-body text-[10px] uppercase tracking-widest text-ink/40 whitespace-nowrap"
                style={{ left: `${tealStartPct}%` }}
                aria-hidden
              >
                95%
              </span>
              <span
                className="absolute top-0 -translate-x-1/2 -translate-y-full font-body text-[10px] uppercase tracking-widest text-ink font-semibold whitespace-nowrap"
                style={{ left: `${targetLinePct}%` }}
                aria-hidden
              >
                100%
              </span>
              <span
                className="absolute top-0 -translate-x-1/2 -translate-y-full font-body text-[10px] uppercase tracking-widest text-coral whitespace-nowrap"
                style={{ left: `${coralEndPct}%` }}
                aria-hidden
              >
                105%
              </span>
              {/* Track ends at the right edge (105% of target). No
                  overflow-hidden so the fill can run past the edge
                  when value > 105% — past that there's no grey
                  background, just the fill running into empty paper. */}
              <div
                className="h-4 bg-ink/10 relative"
                aria-label={`${label} ${fillPctLabel}% of target ${Math.round(target)} ${unit}`}
              >
                {/* Teal band: 95–100% of target. "Approaching target". */}
                <div
                  className="absolute inset-y-0 bg-teal/30"
                  style={{
                    left: `${tealStartPct}%`,
                    width: `${tealEndPct - tealStartPct}%`,
                  }}
                  aria-hidden
                />
                {/* Coral band: 100–105% of target. "Over budget". */}
                <div
                  className="absolute inset-y-0 bg-coral/30"
                  style={{
                    left: `${tealEndPct}%`,
                    width: `${coralEndPct - tealEndPct}%`,
                  }}
                  aria-hidden
                />
                {/* Fill: solid teal under 100% of target, solid coral
                    once over. Allowed to overflow the right edge
                    up to FILL_CAP (110% of target). The % label
                    below keeps climbing past the cap. */}
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
                {/* Tick marks at 95 / 100 / 105 (inside the track) and
                    a dashed tick at 110 (overflow position) marking
                    where the fill visually caps. */}
                <div
                  className="absolute inset-y-0 w-px bg-ink/30"
                  style={{ left: `${tealStartPct}%` }}
                  aria-hidden
                />
                <div
                  className="absolute inset-y-0 w-0.5 bg-ink"
                  style={{ left: `${targetLinePct}%` }}
                  aria-hidden
                />
                <div
                  className="absolute inset-y-0 w-px bg-ink/30"
                  style={{ left: `${coralEndPct}%` }}
                  aria-hidden
                />
                <div
                  className="absolute inset-y-0 w-px border-l border-dashed border-ink/40"
                  style={{ left: `${fillCapPct}%` }}
                  aria-hidden
                />
                {/* Fill percentage pinned to the leading edge of the
                    fill. Scales with the bar via percentage
                    positioning; can extend past the right edge when
                    value > 105%. */}
                {ratio > 0 && (
                  <span
                    className={`absolute -bottom-5 -translate-x-1/2 font-body text-caption tabular-nums font-semibold whitespace-nowrap ${
                      status === 'over' ? 'text-coral' : 'text-ink/60'
                    }`}
                    style={{ left: `${fillBarPct}%` }}
                    aria-hidden
                  >
                    {fillPctLabel}%
                  </span>
                )}
              </div>
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
//
// The whole thing is wrapped in a responsive container:
// `w-full max-w-[400px] aspect-square`. The SVG has a viewBox
// equal to the container's internal coordinate space, so it
// scales to any width. The slice labels are HTML divs positioned
// at SVG-relative percentages of the container, so they stay
// just outside the ring at every breakpoint.
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

  // viewBox / container size. Sized bigger than the pie so slice
  // labels can sit clearly outside the ring without overlapping
  // the strokes. The container is responsive — the SVG fills it,
  // so the internal coordinates map to whatever rendered width
  // the container ends up at.
  const LABEL_PAD = 70;
  const containerSize = PIE_SIZE + LABEL_PAD * 2; // 400
  const containerCenter = containerSize / 2; // 200
  // Distance from container center to the label baseline. Extra
  // space beyond the ring (PIE_OUTER + ~45) so the labels never
  // sit on top of the strokes.
  const labelDistance = PIE_OUTER + 45; // 166

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative w-full max-w-[400px] aspect-square">
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox={`0 0 ${containerSize} ${containerSize}`}
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
                  containerCenter,
                  containerCenter,
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
                      containerCenter,
                      containerCenter,
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
            x={containerCenter}
            y={containerCenter - 8}
            textAnchor="middle"
            fontFamily="Georgia, serif"
            fontSize="42"
            fontWeight="400"
            fill="#1A1A1A"
          >
            {Math.round(totals.kcal).toLocaleString()}
          </text>
          <text
            x={containerCenter}
            y={containerCenter + 22}
            textAnchor="middle"
            fontFamily="ui-sans-serif, system-ui, sans-serif"
            fontSize="13"
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
            amount + % of target is readable next to its slice.
            Positioned at SVG-relative percentages of the container
            so they scale with the pie on every breakpoint. */}
        {slices.map((s, i) => {
          const midDeg = i * placeholderDeg + placeholderDeg / 2;
          const midRad = ((midDeg - 90) * Math.PI) / 180;
          const svgX = containerCenter + labelDistance * Math.cos(midRad);
          const svgY = containerCenter + labelDistance * Math.sin(midRad);
          const xPct = (svgX / containerSize) * 100;
          const yPct = (svgY / containerSize) * 100;
          const pct =
            s.target > 0
              ? Math.round((s.gramValue / s.target) * 100)
              : null;
          const over = pct != null && pct > 100;
          return (
            <div
              key={s.key}
              className="absolute -translate-x-1/2 -translate-y-1/2 text-center"
              style={{ left: `${xPct}%`, top: `${yPct}%` }}
            >
              <p className="font-body text-[10px] sm:text-[11px] uppercase tracking-widest text-ink/60 leading-tight">
                {s.label}
              </p>
              <p className="font-display text-sm sm:text-base tabular-nums leading-tight">
                {Math.round(s.gramValue)}
                {s.target > 0 && (
                  <span className="text-ink/40 ml-0.5">
                    / {Math.round(s.target)}
                  </span>
                )}
                <span className="text-ink/40 text-[10px] sm:text-[11px] uppercase tracking-widest ml-0.5">
                  g
                </span>
              </p>
              {pct != null && (
                <p
                  className={`font-body text-[10px] sm:text-[11px] tabular-nums mt-0.5 ${
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
