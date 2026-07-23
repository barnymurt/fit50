'use client';

import React from 'react';

interface MarqueeProps {
  text: string;
  separator?: string;
  speed?: number;
  className?: string;
  textClassName?: string;
}

export default function Marquee({
  text,
  separator = '•',
  speed = 120,
  className = '',
  textClassName = '',
}: MarqueeProps) {
  const item = `${text} ${separator} `;
  const items = Array.from({ length: 8 }, (_, i) => (
    <span
      key={i}
      className={`font-marquee leading-none uppercase pr-12 ${textClassName}`}
      style={{ fontSize: 'clamp(5rem, 13vw, 12rem)' }}
    >
      {item}
    </span>
  ));

  return (
    <div
      className={`overflow-hidden whitespace-nowrap select-none ${className}`}
      aria-hidden="true"
    >
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
