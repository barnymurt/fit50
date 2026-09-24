'use client';

import { useEffect, useMemo, useState } from 'react';
import { type WeightProjectionPoint, type WeightReading } from '@/hooks/useFoodAnalytics';
import { dateKeyLocal } from '@/lib/dates';
import { apiFetch } from '@/lib/api-fetch';

function todayKey(): string {
  return dateKeyLocal(new Date());
}

interface WeightProgressCardProps {
  /** All readings the hook returned (range-filtered + baseline). */
  readings: WeightReading[];
  /** Per-day projection points from the hook. */
  projection: WeightProjectionPoint[];
  /** Whichever the hook resolved as the starting weight, in kg. */
  baseline: number | null;
  /** True once the hook has finished loading data. */
  loaded: boolean;
  /** Chip / tag the parent uses to give this card its tone. */
  tone?: 'paper' | 'teal' | 'lavender' | 'ink';
}

const STORAGE_KEY = 'fit50-weight-unit';

export default function WeightProgressCard({
  readings,
  projection,
  baseline,
  loaded,
  // tone is purely a design-handoff prop; the parent (AnalyticsScreen)
  // owns the Section wrapper, so we don't apply a background here.
  tone: _tone = 'paper',
}: WeightProgressCardProps) {
  const [unit, setUnit] = useState<'kg' | 'lb'>(() => {
    if (typeof window === 'undefined') return 'kg';
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === 'lb' ? 'lb' : 'kg';
  });
  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, unit);
  }, [unit]);

  const [addKey, setAddKey] = useState<string>(todayKey());
  const [addValue, setAddValue] = useState<string>('');
  const [addBusy, setAddBusy] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [optimisticReadings, setOptimisticReadings] = useState<WeightReading[]>(
    []
  );

  // The hook's `readings` updates when the query refetches; optimistic
  // state layers immediate user edits on top so the chart updates
  // without a round-trip. Both lists are merged with optimistic
  // winning.
  const mergedReadings = useMemo(() => {
    const byDay = new Map<string, WeightReading>();
    for (const r of readings) byDay.set(r.day_key, r);
    for (const r of optimisticReadings) byDay.set(r.day_key, r);
    return [...byDay.values()].sort((a, b) => a.day_key.localeCompare(b.day_key));
  }, [readings, optimisticReadings]);

  const sortedReadings = mergedReadings;
  const hasAny = sortedReadings.length > 0;

  // For the "current" tile we want the most recent reading. For the
  // "expected" tile we use the latest projected value. For "diff"
  // the difference between them.
  const latestReading = sortedReadings[sortedReadings.length - 1] ?? null;
  const latestProjection = [...projection]
    .reverse()
    .find((p) => p.projectedSmoothed != null);
  const expectedNow = latestProjection?.projectedSmoothed ?? null;
  const baselineForStart =
    baseline != null
      ? baseline
      : sortedReadings[0]?.weight_kg ?? null;
  const startKg = baselineForStart;
  const currentKg = latestReading?.weight_kg ?? null;
  const diffVsExpected =
    currentKg != null && expectedNow != null ? currentKg - expectedNow : null;

  const handleAdd = async () => {
    if (addBusy) return;
    setAddError(null);
    const num = Number(addValue);
    if (!Number.isFinite(num) || num <= 0 || num >= 500) {
      setAddError('Enter a weight between 1 and 500.');
      return;
    }
    const kg = unit === 'kg' ? num : Math.round(num * 0.453592 * 100) / 100;
    setAddBusy(true);
    try {
      const res = await apiFetch('/api/weight', {
        method: 'POST',
        body: { day_key: addKey, weight_kg: kg, notes: null },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `HTTP ${res.status}`);
      }
      // Optimistic — drop the row in immediately so the chart
      // updates before the parent re-fetches.
      setOptimisticReadings((prev) => [
        ...prev.filter((r) => r.day_key !== addKey),
        { day_key: addKey, weight_kg: kg, notes: null },
      ]);
      setAddValue('');
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Could not save.');
    } finally {
      setAddBusy(false);
    }
  };

  const handleDelete = async (day_key: string) => {
    if (addBusy) return;
    setAddError(null);
    setAddBusy(true);
    try {
      const res = await apiFetch(
        `/api/weight/delete?day_key=${encodeURIComponent(day_key)}`,
        { method: 'DELETE' }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `HTTP ${res.status}`);
      }
      setOptimisticReadings((prev) => prev.filter((r) => r.day_key !== day_key));
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Could not delete.');
    } finally {
      setAddBusy(false);
    }
  };

  if (!loaded) {
    return (
      <div className="space-y-3">
        <div className="h-4 w-40 bg-ink/10 animate-pulse" />
        <div className="h-48 bg-ink/5 animate-pulse" />
      </div>
    );
  }

  if (!hasAny) {
    return (
      <div className="space-y-4">
        <div className="border border-dashed border-ink/20 p-5 text-center">
          <p className="font-body text-base text-ink/70">
            Log your first weight to see how you're tracking.
          </p>
          <p className="font-body text-sm text-ink/40 mt-2 max-w-md mx-auto leading-relaxed">
            We'll compare your actual weight to a projection based on your calorie
            intake and workout burn. One reading is enough to start; weigh in weekly
            for the most accurate picture.
          </p>
        </div>
        <QuickAddForm
          unit={unit}
          setUnit={setUnit}
          dayKey={addKey}
          setDayKey={setAddKey}
          value={addValue}
          setValue={setAddValue}
          onSubmit={handleAdd}
          busy={addBusy}
          error={addError}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Summary tiles */}
      <div className="grid grid-cols-3 gap-3">
        <Tile
          label="Start"
          value={startKg != null ? formatWeight(startKg, unit) : '—'}
          sub={startKg != null ? '' : 'Set a baseline'}
        />
        <Tile
          label="Current"
          value={currentKg != null ? formatWeight(currentKg, unit) : '—'}
          sub={currentKg != null ? dayLabel(latestReading!.day_key) : ''}
        />
        <Tile
          label="Expected now"
          value={expectedNow != null ? formatWeight(expectedNow, unit) : '—'}
          sub={
            diffVsExpected != null
              ? diffVsExpected > 0
                ? `${formatWeight(Math.abs(diffVsExpected), unit)} above`
                : diffVsExpected < 0
                  ? `${formatWeight(Math.abs(diffVsExpected), unit)} below`
                  : 'On track'
              : 'Based on your intake'
          }
          accent={
            diffVsExpected != null
              ? Math.abs(diffVsExpected) < 0.5
                ? 'teal'
                : Math.abs(diffVsExpected) < 2
                  ? 'paper'
                  : 'coral'
              : undefined
          }
        />
      </div>

      {/* Chart */}
      <WeightChart readings={sortedReadings} projection={projection} />

      {/* Quick add */}
      <div className="border-t border-ink/10 pt-4 space-y-3">
        <p className="font-body text-caption uppercase tracking-widest text-ink/60">
          Log a weight
        </p>
        <QuickAddForm
          unit={unit}
          setUnit={setUnit}
          dayKey={addKey}
          setDayKey={setAddKey}
          value={addValue}
          setValue={setAddValue}
          onSubmit={handleAdd}
          busy={addBusy}
          error={addError}
          compact
        />
      </div>

      {/* Recent readings list — only the last 5, with a delete control.
          Mobile-friendly max-height + scroll so the card doesn't grow
          indefinitely. */}
      <div className="border-t border-ink/10 pt-4">
        <p className="font-body text-caption uppercase tracking-widest text-ink/60 mb-2">
          Recent readings
        </p>
        <ul className="divide-y divide-ink/10">
          {[...sortedReadings]
            .reverse()
            .slice(0, 5)
            .map((r) => (
              <li
                key={r.day_key}
                className="py-2 flex items-center justify-between gap-3"
              >
                <span className="font-body text-sm text-ink/70">
                  {formatDayLabel(r.day_key)}
                </span>
                <span className="flex items-center gap-3">
                  <span className="font-display tabular-nums text-ink">
                    {formatWeight(r.weight_kg, unit)}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDelete(r.day_key)}
                    disabled={addBusy}
                    aria-label={`Delete reading from ${formatDayLabel(r.day_key)}`}
                    className="font-body text-caption uppercase text-ink/40 hover:text-coral px-2 py-1 transition-colors disabled:opacity-50"
                  >
                    ✕
                  </button>
                </span>
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Subcomponents
// ----------------------------------------------------------------------------

function Tile({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub: string;
  accent?: 'teal' | 'coral' | 'paper';
}) {
  const accentClass =
    accent === 'teal'
      ? 'border-teal/40 bg-teal/5'
      : accent === 'coral'
        ? 'border-coral/40 bg-coral/5'
        : 'border-ink/15 bg-ink/[0.03]';
  return (
    <div className={`px-4 py-4 border ${accentClass}`}>
      <p className="font-body text-caption uppercase tracking-widest text-ink/50 mb-1">
        {label}
      </p>
      <p className="font-display text-h2 text-ink tabular-nums leading-none">
        {value}
      </p>
      {sub && (
        <p className="font-body text-caption text-ink/40 mt-0.5 truncate">
          {sub}
        </p>
      )}
    </div>
  );
}

// Compact form shared by both the empty state CTA and the always-on
// "Log a weight" input. Stacks on mobile, inline on tablet+.
function QuickAddForm({
  unit,
  setUnit,
  dayKey,
  setDayKey,
  value,
  setValue,
  onSubmit,
  busy,
  error,
  compact,
}: {
  unit: 'kg' | 'lb';
  setUnit: (u: 'kg' | 'lb') => void;
  dayKey: string;
  setDayKey: (s: string) => void;
  value: string;
  setValue: (s: string) => void;
  onSubmit: () => void;
  busy: boolean;
  error: string | null;
  compact?: boolean;
}) {
  return (
    <div
      className={`flex ${compact ? 'flex-col sm:flex-row sm:items-end' : 'flex-col'} gap-3`}
    >
      <label className={`block ${compact ? 'flex-1' : ''}`}>
        <span className="font-body text-caption uppercase tracking-widest text-ink/50 mb-1 block">
          Date
        </span>
        <input
          type="date"
          value={dayKey}
          max={dateKeyLocal(new Date())}
          onChange={(e) => setDayKey(e.target.value)}
          className="w-full px-3 py-2 bg-paper text-ink border-2 border-ink/20 font-body focus:border-coral outline-none"
        />
      </label>
      <label className={`block ${compact ? 'flex-1' : ''}`}>
        <span className="font-body text-caption uppercase tracking-widest text-ink/50 mb-1 block">
          Weight
        </span>
        <input
          type="number"
          inputMode="decimal"
          step="0.1"
          min={1}
          max={500}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={unit === 'kg' ? 'e.g. 75.5' : 'e.g. 166.5'}
          className="w-full px-3 py-2 bg-paper text-ink border-2 border-ink/20 font-body focus:border-coral outline-none"
        />
      </label>
      <div className={`flex ${compact ? 'gap-2' : 'flex-col'} ${compact ? 'sm:flex-col sm:gap-2' : ''}`}>
        <div className="flex border-2 border-ink/20 bg-paper">
          <button
            type="button"
            onClick={() => setUnit('kg')}
            aria-pressed={unit === 'kg'}
            className={`px-3 py-2 font-body text-caption uppercase tracking-widest transition-colors ${
              unit === 'kg' ? 'bg-ink text-paper' : 'text-ink/60 hover:text-ink'
            }`}
          >
            kg
          </button>
          <button
            type="button"
            onClick={() => setUnit('lb')}
            aria-pressed={unit === 'lb'}
            className={`px-3 py-2 font-body text-caption uppercase tracking-widest transition-colors ${
              unit === 'lb' ? 'bg-ink text-paper' : 'text-ink/60 hover:text-ink'
            }`}
          >
            lb
          </button>
        </div>
        <button
          type="button"
          onClick={onSubmit}
          disabled={busy || !value.trim()}
          className="px-4 py-2 bg-coral text-paper font-body text-caption uppercase tracking-widest hover:bg-coral/85 transition-colors disabled:opacity-50"
        >
          {busy ? 'Saving…' : 'Save'}
        </button>
      </div>
      {error && (
        <p className="font-body text-caption text-coral">{error}</p>
      )}
    </div>
  );
}

// SVG line chart. Two series:
//   - actual: solid coral line, only over days with readings
//   - projected (7-day smoothed): dashed paper line over all days
//
// 1-day fluctuation can be +/- 1 kg just from water/food volume, so
// the actual line is purely informational; the smoothed projection
// is what to compare expectations against.
function WeightChart({
  readings,
  projection,
}: {
  readings: WeightReading[];
  projection: WeightProjectionPoint[];
}) {
  const points = projection.filter((p) => p.projectedSmoothed != null);
  if (points.length === 0) return null;

  // Y range — clamp to a sensible spread around the lowest projected
  // and highest projected + actual values. 4 kg of headroom each side
  // so the lines never touch the chart edge.
  const projectedValues = points
    .map((p) => p.projectedSmoothed as number)
    .filter((v): v is number => v != null);
  const actualValues = readings.map((r) => r.weight_kg);
  const allValues = [...projectedValues, ...actualValues];
  if (allValues.length === 0) return null;
  const minV = Math.min(...allValues) - 2;
  const maxV = Math.max(...allValues) + 2;

  const W = 600;
  const H = 220;
  const padL = 44;
  const padR = 16;
  const padT = 12;
  const padB = 28;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  const xScale = (i: number) =>
    padL + (i / Math.max(points.length - 1, 1)) * innerW;
  const yScale = (v: number) =>
    padT + (1 - (v - minV) / (maxV - minV)) * innerH;

  function buildPath(key: 'projectedSmoothed'): string {
    const segments: string[] = [];
    let penDown = false;
    for (let i = 0; i < points.length; i++) {
      const v = points[i][key] as number | null;
      if (v == null) continue;
      const x = xScale(i);
      const y = yScale(v);
      if (!penDown) {
        segments.push(`M ${x} ${y}`);
        penDown = true;
      } else {
        segments.push(`L ${x} ${y}`);
      }
    }
    return segments.join(' ');
  }

  const projectedPath = buildPath('projectedSmoothed');

  // Y-axis ticks — 4 evenly spaced labels.
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => minV + (maxV - minV) * t);

  return (
    <div className="overflow-x-auto" style={{ minWidth: '280px' }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full block"
        aria-label="Weight progress"
        role="img"
      >
        <rect x={0} y={0} width={W} height={H} fill="transparent" />

        {/* Y grid + labels */}
        {yTicks.map((t) => (
          <g key={t}>
            <line
              x1={padL}
              y1={yScale(t)}
              x2={W - padR}
              y2={yScale(t)}
              stroke="#1A1A1A"
              strokeOpacity={0.08}
              strokeWidth={1}
            />
            <text
              x={padL - 6}
              y={yScale(t) + 3}
              textAnchor="end"
              fontSize={10}
              fill="#1A1A1A"
              fillOpacity={0.5}
              fontFamily="Inter, sans-serif"
            >
              {t.toFixed(1)}
            </text>
          </g>
        ))}

        {/* Projected (dashed) */}
        <path
          d={projectedPath}
          fill="none"
          stroke="#1A1A1A"
          strokeOpacity={0.4}
          strokeWidth={1.5}
          strokeDasharray="4 3"
        />

        {/* Actual readings as coral dots */}
        {readings.map((r) => {
          const idx = points.findIndex((p) => p.day_key === r.day_key);
          if (idx < 0) return null;
          const y = yScale(r.weight_kg);
          const x = xScale(idx);
          return (
            <g key={r.day_key}>
              <circle cx={x} cy={y} r={4} fill="#E88B5A" />
              <line
                x1={x}
                y1={y}
                x2={x}
                y2={y + 6}
                stroke="#E88B5A"
                strokeOpacity={0.4}
                strokeWidth={1}
              />
              <text
                x={x}
                y={y - 8}
                textAnchor="middle"
                fontSize={10}
                fill="#1A1A1A"
                fillOpacity={0.7}
                fontFamily="Inter, sans-serif"
              >
                {r.weight_kg.toFixed(1)}
              </text>
            </g>
          );
        })}

        {/* End-of-period date labels */}
        {points.length > 0 && (
          <>
            <text
              x={padL}
              y={H - 8}
              fontSize={10}
              fill="#1A1A1A"
              fillOpacity={0.5}
              fontFamily="Inter, sans-serif"
            >
              {formatChartDate(points[0].day_key)}
            </text>
            <text
              x={W - padR}
              y={H - 8}
              textAnchor="end"
              fontSize={10}
              fill="#1A1A1A"
              fillOpacity={0.5}
              fontFamily="Inter, sans-serif"
            >
              {formatChartDate(points[points.length - 1].day_key)}
            </text>
          </>
        )}
      </svg>

      <div className="flex items-center gap-4 mt-3 text-caption">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-coral" />
          <span className="font-body text-caption text-ink/60 uppercase tracking-widest">
            Actual
          </span>
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block w-5 h-0.5"
            style={{ borderTop: '1.5px dashed rgba(26,26,26,0.4)' }}
          />
          <span className="font-body text-caption text-ink/60 uppercase tracking-widest">
            Projected (7-day avg)
          </span>
        </span>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Formatting helpers
// ----------------------------------------------------------------------------

function formatWeight(kg: number, unit: 'kg' | 'lb'): string {
  if (unit === 'kg') return `${kg.toFixed(1)} kg`;
  return `${(kg * 2.20462).toFixed(1)} lb`;
}

function dayLabel(dayKey: string): string {
  return formatChartDate(dayKey);
}

function formatDayLabel(dayKey: string): string {
  return formatChartDate(dayKey);
}

function formatChartDate(dayKey: string): string {
  const [y, m, d] = dayKey.split('-').map(Number);
  if (!y || !m || !d) return dayKey;
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
  });
}
