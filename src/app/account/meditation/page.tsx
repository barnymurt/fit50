'use client';

import { useEffect, useState } from 'react';
import {
  MEDITATION_APPS,
  MEDITATION_CATEGORIES,
  MEDITATION_FEATURES,
  type MeditationApp,
} from '@/data/meditation';
import '@/styles/on-the-house.css';

function esc(s: string) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c] || c));
}
const pad = (n: number) => String(n).padStart(2, '0');

export default function MeditationPage() {
  const [categories, setCategories] = useState<Set<string>>(new Set());
  const [features, setFeatures] = useState<Set<string>>(new Set());
  const [openId, setOpenId] = useState<number | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const c = params.get('c');
    const f = params.get('f');
    if (c) c.split(',').forEach((v) => v && MEDITATION_CATEGORIES[v as keyof typeof MEDITATION_CATEGORIES] && categories.add(v));
    if (f) f.split(',').forEach((v) => v && MEDITATION_FEATURES[v] && features.add(v));
    setHydrated(true);
  }, []);

  const syncUrl = () => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams();
    if (categories.size) params.set('c', [...categories].join(','));
    if (features.size) params.set('f', [...features].join(','));
    const q = params.toString();
    window.history.replaceState(null, '', window.location.pathname + (q ? `?${q}` : '') + window.location.hash);
  };

  const render = () => {
    const list = MEDITATION_APPS.filter((a) => {
      if (categories.size && !categories.has(a.category)) return false;
      if (features.size && !a.features.some((f) => features.has(f))) return false;
      return true;
    });
    const wrap = document.getElementById('categories');
    const empty = document.getElementById('empty');
    const countEl = document.getElementById('count');
    if (!wrap || !empty || !countEl) return;
    countEl.textContent = `${list.length} app${list.length === 1 ? '' : 's'}`;
    wrap.innerHTML = '';
    if (!list.length) {
      empty.hidden = false;
      return;
    }
    empty.hidden = true;
    (Object.entries(MEDITATION_CATEGORIES) as [keyof typeof MEDITATION_CATEGORIES, typeof MEDITATION_CATEGORIES[keyof typeof MEDITATION_CATEGORIES]][]).forEach(([key, meta]) => {
      const items = list.filter((a) => a.category === key);
      if (!items.length) return;
      const section = document.createElement('section');
      section.className = 'cat-section';
      section.id = `cat-${key}`;
      section.innerHTML = `
        <div class="cat-header">
          <h2 class="cat-title">${esc(meta.label)}</h2>
          <div class="cat-count">${items.length} app${items.length === 1 ? '' : 's'}</div>
        </div>
        <p class="cat-blurb">${esc(meta.blurb)}</p>
        <div class="grid" role="list"></div>
      `;
      const grid = section.querySelector('.grid') as HTMLElement;
      items.forEach((a) => grid.appendChild(makeTile(a)));
      wrap.appendChild(section);
    });
  };

  const syncFilterUi = () => {
    document.querySelectorAll<HTMLElement>('.pill').forEach((pill) => {
      const kind = pill.dataset.kind;
      const key = pill.dataset.key;
      if (!kind || !key) return;
      const set = kind === 'category' ? categories : features;
      pill.setAttribute('aria-pressed', set.has(key) ? 'true' : 'false');
    });
  };

  const handlePill = (key: string, kind: 'category' | 'feature') => {
    const set = new Set(kind === 'category' ? categories : features);
    if (set.has(key)) set.delete(key);
    else set.add(key);
    if (kind === 'category') setCategories(set);
    else setFeatures(set);
    syncFilterUi();
    render();
    syncUrl();
  };

  const clearFilters = () => {
    setCategories(new Set());
    setFeatures(new Set());
    syncFilterUi();
    render();
    syncUrl();
  };

  const freePreset = () => {
    setCategories(new Set(['free']));
    setFeatures(new Set());
    syncFilterUi();
    render();
    syncUrl();
    document.getElementById('library')?.scrollIntoView({ behavior: 'smooth' });
  };

  const openApp = (n: number) => {
    const a = MEDITATION_APPS.find((x) => x.n === n);
    if (!a) return;
    const modal = document.getElementById('modal') as HTMLDialogElement | null;
    if (!modal) return;
    const featChips = a.features
      .map((k) => `<span class="chip chip-feat">${esc(MEDITATION_FEATURES[k] || k)}</span>`)
      .join('');
    const webRow = a.website
      ? `<div><span>Website</span><strong><a href="${esc(a.website)}" target="_blank" rel="noopener noreferrer">${esc(a.website.replace(/^https?:\/\//, '').replace(/\/$/, ''))}</a></strong></div>`
      : '';
    document.getElementById('modal-content')!.innerHTML = `
      <div class="modal-header">
        <div>
          <div class="modal-eyebrow">No. ${pad(a.n)} · ${esc(MEDITATION_CATEGORIES[a.category].label)}</div>
          <div class="modal-title">${esc(a.name)}</div>
          <div class="modal-org">${esc(a.org)}</div>
        </div>
        <button class="modal-close" data-close aria-label="Close">×</button>
      </div>
      <div class="modal-blurb">${esc(a.blurb)}</div>
      <div class="modal-meta">
        <div><span>Price</span><strong>${esc(a.price)}</strong></div>
        ${webRow}
        <div><span>Platforms</span><strong>${a.platforms.map(esc).join(', ')}</strong></div>
        <div><span>Best for</span><strong>${esc(a.best_for)}</strong></div>
      </div>
      <div class="modal-section-title">Strengths</div>
      <div class="modal-feats">${featChips}</div>
      ${a.notes ? `<div class="modal-note"><strong>Good to know</strong>${esc(a.notes)}</div>` : ''}
      <div class="modal-actions">
        ${a.website ? `<a href="${esc(a.website)}" target="_blank" rel="noopener noreferrer" class="modal-action-btn modal-action-primary">Visit site ↗</a>` : ''}
        <button type="button" class="modal-action-btn" data-copy="${a.n}">Copy details</button>
        <button type="button" class="modal-action-btn" data-print>Print</button>
      </div>
    `;
    modal.showModal();
    setOpenId(a.n);
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#app-${pad(a.n)}`);
    }
    modal.querySelector('[data-close]')?.addEventListener('click', () => closeApp());
    modal.querySelector('[data-print]')?.addEventListener('click', () => window.print());
    modal.querySelector(`[data-copy="${a.n}"]`)?.addEventListener('click', (e) => copyDetails(a.n, e.currentTarget as HTMLButtonElement));
  };

  const closeApp = () => {
    const modal = document.getElementById('modal') as HTMLDialogElement | null;
    if (modal?.open) modal.close();
    setOpenId(null);
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
    }
  };

  const copyDetails = (n: number, btn: HTMLButtonElement) => {
    const a = MEDITATION_APPS.find((x) => x.n === n);
    if (!a) return;
    const text = [
      a.name,
      a.org,
      '',
      `Price: ${a.price}`,
      a.website ? `Web: ${a.website}` : null,
      `Platforms: ${a.platforms.join(', ')}`,
      `Best for: ${a.best_for}`,
      `Strengths: ${a.features.map((k) => MEDITATION_FEATURES[k] || k).join(', ')}`,
      '',
      a.blurb,
      a.notes ? `\nNote: ${a.notes}` : null,
      '',
      'From The Ten Minutes · FIT50',
    ]
      .filter(Boolean)
      .join('\n');
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        const original = btn.textContent;
        btn.textContent = 'Copied ✓';
        setTimeout(() => {
          btn.textContent = original;
        }, 1500);
      });
    }
  };

  const makeTile = (a: MeditationApp) => {
    const t = document.createElement('button');
    t.className = 'tile';
    t.type = 'button';
    t.dataset.id = String(a.n);
    t.setAttribute('role', 'listitem');
    const featChips = a.features
      .slice(0, 3)
      .map((k) => `<span class="chip chip-feat">${esc(MEDITATION_FEATURES[k] || k)}</span>`)
      .join('');
    const platforms = a.platforms.map((p) => `<span class="tile-platform">${esc(p)}</span>`).join('');
    const flagClass = a.category === 'free' ? 'tile-price-flag free' : 'tile-price-flag';
    const flagLabel = a.category === 'free' ? 'Free' : 'Premium';
    t.innerHTML = `
      <div class="tile-top">
        <div class="tile-num">${pad(a.n)}</div>
        <div class="${flagClass}">${flagLabel}</div>
      </div>
      <div class="tile-name">${esc(a.name)}</div>
      <div class="tile-org">${esc(a.org)}</div>
      <div class="tile-blurb">${esc(a.blurb)}</div>
      <div class="tile-meta">${featChips}</div>
      <div class="tile-platforms">${platforms}</div>
    `;
    t.addEventListener('click', () => openApp(a.n));
    return t;
  };

  useEffect(() => {
    if (!hydrated) return;
    syncFilterUi();
    render();
  }, [hydrated, categories, features]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const clearBtn = document.getElementById('clear');
    const freeBtn = document.getElementById('free-preset');
    const modal = document.getElementById('modal');
    const onClear = () => clearFilters();
    const onFree = () => freePreset();
    clearBtn?.addEventListener('click', onClear);
    freeBtn?.addEventListener('click', onFree);
    const onBackdrop = (e: MouseEvent) => {
      if ((e.target as HTMLElement).id === 'modal') closeApp();
    };
    modal?.addEventListener('click', onBackdrop);
    return () => {
      clearBtn?.removeEventListener('click', onClear);
      freeBtn?.removeEventListener('click', onFree);
      modal?.removeEventListener('click', onBackdrop);
    };
  }, []);

  return (
    <div className="theme-teal">
      <section className="hero">
        <div className="wrap">
          <span className="eyebrow">Rule 05 companion · Quiet Mind</span>
          <h1>
            The <em>Ten Minutes</em>.
          </h1>
          <p className="lede">
            Eight meditation apps and sites that do great ten-minute sessions.
            Four free forever. Four premium with structure. Pick one, press play.
          </p>
          <div className="cta-row">
            <a href="#library" className="btn btn-primary">Browse the eight</a>
            <button type="button" className="btn btn-ghost" id="free-preset">Free only</button>
          </div>
        </div>
      </section>

      <div className="marquee" aria-hidden="true">
        <div className="marquee-track">
          {Array.from({ length: 2 }).map((_, groupIdx) => (
            <span key={groupIdx}>
              {['Eight apps', 'Ten minutes', 'Press play', 'Breathe in', 'Eight apps', 'Ten minutes', 'Press play', 'Breathe in'].map((t, i) => (
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
                <span className="filter-label">Category</span>
                <div className="pills" id="category-pills">
                  {(Object.keys(MEDITATION_CATEGORIES) as Array<keyof typeof MEDITATION_CATEGORIES>).map((k) => (
                    <button
                      key={k}
                      type="button"
                      data-key={k}
                      data-kind="category"
                      onClick={() => handlePill(k, 'category')}
                      className="pill"
                      aria-pressed="false"
                    >
                      {MEDITATION_CATEGORIES[k].label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="filter-group">
                <span className="filter-label">Best for</span>
                <div className="pills" id="feature-pills">
                  {(Object.keys(MEDITATION_FEATURES)).map((k) => (
                    <button
                      key={k}
                      type="button"
                      data-key={k}
                      data-kind="feature"
                      onClick={() => handlePill(k, 'feature')}
                      className="pill"
                      aria-pressed="false"
                    >
                      {MEDITATION_FEATURES[k]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="filter-meta">
              <span className="count" id="count">8 apps</span>
              <button type="button" className="clear-btn" id="clear">Clear filters</button>
            </div>
          </div>

          <div id="categories" />

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
              {['Sit down', 'Close your eyes', 'Notice the breath', 'Ten minutes done', 'Sit down', 'Close your eyes', 'Notice the breath', 'Ten minutes done'].map((t, i) => (
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
          <h2>The best app is the one you’ll actually open tomorrow.</h2>
          <div className="coda-note">
            Meditation apps complement therapy but don’t replace it. If anxiety is significantly affecting your daily life, speak with a mental health professional first.
          </div>
          <a href="/#tracker" className="btn btn-primary">Back to the tracker</a>
        </div>
      </section>

      <dialog className="modal" id="modal" aria-label="Meditation app details">
        <div className="modal-body" id="modal-content" />
      </dialog>
    </div>
  );
}
