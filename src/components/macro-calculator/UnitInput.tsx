'use client';

import React from 'react';
import Chip from './Chip';

type Unit = 'cm' | 'ftin' | 'kg' | 'lbs';

interface UnitInputProps {
  label: string;
  value: number | null;
  unit: Unit;
  unitOptions: { value: Unit; label: string }[];
  onChange: (v: number | null) => void;
  onUnitChange: (u: Unit) => void;
  range: { min: number; max: number; step?: number };
  help?: string;
  error?: string;
  // For ftin: two sub-inputs
  feet?: number | null;
  inches?: number | null;
  onFeetChange?: (v: number | null) => void;
  onInchesChange?: (v: number | null) => void;
}

export default function UnitInput({
  label,
  value,
  unit,
  unitOptions,
  onChange,
  onUnitChange,
  range,
  help,
  error,
  feet,
  inches,
  onFeetChange,
  onInchesChange,
}: UnitInputProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <label className="font-body text-caption uppercase tracking-widest text-ink/50">
          {label}
        </label>
        <div role="tablist" aria-label={`${label} unit`} className="flex gap-1">
          {unitOptions.map((u) => (
            <Chip
              key={u.value}
              selected={unit === u.value}
              onClick={() => onUnitChange(u.value)}
              label={u.label}
            />
          ))}
        </div>
      </div>
      {unit === 'ftin' ? (
        <div className="flex gap-3">
          <input
            type="number"
            value={feet ?? ''}
            onChange={(e) => onFeetChange?.(e.target.value ? Number(e.target.value) : null)}
            placeholder="ft"
            min={3}
            max={7}
            className="flex-1 px-4 py-3 bg-cream/30 border-2 border-ink/20 text-ink font-body focus:border-ink outline-none rounded-none"
            aria-label="feet"
          />
          <input
            type="number"
            value={inches ?? ''}
            onChange={(e) => onInchesChange?.(e.target.value ? Number(e.target.value) : null)}
            placeholder="in"
            min={0}
            max={11}
            className="flex-1 px-4 py-3 bg-cream/30 border-2 border-ink/20 text-ink font-body focus:border-ink outline-none rounded-none"
            aria-label="inches"
          />
        </div>
      ) : (
        <input
          type="number"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
          placeholder={`e.g. ${unit === 'cm' ? '178' : '80'}`}
          min={range.min}
          max={range.max}
          step={range.step ?? (unit === 'cm' ? 1 : 0.1)}
          className="w-full px-4 py-3 bg-cream/30 border-2 border-ink/20 text-ink font-body focus:border-ink outline-none rounded-none"
        />
      )}
      {error ? (
        <p role="alert" className="font-body text-sm text-coral mt-2">{error}</p>
      ) : help ? (
        <p className="font-body text-sm text-ink/50 mt-2">{help}</p>
      ) : null}
    </div>
  );
}
