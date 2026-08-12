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
body { font-family: -apple-system, system-ui, sans-serif; max-width: 640px; margin: 40px auto; padding: 0 24px; color: #1A1730; line-height: 1.5; }
h1 { font-size: 32px; margin: 0 0 8px; }
.meta { color: #4C4568; font-size: 14px; margin-bottom: 16px; }
.kcal { display: inline-block; padding: 4px 10px; background: #1A1730; color: #FBF7EE; border-radius: 999px; font-size: 13px; font-weight: 600; }
h2 { font-size: 18px; text-transform: uppercase; letter-spacing: 0.1em; color: #F05A3E; margin: 24px 0 8px; }
ol, ul { padding-left: 22px; }
li { margin-bottom: 6px; }
.macros { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; padding: 12px; background: #E4DEF3; margin: 16px 0; }
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
    <Section
      id="drinks"
      className="relative bg-paper overflow-hidden pt-40 md:pt-56"
      tone="paper"
    >
      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-10 pb-section">
        <div className="text-center mb-12 md:mb-16">
          <p className="font-body text-caption uppercase text-coral mb-3">
            On the house
          </p>
          <h1 className="font-display text-display-1 text-ink mb-6 leading-[0.95]">
            The drinks.
          </h1>
          <p className="font-display text-h2 text-ink/80 max-w-2xl mx-auto leading-tight">
            Fifty zero-proof pours. No alcohol. No sugar bombs. Each recipe
            downloadable as a card.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-ink/10 border border-ink/15">
          {drinks.map((d) => (
            <button
              key={d.n}
              onClick={() => setPicked(d)}
              className="text-left bg-paper hover:bg-cream/30 transition-colors p-6 flex flex-col gap-3 min-h-[180px]"
            >
              <div className="flex items-baseline justify-between">
                <span className="font-display text-coral text-sm tabular-nums">
                  No. {String(d.n).padStart(2, '0')}
                </span>
                <span className="font-body text-caption uppercase tracking-widest text-ink/50 tabular-nums">
                  {d.kcal} kcal
                </span>
              </div>
              <h3 className="font-display text-lg text-ink leading-tight">
                {d.name}
              </h3>
              <p className="font-body text-sm text-ink/70 flex-1">
                {d.blurb}
              </p>
              <div className="flex flex-wrap gap-1">
                {d.flavour.slice(0, 2).map((f) => (
                  <span
                    key={f}
                    className="font-body text-caption uppercase tracking-widest text-ink/50 border border-ink/20 px-2 py-0.5"
                  >
                    {DRINK_FLAVOURS[f]}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>

      {picked && (
        <Modal
          open
          onClose={() => setPicked(null)}
          title={picked.name}
          ariaLabel={`No. ${picked.n} · ${picked.servings} servings`}
        >
          <p className="font-body text-base text-ink/80">{picked.blurb}</p>

          {picked.macros && (
            <div className="grid grid-cols-4 gap-2 border border-ink/15 p-3 text-center">
              <Cell label="kcal" value={picked.kcal} />
              <Cell label="carbs" value={`${picked.macros.c}g`} />
              <Cell label="protein" value={`${picked.macros.p}g`} />
              <Cell label="fat" value={`${picked.macros.f}g`} />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="font-body text-caption uppercase tracking-widest text-ink/50 mb-1">Servings</p>
              <p className="text-ink">{picked.servings} × {picked.size}</p>
            </div>
            <div>
              <p className="font-body text-caption uppercase tracking-widest text-ink/50 mb-1">Effort</p>
              <p className="text-ink">{picked.effort}</p>
            </div>
            <div>
              <p className="font-body text-caption uppercase tracking-widest text-ink/50 mb-1">Keeps</p>
              <p className="text-ink">{picked.keeps}</p>
            </div>
            <div>
              <p className="font-body text-caption uppercase tracking-widest text-ink/50 mb-1">Best for</p>
              <p className="text-ink">{picked.occasions.map(o => DRINK_OCCASIONS[o]).join(' · ')}</p>
            </div>
          </div>

          <div>
            <p className="font-body text-caption uppercase tracking-widest text-ink/50 mb-2">Ingredients</p>
            <ul className="list-disc list-inside text-sm text-ink space-y-1">
              {picked.ingredients.map((i, idx) => (
                <li key={idx}>{i}</li>
              ))}
            </ul>
          </div>

          <div>
            <p className="font-body text-caption uppercase tracking-widest text-ink/50 mb-2">Method</p>
            <ol className="list-decimal list-inside text-sm text-ink space-y-1">
              {picked.method.map((m, idx) => (
                <li key={idx}>{m}</li>
              ))}
            </ol>
          </div>

          {picked.batch_note && (
            <div className="border border-ink/15 p-3 bg-cream/30">
              <p className="font-body text-caption uppercase tracking-widest text-coral mb-1">Batch trick</p>
              <p className="font-body text-sm text-ink/80 italic">{picked.batch_note}</p>
            </div>
          )}

          <button
            onClick={() => printDrink(picked)}
            className="w-full bg-ink text-paper font-body text-sm px-6 py-4 uppercase tracking-wider hover:bg-ink/85 transition-colors flex items-center justify-center gap-2"
          >
            <span>↓</span> Download as PDF card
          </button>
        </Modal>
      )}
    </Section>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-display text-h3 leading-none tabular-nums text-ink">
        {value}
      </p>
      <p className="font-body text-caption uppercase tracking-widest text-ink/40 mt-1">
        {label}
      </p>
    </div>
  );
}
