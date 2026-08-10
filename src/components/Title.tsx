import React from 'react';

interface TitleProps {
  children: React.ReactNode;
  tone?: 'light' | 'dark';
  className?: string;
  align?: 'left' | 'center' | 'right';
}

// Big page-level headline. Fraunces 400, display-2 (clamp 2.75–5rem).
// `tone="dark"` swaps the colour for use on ink sections.
export default function Title({ children, tone = 'light', className = '', align = 'left' }: TitleProps) {
  const toneClass = tone === 'dark' ? 'text-paper' : 'text-ink';
  const alignClass = align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left';
  return (
    <h1
      className={`font-display ${toneClass} ${alignClass} leading-[0.95] text-display-2 ${className}`}
      style={{ letterSpacing: '-0.02em' }}
    >
      {children}
    </h1>
  );
}
