'use client';

import type { AnalyticsDay } from '@/hooks/useFoodAnalytics';

interface DeficitStreakCalendarProps {
  days: AnalyticsDay[];
  loaded: boolean;
}

const CELL_SIZE = 20;
const CELL_GAP = 3;

function getColor(day: AnalyticsDay): string {
  if (!day.hadLoggedFood) return 'bg-ink/10';
  if (day.kcalUnderOver > 0) return 'bg-teal';
  if (day.kcalUnderOver < -0) return 'bg-coral';
  return 'bg-cream';
}

export default function DeficitStreakCalendar({
  days,
  loaded,
}: DeficitStreakCalendarProps) {
  if (!loaded && days.length === 0) {
    return (
      <div className="grid grid-cols-10 gap-1.5">
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={i}
            className="w-5 h-5 bg-ink/10 animate-pulse"
          />
        ))}
      </div>
    );
  }

  const maxDisplay = Math.max(days.length, 50);
  const cols = 10;
  const rows = Math.ceil(maxDisplay / cols);

  return (
    <div className="space-y-2">
      <div
        className="grid gap-1.5"
        style={{
          gridTemplateColumns: `repeat(${cols}, ${CELL_SIZE}px)`,
        }}
      >
        {Array.from({ length: rows * cols }).map((_, idx) => {
          const day = days[idx];
          if (!day) {
            return (
              <div
                key={`empty-${idx}`}
                className="w-5 h-5"
              />
            );
          }
          return (
            <div
              key={day.day_key}
              className="w-5 h-5 transition-colors"
              style={{ backgroundColor: getColor(day) }}
              title={`${day.day_key}${day.hadLoggedFood ? '' : ' — no log'}: ${day.kcalUnderOver >= 0 ? '+' : ''}${day.kcalUnderOver} kcal`}
            />
          );
        })}
      </div>
      <div className="flex gap-4 flex-wrap">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 bg-teal" />
          <span className="font-body text-caption text-ink/50 uppercase tracking-widest">
            Under
          </span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 bg-coral" />
          <span className="font-body text-caption text-ink/50 uppercase tracking-widest">
            Over
          </span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 bg-cream" />
          <span className="font-body text-caption text-ink/50 uppercase tracking-widest">
            On target
          </span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 bg-ink/10" />
          <span className="font-body text-caption text-ink/50 uppercase tracking-widest">
            No log
          </span>
        </span>
      </div>
    </div>
  );
}
