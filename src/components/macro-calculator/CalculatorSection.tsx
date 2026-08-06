'use client';

import { useState } from 'react';
import Section from '../Section';
import Marquee from '../Marquee';
import Button from '../Button';
import CalculatorPanel from './CalculatorPanel';
import { COPY } from './copy';
import type { MacroResults } from './types';

export default function CalculatorSection() {
  const [results, setResults] = useState<MacroResults | null>(null);

  return (
    <Section
      className="relative text-ink overflow-hidden pt-40 md:pt-56"
      style={{ backgroundColor: '#D8B8D0' }}
    >
      <h2 className="sr-only">{COPY.eyebrow}</h2>

      <div className="absolute top-0 left-0 right-0 h-32 md:h-52 overflow-hidden pointer-events-none z-0 flex items-center">
        <Marquee
          text={COPY.marqueeText}
          separator="✦"
          speed={220}
          textClassName="text-coral/55"
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-10 pb-section">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-16 md:mb-20">
          <div className="md:col-span-7">
            <p
              className="font-display text-ink/95 leading-tight"
              style={{ fontSize: 'clamp(1.875rem, 3vw, 3rem)', lineHeight: '1.15', letterSpacing: '-0.01em' }}
            >
              {COPY.statementLine}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-6 md:col-start-7">
            <CalculatorPanel
              results={results}
              setResults={setResults}
              onCalculated={() => {
                /* results render is already driven by state */
              }}
            />
          </div>
        </div>

        <div className="flex flex-col items-center text-center mt-16 md:mt-20">
          <p className="font-display text-ink leading-tight mb-6"
             style={{ fontSize: 'clamp(1.5rem, 2vw, 1.875rem)', lineHeight: '1.2' }}>
            {COPY.closingLine}
          </p>
          <Button href="#tracker" variant="primary" tone="light">
            {COPY.closingCta}
          </Button>
        </div>
      </div>
    </Section>
  );
}
