'use client';

import React from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';
type Tone = 'light' | 'dark';
type Shape = 'pill' | 'squared';

interface ButtonProps {
  children: React.ReactNode;
  variant?: Variant;
  tone?: Tone;
  shape?: Shape;
  onClick?: () => void;
  href?: string;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
  fullWidth?: boolean;
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
  'inline-flex items-center justify-center gap-2 text-sm font-body font-medium tracking-wider uppercase transition-all duration-200 ease-smooth disabled:opacity-40 disabled:cursor-not-allowed';

const shapeStyles: Record<Shape, { wrapper: string }> = {
  pill: { wrapper: 'rounded-full px-7 py-3.5' },
  squared: { wrapper: 'rounded-none px-7 py-3.5' },
};

export default function Button({
  children,
  variant = 'primary',
  tone = 'light',
  shape = 'pill',
  onClick,
  href,
  type = 'button',
  disabled = false,
  className = '',
  ariaLabel,
  fullWidth = false,
}: ButtonProps) {
  const widthClass = fullWidth ? 'w-full' : '';
  const classes = `${baseStyles} ${shapeStyles[shape].wrapper} ${variantStyles[tone][variant]} ${widthClass} ${className}`;

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
