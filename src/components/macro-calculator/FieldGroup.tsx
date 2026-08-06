'use client';

import React from 'react';

interface FieldGroupProps {
  label: string;
  help?: string;
  error?: string;
  children: React.ReactNode;
}

export default function FieldGroup({ label, help, error, children }: FieldGroupProps) {
  return (
    <div>
      <label className="block font-body text-caption uppercase tracking-widest text-ink/50 mb-3">
        {label}
      </label>
      {children}
      {error && (
        <p role="alert" className="font-body text-sm text-coral mt-2">
          {error}
        </p>
      )}
      {!error && help && (
        <p className="font-body text-sm text-ink/50 mt-2">{help}</p>
      )}
    </div>
  );
}
