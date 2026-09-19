'use client';

import type { AnalyticsRange } from '@/hooks/useFoodAnalytics';

const OPTIONS: { value: AnalyticsRange; label: string }[] = [
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: 'all', label: 'All' },
];

interface RangePickerProps {
  value: AnalyticsRange;
  onChange: (r: AnalyticsRange) => void;
}

export default function RangePicker({ value, onChange }: RangePickerProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <p className="font-body text-caption uppercase tracking-widest text-ink/50 mr-1">
        Period
      </p>
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
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
    </div>
  );
}
