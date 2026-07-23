'use client';

import React from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';
type Tone = 'light' | 'dark';

interface ButtonProps {
  children: React.ReactNode;
  variant?: Variant;
  tone?: Tone;
  onClick?: () => void;
  href?: string;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
}

const variantStyles: Record<Tone, Record<Variant, string>> = {
  light: {
    primary: 'bg-ink text-paper hover:bg-ink/85',
    secondary: 'border border-ink/30 text-ink hover:border-ink hover:bg-ink/5',
    ghost: 'text-ink hover:text-coral',
  },
  dark: {
    primary: 'bg-paper text-ink hover:bg-paper/85',
    secondary: 'border border-paper/30 text-paper hover:border-paper hover:bg-paper/10',
    ghost: 'text-paper hover:text-coral',
  },
};

const baseStyles =
  'inline-flex items-center justify-center gap-2 px-7 py-3.5 text-sm font-body font-medium tracking-wider uppercase rounded-full transition-all duration-200 ease-smooth disabled:opacity-40 disabled:cursor-not-allowed';

export default function Button({
  children,
  variant = 'primary',
  tone = 'light',
  onClick,
  href,
  type = 'button',
  disabled = false,
  className = '',
  ariaLabel,
}: ButtonProps) {
  const classes = `${baseStyles} ${variantStyles[tone][variant]} ${className}`;

  if (href) {
    return (
      <a href={href} className={classes} aria-label={ariaLabel}>
        {children}
      </a>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={classes}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
}
