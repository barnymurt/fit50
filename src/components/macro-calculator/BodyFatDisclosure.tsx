'use client';

import { useState } from 'react';
import Icon from '../Icon';

interface BodyFatDisclosureProps {
  open: boolean;
  onToggle: () => void;
  label: string;
  children: React.ReactNode;
  help?: string;
  error?: string;
}

export default function BodyFatDisclosure({
  open,
  onToggle,
  label,
  children,
  help,
  error,
}: BodyFatDisclosureProps) {
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex items-center gap-3 text-ink/70 hover:text-ink transition-colors"
      >
        <span
          className={`flex-shrink-0 w-8 h-8 border border-ink/30 flex items-center justify-center transition-transform duration-300 ease-smooth ${
            open ? 'rotate-45' : ''
          }`}
          aria-hidden="true"
        >
          <Icon name="arrow-right" size={16} />
        </span>
        <span className="font-body text-caption uppercase tracking-widest">{label}</span>
      </button>
      <div
        className={`grid transition-all duration-300 ease-smooth ${
          open ? 'grid-rows-[1fr] mt-4' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">
          {children}
        </div>
      </div>
      {open && (error || help) && (
        <p
          className={`font-body text-sm mt-2 ${
            error ? 'text-coral' : 'text-ink/50'
          }`}
        >
          {error || help}
        </p>
      )}
    </div>
  );
}
