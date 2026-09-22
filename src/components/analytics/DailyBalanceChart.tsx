'use client';

import type { AnalyticsDay } from '@/hooks/useFoodAnalytics';

interface DailyBalanceChartProps {
  days: AnalyticsDay[];
  loaded: boolean;
}

const BAR_AREA_PX = 280;
const ROW_HEIGHT = 32;
const LABEL_COL = 80;
const VALUE_COL = 56;

function formatKcal(v: number): string {
  const abs = Math.abs(Math.round(v));
  if (abs >= 1000) return `${(abs / 1000).toFixed(1)}k`;
  return `${abs}`;
}

function formatDay(day: AnalyticsDay): string {
  if (day.dayNumber != null) return `Day ${day.dayNumber}`;
  const [y, m, d] = day.day_key.split('-').map(Number);
  if (!y || !m || !d) return day.day_key;
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

export default function DailyBalanceChart({
  days,
  loaded,
}: DailyBalanceChartProps) {
  const loggedDays = days.filter((d) => d.hadLoggedFood);

  if (loggedDays.length === 0 && !loaded) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-8 bg-ink/5 animate-pulse" />
        ))}
      </div>
    );
  }

  if (loggedDays.length === 0) {
    return (
      <div className="h-32 flex items-center justify-center border border-dashed border-ink/20">
        <p className="font-body text-ink/50 text-sm text-center px-8">
          No food logged yet. Log meals to see your daily balance here.
        </p>
      </div>
    );
  }

  // Clamp extreme values for bar scaling; show the actual number in label regardless
  const maxAbs = Math.min(
    Math.max(...loggedDays.map((d) => Math.abs(d.kcalUnderOver)), 500),
    2000
  );
  const halfWidth = BAR_AREA_PX / 2;
  function halfBarWidth(kcal: number): number {
    return Math.min((Math.abs(kcal) / maxAbs) * halfWidth, halfWidth);
  }

  return (
    <div className="space-y-1">
      {/* Header row */}
      <div
        className="flex items-center mb-2 text-ink/40"
        style={{ height: '20px' }}
      >
        <div style={{ width: `${LABEL_COL}px` }} className="shrink-0" />
        <div
          className="flex items-center"
          style={{ width: `${BAR_AREA_PX}px` }}
        >
          <span className="flex-1 text-right pr-2 font-body text-[10px] uppercase tracking-widest">
            Under
          </span>
          <div className="w-px h-3 bg-ink/30 mx-1" />
          <span className="flex-1 pl-2 font-body text-[10px] uppercase tracking-widest">
            Over
          </span>
        </div>
        <div style={{ width: `${VALUE_COL}px` }} className="shrink-0 text-right" />
      </div>

      {/* Day rows — most recent at top */}
      {[...loggedDays].reverse().map((day) => {
        const under = day.kcalUnderOver >= 0;
        const w = halfBarWidth(day.kcalUnderOver);
        const displayValue = Math.round(day.kcalUnderOver);

        return (
          <div
            key={day.day_key}
            className="flex items-center"
            style={{ height: `${ROW_HEIGHT}px` }}
            title={`${day.day_key}: ${displayValue >= 0 ? '+' : ''}${displayValue} kcal`}
          >
            {/* Date / day number label — full label, no truncation */}
            <div
              style={{ width: `${LABEL_COL}px` }}
              className="shrink-0 pr-2 text-right"
            >
              <span className="font-body text-caption text-ink/60 tabular-nums">
                {formatDay(day)}
              </span>
            </div>

            {/* Bar area — fixed width, true center line */}
            <div
              className="relative flex items-center"
              style={{ width: `${BAR_AREA_PX}px` }}
            >
              {/* Left half (under-budget) */}
              <div
                className="flex items-center justify-end"
                style={{ width: `${halfWidth}px`, height: '100%' }}
              >
                {under && w > 0 && (
                  <div
                    className="h-2 bg-teal/70"
                    style={{ width: `${w}px` }}
                  />
                )}
              </div>
              {/* Center zero line */}
              <div className="w-px h-4 bg-ink/40 shrink-0" />
              {/* Right half (over-budget) */}
              <div
                className="flex items-center"
                style={{ width: `${halfWidth}px`, height: '100%' }}
              >
                {!under && w > 0 && (
                  <div
                    className="h-2 bg-coral/70"
                    style={{ width: `${w}px` }}
                  />
                )}
              </div>
            </div>

            {/* Numeric value */}
            <div
              style={{ width: `${VALUE_COL}px` }}
              className="shrink-0 text-right pl-2"
            >
              <span
                className={`font-body text-caption tabular-nums ${
                  under ? 'text-teal' : 'text-coral'
                }`}
              >
                {displayValue >= 0 ? '+' : ''}{formatKcal(displayValue)}
              </span>
            </div>
          </div>
        );
      })}

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-ink/10">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-4 h-2 bg-teal/70" />
          <span className="font-body text-caption text-ink/50 uppercase tracking-widest">
            Under budget
          </span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-4 h-2 bg-coral/70" />
          <span className="font-body text-caption text-ink/50 uppercase tracking-widest">
            Over budget
          </span>
        </span>
      </div>
    </div>
  );
}
