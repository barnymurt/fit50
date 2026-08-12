'use client';

import { useState, useMemo } from 'react';
import Section from '@/components/Section';
import Modal from '@/components/Modal';
import { DRINKS, DRINK_FLAVOURS, DRINK_OCCASIONS, type Drink } from '@/data/on-the-house';

function printDrink(d: Drink) {
  const w = window.open('', '_blank', 'width=800,height=900');
  if (!w) return;
  const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>${d.name} — FIT50 recipe card</title>
<style>
body { font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; max-width: 640px; margin: 40px auto; padding: 0 24px; color: #1A1730; line-height: 1.5; }
h1 { font-family: 'Fraunces', 'Iowan Old Style', Georgia, serif; font-size: 32px; margin: 0 0 8px; }
.meta { color: #4C4568; font-size: 14px; margin-bottom: 16px; }
.kcal { display: inline-block; padding: 4px 10px; background: #1A1730; color: #FBF7EE; border-radius: 999px; font-size: 13px; font-weight: 600; }
h2 { font-size: 18px; text-transform: uppercase; letter-spacing: 0.1em; color: #F05A3E; margin: 24px 0 8px; }
ol, ul { padding-left: 22px; }
li { margin-bottom: 6px; }
.macros { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; padding: 12px; background: #E4DEF3; margin: 16px 0; border-radius: 10px; }
.macros > div { text-align: center; }
.macros span { display: block; font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #7A7396; }
.macros strong { display: block; font-size: 20px; margin-top: 2px; }
footer { margin-top: 32px; font-size: 12px; color: #7A7396; border-top: 1px solid #1A1730; padding-top: 12px; }
@media print { body { margin: 0; } }
</style></head><body>
<h1>${d.name}</h1>
<div class="meta">${d.servings} × ${d.size} · ${d.effort} · keeps ${d.keeps}</div>
<div class="macros">
  <div><span>kcal</span><strong>${d.kcal}</strong></div>
  ${d.macros ? `<div><span>carbs</span><strong>${d.macros.c}g</strong></div><div><span>protein</span><strong>${d.macros.p}g</strong></div><div><span>fat</span><strong>${d.macros.f}g</strong></div>` : `<div colspan="3"></div>`}
</div>
<p>${d.blurb}</p>
<h2>Ingredients</h2>
<ul>${d.ingredients.map(i => `<li>${i}</li>`).join('')}</ul>
<h2>Method</h2>
<ol>${d.method.map(m => `<li>${m}</li>`).join('')}</ol>
${d.batch_note ? `<p><em>${d.batch_note}</em></p>` : ''}
<footer>From the <strong>FIT50 Challenge</strong> — fit50challenge.io · 50 days. 9 habits. 1 fresh start.</footer>
</body></html>`;
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 250);
}

export default function DrinksPage() {
  const [picked, setPicked] = useState<Drink | null>(null);
  const drinks = useMemo(() => DRINKS, []);

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
            Rule 03 companion · Crispy Clarity
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
            The <em style={{ color: 'var(--coral)', fontStyle: 'italic', fontWeight: 400 }}>Drinks</em>.
          </h1>
          <p
            className="text-xl max-w-2xl mx-auto mb-9 leading-relaxed"
            style={{ color: 'var(--ink-soft)' }}
          >
            Fifty zero-proof pours. No alcohol. No sugar bombs. All
            macro-friendly. Because &ldquo;no drinking&rdquo; shouldn&rsquo;t mean
            &ldquo;no drinks.&rdquo;
          </p>
          <div className="flex gap-3 flex-wrap justify-center">
            <a
              href="#library"
              className="inline-flex items-center gap-2 px-7 py-4 rounded-pill font-semibold text-[15px] transition-colors"
              style={{ backgroundColor: 'var(--ink-deep)', color: 'var(--paper)' }}
            >
              Browse the library
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
              {['Fifty drinks', 'Zero alcohol', 'Zero sugar bombs', 'Macros optional', 'Fifty drinks', 'Zero alcohol', 'Zero sugar bombs', 'Macros optional'].map((text, i) => (
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
          <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
            {drinks.map((d) => (
              <button
                key={d.n}
                onClick={() => setPicked(d)}
                className="text-left rounded-2xl p-6 flex flex-col gap-3 transition-transform"
                style={{
                  backgroundColor: 'var(--paper)',
                  boxShadow: '0 1px 0 rgba(26,23,48,0.04), 0 12px 28px -14px rgba(26,23,48,0.20)',
                  minHeight: 240,
                  border: '1.5px solid transparent',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 1px 0 rgba(26,23,48,0.06), 0 22px 40px -18px rgba(26,23,48,0.28)';
                  e.currentTarget.style.borderColor = 'var(--coral)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = '';
                  e.currentTarget.style.boxShadow = '0 1px 0 rgba(26,23,48,0.04), 0 12px 28px -14px rgba(26,23,48,0.20)';
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
                    {String(d.n).padStart(2, '0')}
                  </div>
                  {d.macros && (
                    <div
                      className="text-[9px] font-bold tracking-widest uppercase px-2 py-1 rounded-pill"
                      style={{
                        color: 'var(--ink-deep)',
                        border: '1px solid var(--ink-deep)',
                      }}
                    >
                      Macros
                    </div>
                  )}
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
                  {d.name}
                </div>
                <div className="text-[13.5px] flex-1" style={{ color: 'var(--ink-soft)' }}>
                  {d.blurb}
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  <span
                    className="text-[10.5px] font-semibold px-2 py-1 rounded-pill"
                    style={{
                      color: 'var(--coral)',
                      border: '1px solid var(--coral)',
                    }}
                  >
                    {d.kcal} kcal
                  </span>
                  <span
                    className="text-[10.5px] font-semibold px-2 py-1 rounded-pill"
                    style={{
                      color: 'var(--ink-soft)',
                      border: '1px solid var(--ink-deep)',
                    }}
                  >
                    {d.effort}
                  </span>
                </div>
                <div
                  className="flex gap-1.5 flex-wrap pt-2 text-[10.5px] font-semibold uppercase tracking-widest"
                  style={{
                    color: 'var(--ink-muted)',
                    borderTop: '1px dashed var(--border-soft)',
                  }}
                >
                  {d.flavour.slice(0, 2).map((f) => (
                    <span key={f}>{DRINK_FLAVOURS[f]}</span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {picked && (
        <Modal
          open
          onClose={() => setPicked(null)}
          title={picked.name}
          ariaLabel={`No. ${picked.n} · ${picked.servings} servings`}
        >
          <p className="text-base" style={{ color: 'var(--ink-soft)' }}>
            {picked.blurb}
          </p>

          {picked.macros && (
            <div
              className="grid grid-cols-4 gap-2 p-3 text-center"
              style={{
                backgroundColor: 'var(--paper-warm)',
                borderRadius: 10,
              }}
            >
              <Cell label="kcal" value={picked.kcal} />
              <Cell label="carbs" value={`${picked.macros.c}g`} />
              <Cell label="protein" value={`${picked.macros.p}g`} />
              <Cell label="fat" value={`${picked.macros.f}g`} />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--ink-muted)' }}>
                Servings
              </p>
              <p style={{ color: 'var(--ink-deep)' }}>
                {picked.servings} × {picked.size}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--ink-muted)' }}>
                Effort
              </p>
              <p style={{ color: 'var(--ink-deep)' }}>{picked.effort}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--ink-muted)' }}>
                Keeps
              </p>
              <p style={{ color: 'var(--ink-deep)' }}>{picked.keeps}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--ink-muted)' }}>
                Best for
              </p>
              <p style={{ color: 'var(--ink-deep)' }}>
                {picked.occasions.map((o) => DRINK_OCCASIONS[o]).join(' · ')}
              </p>
            </div>
          </div>

          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--coral)' }}>
              Ingredients
            </p>
            <ul className="list-disc list-inside text-sm space-y-1" style={{ color: 'var(--ink-deep)' }}>
              {picked.ingredients.map((i, idx) => (
                <li key={idx} className="pb-1.5 border-b border-dashed" style={{ borderColor: 'var(--border-soft)' }}>
                  {i}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--coral)' }}>
              Method
            </p>
            <ol className="list-decimal list-inside text-sm space-y-2" style={{ color: 'var(--ink-soft)' }}>
              {picked.method.map((m, idx) => (
                <li key={idx} className="leading-relaxed pl-9 relative" style={{ counterIncrement: 'step' }}>
                  <span
                    className="absolute font-display italic font-semibold text-xl"
                    style={{ color: 'var(--coral)', left: 0, top: -2, lineHeight: 1.2 }}
                  >
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  {m}
                </li>
              ))}
            </ol>
          </div>

          {picked.batch_note && (
            <div
              className="p-3 rounded"
              style={{
                backgroundColor: 'var(--lavender-soft)',
              }}
            >
              <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--coral)' }}>
                Batch trick
              </p>
              <p className="text-sm italic" style={{ color: 'var(--ink-soft)' }}>
                {picked.batch_note}
              </p>
            </div>
          )}

          <div className="flex gap-1.5 pt-4 border-t" style={{ borderColor: 'var(--border-soft)' }}>
            <button
              onClick={() => printDrink(picked)}
              className="font-medium text-[13px] px-3.5 py-2 rounded-pill transition-colors"
              style={{ color: 'var(--paper)', backgroundColor: 'var(--ink-deep)' }}
            >
              ↓ Download as PDF card
            </button>
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

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p
        className="font-display leading-none tabular-nums"
        style={{ fontSize: 22, color: 'var(--ink-deep)' }}
      >
        {value}
      </p>
      <p
        className="text-[10px] font-bold uppercase tracking-widest mt-1"
        style={{ color: 'var(--ink-muted)' }}
      >
        {label}
      </p>
    </div>
  );
}
