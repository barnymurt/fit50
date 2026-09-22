'use client';

import { useState } from 'react';
import type { AnalyticsRange } from '@/hooks/useFoodAnalytics';

const PRESETS: { value: AnalyticsRange; label: string }[] = [
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: 'all', label: 'All' },
];

interface RangePickerProps {
  value: AnalyticsRange;
  onChange: (r: AnalyticsRange) => void;
}

function toDateInputValue(key: string) {
  // key format: YYYY-MM-DD
  return key;
}

function fromDateInput(value: string): string {
  // Returns YYYY-MM-DD
  return value;
}

export default function RangePicker({ value, onChange }: RangePickerProps) {
  const isCustom = (v: AnalyticsRange): v is { custom: { start: string; end: string } } =>
    v !== null && typeof v === 'object' && 'custom' in v;

  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  function applyCustom() {
    if (!customStart || !customEnd) return;
    if (customStart > customEnd) return;
    onChange({ custom: { start: customStart, end: customEnd } });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <p className="font-body text-caption uppercase tracking-widest text-ink/50 mr-1">
          Period
        </p>
        {PRESETS.map((opt) => (
          <button
            key={opt.label}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`px-4 py-2 font-body text-caption uppercase tracking-widest border transition-colors ${
              value === opt.value
                ? 'bg-ink text-paper border-ink'
                : 'bg-paper text-ink/60 border-ink/20 hover:border-ink/50'
            }`}
          >
            {opt.label}
          </button>
        ))}
        {/* Custom range toggle */}
        <button
          type="button"
          onClick={() => {
            if (!isCustom(value)) {
              // Pre-fill with last 30 days
              const now = new Date();
              const d = new Date(now);
              d.setDate(d.getDate() - 29);
              const fmt = (date: Date) =>
                `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
              setCustomEnd(fmt(now));
              setCustomStart(fmt(d));
            }
          }}
          className={`px-4 py-2 font-body text-caption uppercase tracking-widest border transition-colors ${
            isCustom(value)
              ? 'bg-ink text-paper border-ink'
              : 'bg-paper text-ink/60 border-ink/20 hover:border-ink/50'
          }`}
        >
          Custom
        </button>
      </div>

      {/* Custom date range inputs */}
      {isCustom(value) && (
        <div className="flex items-end gap-3 flex-wrap">
          <div>
            <label className="block font-body text-caption uppercase tracking-widest text-ink/50 mb-1">
              From
            </label>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              max={customEnd || undefined}
              className="border border-ink/20 bg-paper px-3 py-2 font-body text-body text-ink focus:border-ink/60 outline-none"
            />
          </div>
          <div>
            <label className="block font-body text-caption uppercase tracking-widest text-ink/50 mb-1">
              To
            </label>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              min={customStart || undefined}
              max={toDateInputValue(new Date().toISOString().split('T')[0])}
              className="border border-ink/20 bg-paper px-3 py-2 font-body text-body text-ink focus:border-ink/60 outline-none"
            />
          </div>
          <button
            type="button"
            onClick={applyCustom}
            disabled={!customStart || !customEnd || customStart > customEnd}
            className="px-4 py-2 bg-coral text-paper font-body text-caption uppercase tracking-widest disabled:opacity-40 hover:opacity-90 transition-opacity"
          >
            Apply
          </button>
          {isCustom(value) && (
            <button
              type="button"
              onClick={() => onChange('30d')}
              className="px-4 py-2 font-body text-caption uppercase tracking-widest text-ink/50 hover:text-ink transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  );
}
