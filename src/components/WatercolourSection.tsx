'use client';

import React from 'react';
import WatercolourCanvas from './WatercolourCanvas';
import PaperTexture from './PaperTexture';

interface WatercolourSectionProps {
  color: string;
  children: React.ReactNode;
  className?: string;
  seed?: number;
  includeDrips?: boolean;
}

export default function WatercolourSection({ 
  color, 
  children, 
  className = '', 
  seed = 1,
  includeDrips = false
}: WatercolourSectionProps) {
  return (
    <section className={`relative overflow-hidden ${className}`}>
      <WatercolourCanvas color={color} seed={seed} />
      <PaperTexture />
      <div className="relative z-10">
        {children}
      </div>
    </section>
  );
}
