'use client';

import React from 'react';

interface ChipProps {
  selected: boolean;
  onClick: () => void;
  label: string;
  subLabel?: string;
  ariaLabel?: string;
}

export default function Chip({ selected, onClick, label, subLabel, ariaLabel }: ChipProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={ariaLabel ?? label}
      onClick={onClick}
      className={`px-4 py-3 border text-sm font-body font-medium uppercase tracking-wider transition-colors duration-200 ease-smooth ${
        selected
          ? 'bg-ink text-paper border-ink'
          : 'bg-transparent text-ink/70 border-ink/20 hover:border-ink hover:bg-ink/5'
      }`}
    >
      <span className="block">{label}</span>
      {subLabel && (
        <span
          className={`block text-[10px] font-normal normal-case tracking-normal mt-0.5 ${
            selected ? 'text-paper/70' : 'text-ink/50'
          }`}
        >
          {subLabel}
        </span>
      )}
    </button>
  );
}
