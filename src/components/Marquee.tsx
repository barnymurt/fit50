'use client';

import React from 'react';

interface MarqueeProps {
  text: string;
  separator?: string;
  speed?: number;
  tone?: 'light' | 'dark';
  className?: string;
}

export default function Marquee({
  text,
  separator = '•',
  speed = 60,
  tone = 'light',
  className = '',
}: MarqueeProps) {
  const toneClass = tone === 'dark' ? 'text-paper' : 'text-ink';
  const item = `${text} ${separator} `;
  const items = Array.from({ length: 12 }, (_, i) => (
    <span key={i} className="font-marquee text-[clamp(5rem,11vw,9rem)] leading-none uppercase px-6">
      {item}
    </span>
  ));

  return (
    <div className={`overflow-hidden whitespace-nowrap select-none ${toneClass} ${className}`}>
      <div
        className="inline-flex animate-marquee"
        style={{ animationDuration: `${speed}s` }}
      >
        {items}
        {items}
      </div>
    </div>
  );
}
