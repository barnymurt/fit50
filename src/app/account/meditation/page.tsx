'use client';

import { useState, useMemo } from 'react';
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
            Rule 05 companion · Quiet Mind
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
            The <em style={{ color: 'var(--coral)', fontStyle: 'italic', fontWeight: 400 }}>Ten Minutes</em>.
          </h1>
          <p
            className="text-xl max-w-2xl mx-auto mb-9 leading-relaxed"
            style={{ color: 'var(--ink-soft)' }}
          >
            Eight meditation apps and sites that do great ten-minute
            sessions. Four free forever. Four premium with structure. Pick
            one, press play.
          </p>
          <div className="flex gap-3 flex-wrap justify-center">
            <a
              href="#library"
              className="inline-flex items-center gap-2 px-7 py-4 rounded-pill font-semibold text-[15px] transition-colors"
              style={{ backgroundColor: 'var(--ink-deep)', color: 'var(--paper)' }}
            >
              Browse the eight
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
              {['Eight apps', 'Ten minutes', 'Press play', 'Breathe in', 'Eight apps', 'Ten minutes', 'Press play', 'Breathe in'].map((text, i) => (
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
          {Object.entries(MEDITATION_CATEGORIES).map(([catKey, meta]) => {
            const apps = grouped[catKey] || [];
            if (!apps.length) return null;
            return (
              <section key={catKey} className="mb-14">
                <div
                  className="flex items-baseline justify-between gap-5 flex-wrap pb-5 mb-5 border-b-2"
                  style={{ borderColor: 'var(--ink-deep)' }}
                >
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
                    {apps.length} app{apps.length === 1 ? '' : 's'}
                  </div>
                </div>
                <p className="text-base max-w-2xl mb-6" style={{ color: 'var(--ink-soft)' }}>
                  {meta.blurb}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {apps.map((a) => (
                    <button
                      key={a.n}
                      onClick={() => setPicked(a)}
                      className="text-left rounded-2xl p-6 flex flex-col gap-3 min-h-[200px] transition-transform"
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
                          {String(a.n).padStart(2, '0')}
                        </div>
                        <div
                          className="text-[9px] font-bold tracking-widest uppercase px-2 py-1 rounded-pill"
                          style={
                            a.category === 'free'
                              ? { backgroundColor: 'var(--ink-deep)', color: 'var(--paper)' }
                              : { color: 'var(--ink-deep)', border: '1px solid var(--ink-deep)' }
                          }
                        >
                          {a.category === 'free' ? 'Free' : 'Premium'}
                        </div>
                      </div>
                      <div
                        className="font-display leading-tight"
                        style={{
                          fontWeight: 600,
                          fontSize: 22,
                          letterSpacing: '-0.02em',
                          color: 'var(--ink-deep)',
                        }}
                      >
                        {a.name}
                      </div>
                      <div className="text-xs" style={{ color: 'var(--ink-muted)' }}>
                        {a.org}
                      </div>
                      <div
                        className="text-sm flex-1"
                        style={{ color: 'var(--ink-soft)' }}
                      >
                        {a.blurb}
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
          ariaLabel={`No. ${picked.n} · ${MEDITATION_CATEGORIES[picked.category].label}`}
        >
          <p
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color: 'var(--coral)' }}
          >
            {MEDITATION_CATEGORIES[picked.category].label}
          </p>
          <p className="text-sm mb-3" style={{ color: 'var(--ink-muted)' }}>
            {picked.org}
          </p>
          <p className="text-base mb-4" style={{ color: 'var(--ink-soft)' }}>
            {picked.blurb}
          </p>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="col-span-2">
              <p
                className="text-[10px] font-bold uppercase tracking-widest mb-1"
                style={{ color: 'var(--ink-muted)' }}
              >
                Price
              </p>
              <p style={{ color: 'var(--ink-deep)' }}>{picked.price}</p>
            </div>
            <div>
              <p
                className="text-[10px] font-bold uppercase tracking-widest mb-1"
                style={{ color: 'var(--ink-muted)' }}
              >
                Platforms
              </p>
              <p style={{ color: 'var(--ink-deep)' }}>{picked.platforms.join(', ')}</p>
            </div>
            <div>
              <p
                className="text-[10px] font-bold uppercase tracking-widest mb-1"
                style={{ color: 'var(--ink-muted)' }}
              >
                Best for
              </p>
              <p style={{ color: 'var(--ink-deep)' }}>{picked.best_for}</p>
            </div>
            <div className="col-span-2">
              <p
                className="text-[10px] font-bold uppercase tracking-widest mb-1"
                style={{ color: 'var(--ink-muted)' }}
              >
                Strengths
              </p>
              <div className="flex flex-wrap gap-1.5">
                {picked.features.map((k) => (
                  <span
                    key={k}
                    className="text-[12px] font-semibold px-2.5 py-1 rounded-pill"
                    style={{
                      color: 'var(--ink-soft)',
                      border: '1px solid var(--border-strong-soft)',
                    }}
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
                className="block w-full px-6 py-4 rounded-pill font-semibold text-[15px] text-center"
                style={{ backgroundColor: 'var(--ink-deep)', color: 'var(--paper)' }}
              >
                Visit site →
              </a>
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
        </Modal>
      )}
    </div>
  );
}
