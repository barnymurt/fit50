'use client';

import React from 'react';
import Chip from './Chip';

interface ChipGroupProps<T extends string> {
  label: string;
  help?: string;
  options: { value: T; label: string; subLabel?: string }[];
  value: T | null;
  onChange: (v: T) => void;
  layout?: 'inline' | 'wrap';
  size?: 'default' | 'small';
}

export default function ChipGroup<T extends string>({
  label,
  help,
  options,
  value,
  onChange,
  layout = 'inline',
  size = 'default',
}: ChipGroupProps<T>) {
  const sizeClass = size === 'small' ? 'text-xs px-3 py-2' : '';
  return (
    <fieldset>
      <legend className="font-body text-caption uppercase tracking-widest text-ink/50 mb-3">
        {label}
      </legend>
      <div
        role="radiogroup"
        aria-label={label}
        className={`flex gap-2 ${
          layout === 'wrap'
            ? 'flex-wrap'
            : 'flex-col sm:flex-row'
        }`}
      >
        {options.map((opt) => (
          <div key={opt.value} className={layout === 'inline' ? 'flex-1' : ''}>
            <Chip
              selected={value === opt.value}
              onClick={() => onChange(opt.value)}
              label={opt.label}
              subLabel={opt.subLabel}
            />
          </div>
        ))}
      </div>
      {help && (
        <p className="font-body text-sm text-ink/50 mt-2">{help}</p>
      )}
    </fieldset>
  );
}
