'use client';

import type { AnalyticsDay, AnalyticsTotals } from '@/hooks/useFoodAnalytics';
import { formatDateKeyShort } from '@/lib/dates';

const CSS_VAR = {
  ink: '#1A1A1A',
  paper: '#FAF6EE',
  teal: '#4A9B9B',
  coral: '#E88B5A',
} as const;

interface DailyBalanceChartProps {
  days: AnalyticsDay[];
  totals: AnalyticsTotals;
  loaded: boolean;
}

const PADDING = { top: 24, right: 16, bottom: 48, left: 64 };
const LABEL_SIZE = 12;

export default function DailyBalanceChart({
  days,
  totals,
  loaded,
}: DailyBalanceChartProps) {
  const loggedDays = days.filter((d) => d.hadLoggedFood);
  if (loggedDays.length === 0 && !loaded) {
    return (
      <div className="h-64 flex items-center justify-center">
        <p className="font-body text-ink/40 text-sm">Loading…</p>
      </div>
    );
  }

  if (loggedDays.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center border border-dashed border-ink/20">
        <p className="font-body text-ink/50 text-sm text-center px-8">
          No food logged yet. Log meals to see your daily balance here.
        </p>
      </div>
    );
  }

  // Y range: symmetric around 0, clamp to data
  const yValues = loggedDays.flatMap((d) => [d.kcalUnderOver, d.kcalUnderOverAdjusted]);
  const maxAbs = Math.max(Math.abs(Math.min(...yValues)), Math.abs(Math.max(...yValues)), 500);
  const yRange = [-maxAbs, maxAbs] as [number, number];

  const W = 800;
  const H = 280;
  const plotW = W - PADDING.left - PADDING.right;
  const plotH = H - PADDING.top - PADDING.bottom;

  const xScale = (i: number) => (i / Math.max(loggedDays.length - 1, 1)) * plotW;
  const yScale = (v: number) =>
    ((yRange[1] - v) / (yRange[1] - yRange[0])) * plotH;

  const midY = yScale(0);

  // Y-axis ticks
  const yTickStep = Math.pow(10, Math.floor(Math.log10(maxAbs)));
  const yTicks: number[] = [];
  for (let t = yRange[0]; t <= yRange[1]; t += yTickStep / 2) {
    yTicks.push(Math.round(t / 50) * 50);
  }
  const yTicksSet = [...new Set(yTicks)];

  // Build path segments (gap on missing days)
  function buildPath(
    key: 'kcalUnderOver' | 'kcalUnderOverAdjusted'
  ): string {
    const segments: string[] = [];
    let penDown = false;

    for (let i = 0; i < loggedDays.length; i++) {
      const d = loggedDays[i];
      const x = PADDING.left + xScale(i);
      const y = PADDING.top + yScale(d[key]);
      if (!penDown) {
        segments.push(`M ${x} ${y}`);
        penDown = true;
      } else {
        const prev = loggedDays[i - 1];
        const prevDate = new Date(prev.day_key);
        const currDate = new Date(d.day_key);
        const dayDiff = Math.round(
          (currDate.getTime() - prevDate.getTime()) / 86_400_000
        );
        if (dayDiff > 2) {
          segments.push(`M ${x} ${y}`);
        } else {
          segments.push(`L ${x} ${y}`);
        }
      }
    }
    return segments.join(' ');
  }

  const dailyPath = buildPath('kcalUnderOver');
  const adjustedPath = buildPath('kcalUnderOverAdjusted');
  const rollingPath = (() => {
    const entries = Object.entries(totals.rolling7UnderOver).sort(([a], [b]) =>
      a.localeCompare(b)
    );
    if (entries.length < 2) return '';
    const pts = entries.map(([key, val]) => {
      const idx = loggedDays.findIndex((d) => d.day_key === key);
      if (idx < 0) return null;
      return {
        x: PADDING.left + xScale(idx),
        y: PADDING.top + yScale(val),
      };
    }).filter(Boolean) as { x: number; y: number }[];
    if (pts.length < 2) return '';
    return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  })();

  // X-axis tick positions (every N days to avoid crowding)
  const xTickStep = loggedDays.length <= 10 ? 1 : loggedDays.length <= 20 ? 2 : 7;
  const xTicks = loggedDays
    .map((d, i) => ({ i, d }))
    .filter(({ i }) => i === 0 || i === loggedDays.length - 1 || i % xTickStep === 0);

  return (
    <div className="overflow-x-auto" style={{ minWidth: '320px' }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full block"
        aria-label="Daily calorie balance chart"
        role="img"
      >
        <style>{`
          .chart-axis-label { font-family: Inter, sans-serif; fill: ${CSS_VAR.ink}; }
          .chart-line { stroke: ${CSS_VAR.coral}; stroke-width: 2; fill: none; stroke-linejoin: round; stroke-linecap: round; }
          .chart-dot { fill: ${CSS_VAR.coral}; }
          .chart-adjusted { stroke: ${CSS_VAR.teal}; stroke-width: 1.5; fill: none; opacity: 0.55; }
          .chart-rolling { stroke: ${CSS_VAR.teal}; stroke-width: 2; fill: none; stroke-dasharray: 5 3; opacity: 0.8; }
          .chart-grid { stroke: ${CSS_VAR.ink}; stroke-width: 0.5; opacity: 0.08; }
          .chart-axis { stroke: ${CSS_VAR.ink}; stroke-width: 0.5; opacity: 0.3; }
        `}</style>

        {/* Background */}
        <rect x={0} y={0} width={W} height={H} fill={CSS_VAR.paper} />

        {/* Zero line */}
        <line
          x1={PADDING.left}
          y1={midY}
          x2={W - PADDING.right}
          y2={midY}
          className="chart-axis"
          strokeDasharray="4 3"
        />

        {/* Y-axis ticks + labels */}
        {yTicksSet.map((tick) => {
          const y = PADDING.top + yScale(tick);
          return (
            <g key={tick}>
              <line
                x1={PADDING.left}
                y1={y}
                x2={W - PADDING.right}
                y2={y}
                className="chart-grid"
              />
              <text
                x={PADDING.left - 8}
                y={y + LABEL_SIZE / 2 + 1}
                textAnchor="end"
                fontSize={LABEL_SIZE}
                className="chart-axis-label"
                opacity={0.6}
              >
                {tick >= 0 ? `+${tick}` : tick}
              </text>
            </g>
          );
        })}

        {/* Adjusted line (teal, thinner) */}
        {adjustedPath && (
          <path d={adjustedPath} className="chart-adjusted" />
        )}

        {/* Rolling average (teal dashed) */}
        {rollingPath && (
          <path d={rollingPath} className="chart-rolling" />
        )}

        {/* Daily line (coral) */}
        <path d={dailyPath} className="chart-line" />

        {/* Data dots */}
        {loggedDays.map((d, i) => {
          const x = PADDING.left + xScale(i);
          const y = PADDING.top + yScale(d.kcalUnderOver);
          return (
            <g key={d.day_key}>
              <circle
                cx={x}
                cy={y}
                r={3}
                className="chart-dot"
              />
              <title>{`${d.day_key}: ${d.kcalUnderOver >= 0 ? '+' : ''}${d.kcalUnderOver} kcal`}</title>
            </g>
          );
        })}

        {/* X-axis ticks */}
        {xTicks.map(({ i, d }) => {
          const x = PADDING.left + xScale(i);
          return (
            <g key={d.day_key}>
              <line
                x1={x}
                y1={H - PADDING.bottom}
                x2={x}
                y2={H - PADDING.bottom + 5}
                className="chart-axis"
              />
              <text
                x={x}
                y={H - PADDING.bottom + LABEL_SIZE + 8}
                textAnchor="middle"
                fontSize={LABEL_SIZE}
                className="chart-axis-label"
                opacity={0.7}
              >
                {formatDateKeyShort(d.day_key)}
              </text>
            </g>
          );
        })}

        {/* Y-axis label */}
        <text
          x={14}
          y={H / 2}
          textAnchor="middle"
          fontSize={LABEL_SIZE}
          className="chart-axis-label"
          opacity={0.4}
          transform={`rotate(-90 14 ${H / 2})`}
        >
          kcal vs budget
        </text>
      </svg>

      {/* Legend */}
      <div className="flex items-center gap-4 flex-wrap mt-3 px-1">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-5 h-0.5 bg-coral" />
          <span className="font-body text-caption text-ink/70 uppercase tracking-widest">
            Eaten vs budget
          </span>
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block w-5 h-0.5"
            style={{ borderTop: `2px dashed ${CSS_VAR.teal}` }}
          />
          <span className="font-body text-caption text-ink/70 uppercase tracking-widest">
            7-day avg
          </span>
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block w-5 h-0.5"
            style={{ borderTop: `1px dashed ${CSS_VAR.ink}`, opacity: 0.4 }}
          />
          <span className="font-body text-caption text-ink/70 uppercase tracking-widest">
            + workout burn
          </span>
        </span>
      </div>
    </div>
  );
}
