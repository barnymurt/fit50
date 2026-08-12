'use client';

import { useEffect, useState } from 'react';
import {
  DRINKS,
  DRINK_FLAVOURS,
  DRINK_OCCASIONS,
  type Drink,
} from '@/data/drinks';

function esc(s: string) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c] || c));
}
const pad = (n: number) => String(n).padStart(2, '0');

function printDrink(d: Drink) {
  if (typeof window === 'undefined') return;
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
.macros { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; padding: 12px; background: #F3ECDC; margin: 16px 0; border-radius: 10px; }
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
  const [flavours, setFlavours] = useState<Set<string>>(new Set());
  const [occasions, setOccasions] = useState<Set<string>>(new Set());
  const [openId, setOpenId] = useState<number | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const f = params.get('f');
    const o = params.get('o');
    if (f) f.split(',').forEach((v) => v && DRINK_FLAVOURS[v as keyof typeof DRINK_FLAVOURS] && flavours.add(v));
    if (o) o.split(',').forEach((v) => v && DRINK_OCCASIONS[v as keyof typeof DRINK_OCCASIONS] && occasions.add(v));
    setHydrated(true);
  }, []);

  const syncUrl = () => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams();
    if (flavours.size) params.set('f', [...flavours].join(','));
    if (occasions.size) params.set('o', [...occasions].join(','));
    const q = params.toString();
    window.history.replaceState(null, '', window.location.pathname + (q ? `?${q}` : '') + window.location.hash);
  };

  const render = () => {
    const list = DRINKS.filter((d) => {
      if (flavours.size && !d.flavour.some((f) => flavours.has(f))) return false;
      if (occasions.size && !d.occasions.some((o) => occasions.has(o))) return false;
      return true;
    });
    const grid = document.getElementById('grid');
    const empty = document.getElementById('empty');
    const countEl = document.getElementById('count');
    if (!grid || !empty || !countEl) return;
    countEl.textContent = `${list.length} drink${list.length === 1 ? '' : 's'}`;
    grid.innerHTML = '';
    if (!list.length) {
      empty.hidden = false;
      return;
    }
    empty.hidden = true;
    list.forEach((d) => grid.appendChild(makeTile(d)));
  };

  const syncFilterUi = () => {
    document.querySelectorAll<HTMLElement>('.pill').forEach((pill) => {
      const kind = pill.dataset.kind;
      const key = pill.dataset.key;
      if (!kind || !key) return;
      const set = kind === 'flavour' ? flavours : occasions;
      pill.setAttribute('aria-pressed', set.has(key) ? 'true' : 'false');
    });
  };

  const handlePill = (key: string, kind: 'flavour' | 'occasion') => {
    const set = new Set(kind === 'flavour' ? flavours : occasions);
    if (set.has(key)) set.delete(key);
    else set.add(key);
    if (kind === 'flavour') setFlavours(set);
    else setOccasions(set);
    syncFilterUi();
    render();
    syncUrl();
  };

  const clearFilters = () => {
    setFlavours(new Set());
    setOccasions(new Set());
    syncFilterUi();
    render();
    syncUrl();
  };

  const batchPreset = () => {
    setFlavours(new Set());
    setOccasions(new Set(['batch']));
    syncFilterUi();
    render();
    syncUrl();
    document.getElementById('library')?.scrollIntoView({ behavior: 'smooth' });
  };

  const openDrink = (n: number) => {
    const d = DRINKS.find((x) => x.n === n);
    if (!d) return;
    const modal = document.getElementById('modal') as HTMLDialogElement | null;
    if (!modal) return;
    const flavourList = d.flavour.map((f) => DRINK_FLAVOURS[f]).join(' · ');
    const occasionList = d.occasions.map((o) => DRINK_OCCASIONS[o]).join(' · ');
    const ingredients = d.ingredients.map((i) => `<li>${esc(i)}</li>`).join('');
    const method = d.method.map((m) => `<li>${esc(m)}</li>`).join('');
    const macros = d.macros
      ? `<div class="modal-macros" role="group" aria-label="Macros per serving">
        <div><span>Kcal</span><strong>${esc(d.kcal)}</strong></div>
        <div><span>Carbs</span><strong>${d.macros.c}g</strong></div>
        <div><span>Protein</span><strong>${d.macros.p}g</strong></div>
        <div><span>Fat</span><strong>${d.macros.f}g</strong></div>
      </div>`
      : '';
    const batchNote = d.batch_note
      ? `<div class="modal-note"><strong>Batch trick</strong>${esc(d.batch_note)}</div>`
      : '';
    document.getElementById('modal-content')!.innerHTML = `
      <div class="modal-header">
        <div>
          <div class="modal-eyebrow">No. ${pad(d.n)}</div>
          <div class="modal-title">${esc(d.name)}</div>
        </div>
        <button class="modal-close" data-close aria-label="Close">×</button>
      </div>
      <div class="modal-blurb">${esc(d.blurb)}</div>
      ${macros}
      <div class="modal-meta">
        <div><span>Servings</span><strong>${d.servings} × ${esc(d.size)}</strong></div>
        <div><span>Kcal / serve</span><strong>${esc(d.kcal)}</strong></div>
        <div><span>Keeps</span><strong>${esc(d.keeps)}</strong></div>
        <div><span>Effort</span><strong>${esc(d.effort)}</strong></div>
      </div>
      <div class="modal-section-title">Ingredients</div>
      <ul class="modal-ingredients">${ingredients}</ul>
      <div class="modal-section-title">Method</div>
      <ol class="modal-method">${method}</ol>
      ${batchNote}
      <div class="modal-note"><strong>Flavour</strong>${esc(flavourList)}</div>
      <div class="modal-note"><strong>Best for</strong>${esc(occasionList)}</div>
      <div class="modal-actions">
        <button type="button" class="modal-action-btn" data-copy="${d.n}">Copy recipe</button>
        <button type="button" class="modal-action-btn" data-print>Print</button>
        <button type="button" class="modal-action-btn" data-pdf="${d.n}">↓ Download as PDF card</button>
      </div>
    `;
    modal.showModal();
    setOpenId(d.n);
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#drink-${pad(d.n)}`);
    }
    modal.querySelector('[data-close]')?.addEventListener('click', () => closeDrink());
    modal.querySelector('[data-print]')?.addEventListener('click', () => window.print());
    modal.querySelector(`[data-pdf="${d.n}"]`)?.addEventListener('click', () => printDrink(d));
  };

  const closeDrink = () => {
    const modal = document.getElementById('modal') as HTMLDialogElement | null;
    if (modal?.open) modal.close();
    setOpenId(null);
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
    }
  };

  const makeTile = (d: Drink) => {
    const t = document.createElement('button');
    t.className = 'tile';
    t.type = 'button';
    t.dataset.id = String(d.n);
    t.setAttribute('role', 'listitem');
    const tags = d.flavour
      .slice(0, 2)
      .map((f) => `<span class="tile-tag">${esc(DRINK_FLAVOURS[f])}</span>`)
      .join('');
    t.innerHTML = `
      <div class="tile-top">
        <div class="tile-num">${pad(d.n)}</div>
        ${d.macros ? '<div class="tile-macro-flag">Macros</div>' : ''}
      </div>
      <div class="tile-name">${esc(d.name)}</div>
      <div class="tile-blurb">${esc(d.blurb)}</div>
      <div class="tile-meta">
        <span class="chip chip-kcal">${esc(d.kcal)} kcal</span>
        <span class="chip chip-effort">${esc(d.effort)}</span>
      </div>
      <div class="tile-tags">${tags}</div>
    `;
    t.addEventListener('click', () => openDrink(d.n));
    return t;
  };

  useEffect(() => {
    if (!hydrated) return;
    syncFilterUi();
    render();
  }, [hydrated, flavours, occasions]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const clearBtn = document.getElementById('clear');
    const batchBtn = document.getElementById('batch-preset');
    const modal = document.getElementById('modal');
    const onClear = () => clearFilters();
    const onBatch = () => batchPreset();
    clearBtn?.addEventListener('click', onClear);
    batchBtn?.addEventListener('click', onBatch);
    const onBackdrop = (e: MouseEvent) => {
      if ((e.target as HTMLElement).id === 'modal') closeDrink();
    };
    modal?.addEventListener('click', onBackdrop);
    return () => {
      clearBtn?.removeEventListener('click', onClear);
      batchBtn?.removeEventListener('click', onBatch);
      modal?.removeEventListener('click', onBackdrop);
    };
  }, []);

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        * { margin: 0; }
        html { scroll-behavior: smooth; }
        body { line-height: 1.5; -webkit-font-smoothing: antialiased; }
        img, svg { display: block; max-width: 100%; }
        button { font: inherit; cursor: pointer; border: none; background: none; color: inherit; padding: 0; }
        a { color: inherit; text-decoration: none; }
        ul, ol { list-style: none; padding: 0; }
      `}</style>

      <header className="site-header">
        <div className="wrap">
          <a href="/" className="brand">FIT50</a>
          <nav className="nav" aria-label="Primary">
            <a href="/#rules">Rules</a>
            <a href="/#workouts">Workouts</a>
            <a href="/#tracker">Tracker</a>
            <a href="/#resources">On the house</a>
            <a href="/#faq">FAQ</a>
          </nav>
          <a href="/#sign-up" className="start-btn">Buy us a beer</a>
        </div>
      </header>

      <section className="hero">
        <div className="wrap">
          <span className="eyebrow">Rule 03 companion · Crispy Clarity</span>
          <h1>
            The <em>Drinks</em>.
          </h1>
          <p className="lede">
            Fifty zero-proof pours. No alcohol. No sugar bombs. All
            macro-friendly. Because “no drinking” shouldn’t mean “no drinks.”
          </p>
          <div className="cta-row">
            <a href="#library" className="btn btn-primary">Browse the library</a>
            <button type="button" className="btn btn-ghost" id="batch-preset">Show batch drinks</button>
          </div>
        </div>
      </section>

      <div className="marquee" aria-hidden="true">
        <div className="marquee-track">
          {Array.from({ length: 2 }).map((_, groupIdx) => (
            <span key={groupIdx}>
              {['Fifty drinks', 'Zero alcohol', 'Zero sugar bombs', 'Macros optional', 'Fifty drinks', 'Zero alcohol', 'Zero sugar bombs', 'Macros optional'].map((t, i) => (
                <span key={i} style={{ padding: '0 24px' }}>
                  {t} <span style={{ color: 'var(--coral)', fontSize: 18, marginLeft: 24 }}>✦</span>
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      <section id="library" className="library">
        <div className="wrap">
          <div className="filter-wrap">
            <div className="filter-groups">
              <div className="filter-group">
                <span className="filter-label">Flavour</span>
                <div className="pills" id="flavour-pills">
                  {(Object.keys(DRINK_FLAVOURS) as Array<keyof typeof DRINK_FLAVOURS>).map((k) => (
                    <button
                      key={k}
                      type="button"
                      data-key={k}
                      data-kind="flavour"
                      onClick={() => handlePill(k, 'flavour')}
                      className="pill"
                      aria-pressed="false"
                    >
                      {DRINK_FLAVOURS[k]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="filter-group">
                <span className="filter-label">Occasion</span>
                <div className="pills" id="occasion-pills">
                  {(Object.keys(DRINK_OCCASIONS) as Array<keyof typeof DRINK_OCCASIONS>).map((k) => (
                    <button
                      key={k}
                      type="button"
                      data-key={k}
                      data-kind="occasion"
                      onClick={() => handlePill(k, 'occasion')}
                      className="pill"
                      aria-pressed="false"
                    >
                      {DRINK_OCCASIONS[k]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="filter-meta">
              <span className="count" id="count">50 drinks</span>
              <button type="button" className="clear-btn" id="clear">Clear filters</button>
            </div>
          </div>

          <div className="grid" id="grid" role="list" />

          <div className="empty" id="empty" hidden>
            <h3>Nothing matches that combo.</h3>
            <p>Try clearing a filter.</p>
            <button type="button" className="btn btn-ghost" onClick={clearFilters}>Clear filters</button>
          </div>
        </div>
      </section>

      <div className="marquee" aria-hidden="true">
        <div className="marquee-track">
          {Array.from({ length: 2 }).map((_, groupIdx) => (
            <span key={groupIdx}>
              {['Thirsty yet', 'Pick one', 'Pour', 'Repeat tomorrow', 'Thirsty yet', 'Pick one', 'Pour', 'Repeat tomorrow'].map((t, i) => (
                <span key={i} style={{ padding: '0 24px' }}>
                  {t} <span style={{ color: 'var(--coral)', fontSize: 18, marginLeft: 24 }}>✦</span>
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      <section className="coda">
        <div className="wrap">
          <h2>Fifty days, no alcohol. Fifty drinks, no problem.</h2>
          <a href="/#tracker" className="btn btn-primary">Back to the tracker</a>
        </div>
      </section>

      <footer className="site-footer">
        <div className="wrap">
          <div>
            <div className="footer-brand">FIT50</div>
            <div className="footer-tag">50 days. 9 habits. 1 fresh start.</div>
          </div>
          <nav className="footer-nav" aria-label="Footer">
            <a href="/#rules">Rules</a>
            <a href="/#workouts">Workouts</a>
            <a href="/#tracker">Tracker</a>
            <a href="/#resources">On the house</a>
            <a href="/#faq">FAQ</a>
          </nav>
          <div className="footer-copy">© 2026 FIT50. All rights reserved.</div>
        </div>
      </footer>

      <dialog className="modal" id="modal" aria-label="Drink recipe">
        <div className="modal-body" id="modal-content" />
      </dialog>
    </>
  );
}
