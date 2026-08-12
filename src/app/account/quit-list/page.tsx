'use client';

import { useState, useMemo } from 'react';
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
    <div
      className="min-h-screen"
      style={{ backgroundColor: 'var(--lavender)', color: 'var(--ink-deep)' }}
    >
      {/* Hero */}
      <section className="px-6 pt-32 md:pt-40 pb-12">
        <div className="max-w-5xl mx-auto text-center">
          <p
            className="text-sm font-bold tracking-widest uppercase mb-7"
            style={{ color: 'var(--coral)' }}
          >
            Rule 04 companion · Clear Lungs
          </p>
          <h1
            className="font-display leading-[0.9] mb-7"
            style={{
              fontSize: 'clamp(60px, 11vw, 140px)',
              fontWeight: 900,
              letterSpacing: '-0.04em',
              color: 'var(--ink-deep)',
            }}
          >
            The <em style={{ color: 'var(--coral)', fontStyle: 'italic', fontWeight: 400 }}>Quit List</em>.
          </h1>
          <p
            className="text-xl max-w-2xl mx-auto mb-9 leading-relaxed"
            style={{ color: 'var(--ink-soft)' }}
          >
            Eighteen tobacco-cessation services across six continents. Phone
            lines, online programmes, apps, and clinic networks — pick the
            one closest to home. Most are free.
          </p>
          <div className="flex gap-3 flex-wrap justify-center">
            <a
              href="#library"
              className="inline-flex items-center gap-2 px-7 py-4 rounded-pill font-semibold text-[15px] transition-colors"
              style={{ backgroundColor: 'var(--ink-deep)', color: 'var(--paper)' }}
            >
              Browse the list
            </a>
          </div>
        </div>
      </section>

      {/* Marquee */}
      <div
        className="border-y overflow-hidden whitespace-nowrap py-4"
        style={{
          borderColor: 'var(--ink-deep)',
          backgroundColor: 'var(--lavender)',
          fontFamily: 'var(--font-display)',
          color: 'var(--ink-deep)',
        }}
      >
        <div
          className="inline-flex"
          style={{
            animation: 'marquee 46s linear infinite',
            willChange: 'transform',
          }}
        >
          {Array.from({ length: 2 }).map((_, groupIdx) => (
            <div key={groupIdx} className="inline-flex">
              {['Eighteen services', 'Six continents', 'Free to call', 'No paywall', 'Eighteen services', 'Six continents', 'Free to call', 'No paywall'].map((text, i) => (
                <span
                  key={`${groupIdx}-${i}`}
                  className="text-[15px] font-semibold tracking-widest uppercase"
                  style={{ padding: '0 24px' }}
                >
                  {text}
                  <span style={{ color: 'var(--coral)', marginLeft: 24 }}>✦</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Library */}
      <section id="library" className="px-6 pt-9 pb-16">
        <div className="max-w-7xl mx-auto">
          {Object.entries(QUIT_REGIONS).map(([regionKey, meta]) => {
            const services = grouped[regionKey] || [];
            if (!services.length) return null;
            return (
              <section key={regionKey} className="mb-14">
                <div className="flex items-baseline justify-between gap-5 flex-wrap pb-5 mb-5 border-b-2" style={{ borderColor: 'var(--ink-deep)' }}>
                  <h2
                    className="font-display leading-[1.02]"
                    style={{
                      fontWeight: 600,
                      fontSize: 'clamp(32px, 5vw, 52px)',
                      letterSpacing: '-0.03em',
                      color: 'var(--ink-deep)',
                    }}
                  >
                    {meta.label}
                  </h2>
                  <div
                    className="text-xs font-bold uppercase tracking-widest"
                    style={{ color: 'var(--ink-muted)' }}
                  >
                    {services.length} service{services.length === 1 ? '' : 's'}
                  </div>
                </div>
                <p
                  className="text-base max-w-2xl mb-6"
                  style={{ color: 'var(--ink-soft)' }}
                >
                  {meta.blurb}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {services.map((s) => (
                    <button
                      key={s.n}
                      onClick={() => setPicked(s)}
                      className="text-left rounded-2xl p-6 flex flex-col gap-3 min-h-[160px] transition-transform"
                      style={{
                        backgroundColor: 'var(--paper)',
                        boxShadow: '0 1px 0 rgba(26,23,48,0.04), 0 12px 28px -14px rgba(26,23,48,0.20)',
                        border: '1.5px solid transparent',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-3px)';
                        e.currentTarget.style.borderColor = 'var(--coral)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = '';
                        e.currentTarget.style.borderColor = 'transparent';
                      }}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div
                          className="font-display leading-none"
                          style={{
                            fontSize: 64,
                            fontWeight: 300,
                            fontStyle: 'italic',
                            color: 'var(--coral)',
                            letterSpacing: '-0.04em',
                          }}
                        >
                          {String(s.n).padStart(2, '0')}
                        </div>
                        <div
                          className="text-[9px] font-bold tracking-widest uppercase px-2 py-1 rounded-pill"
                          style={{
                            color: 'var(--ink-deep)',
                            border: '1px solid var(--ink-deep)',
                          }}
                        >
                          {s.country}
                        </div>
                      </div>
                      <div
                        className="font-display leading-tight"
                        style={{
                          fontWeight: 600,
                          fontSize: 20,
                          letterSpacing: '-0.02em',
                          color: 'var(--ink-deep)',
                        }}
                      >
                        {s.name}
                      </div>
                      <div
                        className="text-sm flex-1"
                        style={{ color: 'var(--ink-soft)' }}
                      >
                        {s.blurb}
                      </div>
                      <div className="flex gap-1.5 flex-wrap">
                        {s.support.slice(0, 2).map((k) => (
                          <span
                            key={k}
                            className="text-[10.5px] font-semibold px-2 py-1 rounded-pill"
                            style={{
                              color: 'var(--ink-soft)',
                              border: '1px solid var(--border-strong-soft)',
                            }}
                          >
                            {QUIT_SUPPORT[k]}
                          </span>
                        ))}
                        {s.phone && (
                          <span
                            className="text-[10.5px] font-semibold px-2 py-1 rounded-pill"
                            style={{
                              color: 'var(--coral)',
                              border: '1px solid var(--coral)',
                            }}
                          >
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
      </section>

      {picked && (
        <Modal
          open
          onClose={() => setPicked(null)}
          title={picked.name}
          ariaLabel={`No. ${picked.n} · ${QUIT_REGIONS[picked.region].label}`}
        >
          <p
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color: 'var(--coral)' }}
          >
            {QUIT_REGIONS[picked.region].label} · {picked.country}
          </p>
          <p className="text-sm mb-2" style={{ color: 'var(--ink-muted)' }}>
            {picked.org}
          </p>
          <p className="text-base mb-4" style={{ color: 'var(--ink-soft)' }}>
            {picked.blurb}
          </p>

          <div className="grid grid-cols-2 gap-3 text-sm">
            {picked.phone && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--ink-muted)' }}>
                  Phone
                </p>
                <p className="font-mono" style={{ color: 'var(--ink-deep)' }}>
                  {picked.phone}
                </p>
              </div>
            )}
            {picked.website && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--ink-muted)' }}>
                  Website
                </p>
                <a
                  href={picked.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline break-all"
                  style={{ color: 'var(--coral)' }}
                >
                  {picked.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                </a>
              </div>
            )}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--ink-muted)' }}>
                Languages
              </p>
              <p style={{ color: 'var(--ink-deep)' }}>{picked.languages.join(', ')}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--ink-muted)' }}>
                Cost
              </p>
              <p style={{ color: 'var(--ink-deep)' }}>{picked.cost}</p>
            </div>
            <div className="col-span-2">
              <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--ink-muted)' }}>
                Support types
              </p>
              <div className="flex flex-wrap gap-1.5">
                {picked.support.map((k) => (
                  <span
                    key={k}
                    className="text-[12px] font-semibold px-2.5 py-1 rounded-pill"
                    style={{
                      color: 'var(--ink-soft)',
                      border: '1px solid var(--border-strong-soft)',
                    }}
                  >
                    {QUIT_SUPPORT[k]}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {picked.notes && (
            <div
              className="p-3 rounded"
              style={{ backgroundColor: 'var(--lavender-soft)' }}
            >
              <p
                className="text-[10px] font-bold uppercase tracking-widest mb-1"
                style={{ color: 'var(--coral)' }}
              >
                Good to know
              </p>
              <p className="text-sm" style={{ color: 'var(--ink-soft)' }}>
                {picked.notes}
              </p>
            </div>
          )}

          <div className="flex gap-1.5 pt-4 border-t" style={{ borderColor: 'var(--border-soft)' }}>
            {picked.website && (
              <a
                href={picked.website}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-[13px] px-3.5 py-2 rounded-pill"
                style={{ color: 'var(--paper)', backgroundColor: 'var(--ink-deep)' }}
              >
                Visit site →
              </a>
            )}
            <button
              onClick={() => setPicked(null)}
              className="font-medium text-[13px] px-3.5 py-2 rounded-pill"
              style={{ color: 'var(--ink-soft)' }}
            >
              Close
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
