'use client';

import { useState, useMemo } from 'react';
import Section from '@/components/Section';
import Modal from '@/components/Modal';
import { MEDITATION_APPS, MEDITATION_CATEGORIES, MEDITATION_FEATURES, type MeditationApp } from '@/data/on-the-house';

export default function MeditationPage() {
  const [picked, setPicked] = useState<MeditationApp | null>(null);

  const grouped = useMemo(() => {
    const out: Record<string, MeditationApp[]> = {};
    for (const a of MEDITATION_APPS) {
      if (!out[a.category]) out[a.category] = [];
      out[a.category].push(a);
    }
    return out;
  }, []);

  return (
    <Section
      id="meditation"
      className="relative bg-paper overflow-hidden pt-40 md:pt-56"
      tone="paper"
    >
      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-10 pb-section">
        <div className="text-center mb-12 md:mb-16">
          <p className="font-body text-caption uppercase text-coral mb-3">
            On the house
          </p>
          <h1 className="font-display text-display-1 text-ink mb-6 leading-[0.95]">
            The ten minutes.
          </h1>
          <p className="font-display text-h2 text-ink/80 max-w-2xl mx-auto leading-tight">
            Eight meditation apps and sites that do great ten-minute sessions.
            Four free forever. Four premium with structure.
          </p>
        </div>

        {Object.entries(MEDITATION_CATEGORIES).map(([catKey, meta]) => {
          const apps = grouped[catKey] || [];
          if (!apps.length) return null;
          return (
            <section key={catKey} className="mb-12">
              <h2 className="font-display text-h1 text-ink mb-2 leading-tight">
                {meta.label}
              </h2>
              <p className="font-body text-base text-ink/70 mb-6 max-w-2xl">
                {meta.blurb}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-ink/10 border border-ink/15">
                {apps.map((a) => (
                  <button
                    key={a.n}
                    onClick={() => setPicked(a)}
                    className="text-left bg-paper hover:bg-cream/30 transition-colors p-6 flex flex-col gap-3 min-h-[200px]"
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-display text-coral text-sm tabular-nums">
                        No. {String(a.n).padStart(2, '0')}
                      </span>
                      <span
                        className={`font-body text-caption uppercase tracking-widest px-2 py-0.5 ${
                          a.category === 'free'
                            ? 'bg-ink text-paper'
                            : 'border border-ink text-ink'
                        }`}
                      >
                        {a.category === 'free' ? 'Free' : 'Premium'}
                      </span>
                    </div>
                    <h3 className="font-display text-lg text-ink leading-tight">
                      {a.name}
                    </h3>
                    <p className="font-body text-sm text-ink/60">
                      {a.org}
                    </p>
                    <p className="font-body text-sm text-ink/70 flex-1">
                      {a.blurb}
                    </p>
                  </button>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {picked && (
        <Modal
          open
          onClose={() => setPicked(null)}
          title={picked.name}
          ariaLabel={`No. ${picked.n} · ${MEDITATION_CATEGORIES[picked.category].label}`}
        >
          <p className="font-body text-caption uppercase text-coral">
            {MEDITATION_CATEGORIES[picked.category].label}
          </p>
          <p className="font-body text-sm text-ink/70 mb-2">{picked.org}</p>
          <p className="font-body text-base text-ink/80">{picked.blurb}</p>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="col-span-2">
              <p className="font-body text-caption uppercase tracking-widest text-ink/50 mb-1">Price</p>
              <p className="text-ink">{picked.price}</p>
            </div>
            <div>
              <p className="font-body text-caption uppercase tracking-widest text-ink/50 mb-1">Platforms</p>
              <p className="text-ink">{picked.platforms.join(', ')}</p>
            </div>
            <div>
              <p className="font-body text-caption uppercase tracking-widest text-ink/50 mb-1">Best for</p>
              <p className="text-ink">{picked.best_for}</p>
            </div>
            <div className="col-span-2">
              <p className="font-body text-caption uppercase tracking-widest text-ink/50 mb-1">Strengths</p>
              <div className="flex flex-wrap gap-1">
                {picked.features.map((k) => (
                  <span
                    key={k}
                    className="font-body text-caption uppercase tracking-widest text-ink/70 border border-ink/20 px-2 py-0.5"
                  >
                    {MEDITATION_FEATURES[k]}
                  </span>
                ))}
              </div>
            </div>
            <div className="col-span-2">
              <a
                href={picked.website}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full bg-ink text-paper font-body text-sm px-6 py-4 uppercase tracking-wider hover:bg-ink/85 transition-colors text-center"
              >
                Visit site →
              </a>
            </div>
          </div>

          {picked.notes && (
            <div className="border border-ink/15 p-3 bg-cream/30">
              <p className="font-body text-caption uppercase tracking-widest text-coral mb-1">Good to know</p>
              <p className="font-body text-sm text-ink/80">{picked.notes}</p>
            </div>
          )}
        </Modal>
      )}
    </Section>
  );
}
