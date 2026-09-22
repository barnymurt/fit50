'use client';

import type { AnalyticsDay } from '@/hooks/useFoodAnalytics';
import { formatDateKeyShort } from '@/lib/dates';

interface DailyBalanceChartProps {
  days: AnalyticsDay[];
  loaded: boolean;
}

const MAX_BAR_PX = 200;
const ROW_HEIGHT = 36;

function formatKcal(v: number): string {
  const abs = Math.abs(Math.round(v));
  if (abs >= 1000) return `${(abs / 1000).toFixed(1)}k`;
  return `${abs}`;
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
          <div key={i} className="h-9 bg-ink/5 animate-pulse rounded-none" />
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

  function barWidth(kcal: number): number {
    return Math.min((Math.abs(kcal) / maxAbs) * MAX_BAR_PX, MAX_BAR_PX);
  }

  return (
    <div className="space-y-1">
      {/* Header row */}
      <div className="flex items-center mb-2">
        <div className="w-10 shrink-0" />
        <div
          className="flex-1 flex"
          style={{ maxWidth: MAX_BAR_PX, margin: '0 auto' }}
        >
          <span className="font-body text-[10px] uppercase tracking-widest text-ink/40">
            Under
          </span>
          <div className="flex-1 text-center">
            <span className="font-body text-[10px] uppercase tracking-widest text-ink font-semibold">
              0
            </span>
          </div>
          <span className="font-body text-[10px] uppercase tracking-widest text-ink/40">
            Over
          </span>
        </div>
        <div className="w-16 shrink-0 text-right" />
      </div>

      {/* Day rows — most recent at top */}
      {[...loggedDays].reverse().map((day) => {
        const under = day.kcalUnderOver >= 0;
        const w = barWidth(day.kcalUnderOver);
        const displayValue = Math.round(day.kcalUnderOver);
        const dayLabel = day.dayNumber != null ? `Day ${day.dayNumber}` : formatDateKeyShort(day.day_key);

        return (
          <div
            key={day.day_key}
            className="flex items-center"
            style={{ height: `${ROW_HEIGHT}px` }}
            title={`${day.day_key}: ${displayValue >= 0 ? '+' : ''}${displayValue} kcal`}
          >
            {/* Date / day number label */}
            <div className="w-10 shrink-0 pr-2">
              <span className="font-body text-caption text-ink/50 tabular-nums truncate block">
                {dayLabel}
              </span>
            </div>

            {/* Bar area */}
            <div
              className="flex-1 flex items-center"
              style={{ maxWidth: MAX_BAR_PX, margin: '0 auto' }}
            >
              {/* Under-budget bar (extends left from center) */}
              {under && w > 0 && (
                <div
                  className="h-2 bg-teal/60 shrink-0"
                  style={{ width: `${w}px` }}
                />
              )}
              {/* Center zero line */}
              <div className="w-px h-4 bg-ink/30 shrink-0 mx-auto" />
              {/* Over-budget bar (extends right from center) */}
              {!under && w > 0 && (
                <div
                  className="h-2 bg-coral/60 shrink-0"
                  style={{ width: `${w}px` }}
                />
              )}
            </div>

            {/* Numeric value */}
            <div className="w-16 shrink-0 text-right pl-2">
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
          <span className="inline-block w-4 h-2 bg-teal/60" />
          <span className="font-body text-caption text-ink/50 uppercase tracking-widest">
            Under budget
          </span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-4 h-2 bg-coral/60" />
          <span className="font-body text-caption text-ink/50 uppercase tracking-widest">
            Over budget
          </span>
        </span>
      </div>
    </div>
  );
}
