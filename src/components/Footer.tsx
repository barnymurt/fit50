'use client';

import Section from './Section';

export default function Footer() {
  return (
    <Section
      as="footer"
      className="text-paper py-20 md:py-24"
      contained
      style={{ backgroundColor: '#1A1A1A' }}
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
        <div className="md:col-span-5">
          <h2 className="font-display text-display-2 text-paper leading-none">
            FIT50
          </h2>
          <p className="font-body text-paper/50 mt-4 max-w-sm">
            50 days. 9 habits. 1 fresh start.
          </p>
        </div>
      </div>

      <div className="pt-8 border-t border-paper/15 flex flex-col md:flex-row md:items-center gap-4">
        <nav className="flex flex-wrap gap-x-8 gap-y-2">
          {['Rules', 'Workouts', 'Tracker', 'FAQ'].map((label) => (
            <a
              key={label}
              href={`#${label.toLowerCase()}`}
              className="font-body text-caption uppercase text-paper/60 hover:text-paper transition-colors"
            >
              {label}
            </a>
          ))}
        </nav>
      </div>

      <p className="mt-10 font-body text-xs text-paper/40">
        © 2026 FIT50. All rights reserved.
      </p>
    </Section>
  );
}