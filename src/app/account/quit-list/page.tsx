'use client';

import { useState, useMemo } from 'react';
import Section from '@/components/Section';
import Modal from '@/components/Modal';
import { QUIT_SERVICES, QUIT_REGIONS, QUIT_SUPPORT, type QuitService } from '@/data/on-the-house';

export default function QuitListPage() {
  const [picked, setPicked] = useState<QuitService | null>(null);

  const grouped = useMemo(() => {
    const out: Record<string, QuitService[]> = {};
    for (const s of QUIT_SERVICES) {
      if (!out[s.region]) out[s.region] = [];
      out[s.region].push(s);
    }
    return out;
  }, []);

  return (
    <Section
      id="quit-list"
      className="relative bg-paper overflow-hidden pt-40 md:pt-56"
      tone="paper"
    >
      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-10 pb-section">
        <div className="text-center mb-12 md:mb-16">
          <p className="font-body text-caption uppercase text-coral mb-3">
            On the house
          </p>
          <h1 className="font-display text-display-1 text-ink mb-6 leading-[0.95]">
            The quit list.
          </h1>
          <p className="font-display text-h2 text-ink/80 max-w-2xl mx-auto leading-tight">
            Tobacco-cessation services across the world. Phone lines, online
            programmes, apps, and clinic networks — most are free.
          </p>
        </div>

        {Object.entries(QUIT_REGIONS).map(([regionKey, meta]) => {
          const services = grouped[regionKey] || [];
          if (!services.length) return null;
          return (
            <section key={regionKey} className="mb-12">
              <h2 className="font-display text-h1 text-ink mb-2 leading-tight">
                {meta.label}
              </h2>
              <p className="font-body text-base text-ink/70 mb-6 max-w-2xl">
                {meta.blurb}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-ink/10 border border-ink/15">
                {services.map((s) => (
                  <button
                    key={s.n}
                    onClick={() => setPicked(s)}
                    className="text-left bg-paper hover:bg-cream/30 transition-colors p-5 flex flex-col gap-2 min-h-[160px]"
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-display text-coral text-sm tabular-nums">
                        No. {String(s.n).padStart(2, '0')}
                      </span>
                      <span className="font-body text-caption uppercase tracking-widest text-ink/50">
                        {s.country}
                      </span>
                    </div>
                    <h3 className="font-display text-base text-ink leading-tight">
                      {s.name}
                    </h3>
                    <p className="font-body text-sm text-ink/70 flex-1">
                      {s.blurb}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {s.support.slice(0, 2).map((k) => (
                        <span
                          key={k}
                          className="font-body text-caption uppercase tracking-widest text-ink/50 border border-ink/20 px-2 py-0.5"
                        >
                          {QUIT_SUPPORT[k]}
                        </span>
                      ))}
                      {s.phone && (
                        <span className="font-body text-caption uppercase tracking-widest text-coral border border-coral px-2 py-0.5">
                          Phone
                        </span>
                      )}
                    </div>
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
          ariaLabel={`No. ${picked.n} · ${QUIT_REGIONS[picked.region].label}`}
        >
          <p className="font-body text-caption uppercase text-coral">
            {QUIT_REGIONS[picked.region].label} · {picked.country}
          </p>
          <p className="font-body text-sm text-ink/70 mb-2">
            {picked.org}
          </p>
          <p className="font-body text-base text-ink/80">{picked.blurb}</p>

          <div className="grid grid-cols-2 gap-3 text-sm">
            {picked.phone && (
              <div>
                <p className="font-body text-caption uppercase tracking-widest text-ink/50 mb-1">Phone</p>
                <p className="text-ink font-mono">{picked.phone}</p>
              </div>
            )}
            {picked.website && (
              <div>
                <p className="font-body text-caption uppercase tracking-widest text-ink/50 mb-1">Website</p>
                <a
                  href={picked.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-coral underline break-all"
                >
                  {picked.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                </a>
              </div>
            )}
            <div>
              <p className="font-body text-caption uppercase tracking-widest text-ink/50 mb-1">Languages</p>
              <p className="text-ink">{picked.languages.join(', ')}</p>
            </div>
            <div>
              <p className="font-body text-caption uppercase tracking-widest text-ink/50 mb-1">Cost</p>
              <p className="text-ink">{picked.cost}</p>
            </div>
            <div className="col-span-2">
              <p className="font-body text-caption uppercase tracking-widest text-ink/50 mb-1">Support types</p>
              <div className="flex flex-wrap gap-1">
                {picked.support.map((k) => (
                  <span
                    key={k}
                    className="font-body text-caption uppercase tracking-widest text-ink/70 border border-ink/20 px-2 py-0.5"
                  >
                    {QUIT_SUPPORT[k]}
                  </span>
                ))}
              </div>
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
