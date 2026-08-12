'use client';

import { useEffect, useState } from 'react';
import {
  QUIT_SERVICES,
  QUIT_REGIONS,
  QUIT_SUPPORT,
  type QuitService,
  type QuitService as QuitServiceType,
} from '@/data/quit-list';
import '@/styles/on-the-house.css';

const QUIT_SERVICES_TYPE: QuitServiceType[] = QUIT_SERVICES;

function esc(s: string) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c] || c));
}
const pad = (n: number) => String(n).padStart(2, '0');

export default function QuitListPage() {
  const [regions, setRegions] = useState<Set<string>>(new Set());
  const [supports, setSupports] = useState<Set<string>>(new Set());
  const [openId, setOpenId] = useState<number | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // parse filter state from URL on first mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const r = params.get('r');
    const s = params.get('s');
    if (r) r.split(',').forEach((v) => v && QUIT_REGIONS[v as keyof typeof QUIT_REGIONS] && regions.add(v));
    if (s) s.split(',').forEach((v) => v && QUIT_SUPPORT[v as keyof typeof QUIT_SUPPORT] && supports.add(v));
    setHydrated(true);
  }, []);

  const syncUrl = () => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams();
    if (regions.size) params.set('r', [...regions].join(','));
    if (supports.size) params.set('s', [...supports].join(','));
    const q = params.toString();
    window.history.replaceState(null, '', window.location.pathname + (q ? `?${q}` : '') + window.location.hash);
  };

  const filtered = () => {
    return QUIT_SERVICES.filter((s) => {
      if (regions.size && !regions.has(s.region)) return false;
      if (supports.size && !s.support.some((x) => supports.has(x))) return false;
      return true;
    });
  };

  const render = () => {
    const list = filtered();
    const wrap = document.getElementById('regions');
    const empty = document.getElementById('empty');
    const countEl = document.getElementById('count');
    if (!wrap || !empty || !countEl) return;
    countEl.textContent = `${list.length} service${list.length === 1 ? '' : 's'}`;
    wrap.innerHTML = '';
    if (!list.length) {
      empty.hidden = false;
      return;
    }
    empty.hidden = true;
    (Object.entries(QUIT_REGIONS) as [keyof typeof QUIT_REGIONS, typeof QUIT_REGIONS[keyof typeof QUIT_REGIONS]][]).forEach(([key, meta]) => {
      const items = list.filter((s) => s.region === key);
      if (!items.length) return;
      const section = document.createElement('section');
      section.className = 'region-section';
      section.id = `region-${key}`;
      section.innerHTML = `
        <div class="region-header">
          <h2 class="region-title">${esc(meta.label)}</h2>
          <div class="region-count">${items.length} service${items.length === 1 ? '' : 's'}</div>
        </div>
        <p class="region-blurb">${esc(meta.blurb)}</p>
        <div class="grid" role="list"></div>
      `;
      const grid = section.querySelector('.grid') as HTMLElement;
      items.forEach((s) => grid.appendChild(makeTile(s)));
      wrap.appendChild(section);
    });
  };

  const syncFilterUi = () => {
    document.querySelectorAll<HTMLElement>('.pill').forEach((pill) => {
      const kind = pill.dataset.kind;
      const key = pill.dataset.key;
      if (!kind || !key) return;
      const set = kind === 'region' ? regions : supports;
      pill.setAttribute('aria-pressed', set.has(key) ? 'true' : 'false');
    });
  };

  const handlePill = (key: string, kind: 'region' | 'support') => {
    const set = (kind === 'region' ? regions : supports);
    const next = new Set(set);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    if (kind === 'region') setRegions(next);
    else setSupports(next);
    syncFilterUi();
    render();
    syncUrl();
  };

  const clearFilters = () => {
    setRegions(new Set());
    setSupports(new Set());
    syncFilterUi();
    render();
    syncUrl();
  };

  const phonePreset = () => {
    setRegions(new Set());
    setSupports(new Set(['phone']));
    syncFilterUi();
    render();
    syncUrl();
    document.getElementById('library')?.scrollIntoView({ behavior: 'smooth' });
  };

  const openService = (n: number) => {
    const s = QUIT_SERVICES.find((x) => x.n === n);
    if (!s) return;
    const modal = document.getElementById('modal') as HTMLDialogElement | null;
    if (!modal) return;
    const supportChips = s.support
      .map((k) => {
        const cls = k === 'phone' ? 'chip chip-phone' : `chip chip-${k}`;
        return `<span class="${cls}">${esc(QUIT_SUPPORT[k])}</span>`;
      })
      .join('');
    const langs = s.languages.map((l) => `<span class="tile-lang">${esc(l)}</span>`).join('');
    const phoneRow = s.phone
      ? `<div><span>Phone</span><strong>${esc(s.phone)}</strong></div>`
      : `<div><span>Phone</span><strong style="color:var(--ink-3)">Not applicable</strong></div>`;
    const webRow = s.website
      ? `<div><span>Website</span><strong><a href="${esc(s.website)}" target="_blank" rel="noopener noreferrer">${esc((s.website ?? '').replace(/^https?:\/\//, '').replace(/\/$/, ''))}</a></strong></div>`
      : '';
    document.getElementById('modal-content')!.innerHTML = `
      <div class="modal-header">
        <div>
          <div class="modal-eyebrow">No. ${pad(s.n)} · ${esc(QUIT_REGIONS[s.region].label)}</div>
          <div class="modal-title">${esc(s.name)}</div>
          <div class="modal-org">${esc(s.org)} · ${esc(s.country)}</div>
        </div>
        <button class="modal-close" data-close aria-label="Close">×</button>
      </div>
      <div class="modal-blurb">${esc(s.blurb)}</div>
      <div class="modal-meta">
        ${phoneRow}
        ${webRow}
        <div><span>Languages</span><strong>${langs}</strong></div>
        <div><span>Cost</span><strong>${esc(s.cost)}</strong></div>
      </div>
      <div class="modal-section-title">Support types</div>
      <div class="modal-support">${supportChips}</div>
      ${s.notes ? `<div class="modal-note"><strong>Good to know</strong>${esc(s.notes)}</div>` : ''}
      <div class="modal-actions">
        ${s.website ? `<a href="${esc(s.website)}" target="_blank" rel="noopener noreferrer" class="modal-action-btn modal-action-primary">Visit site ↗</a>` : ''}
        <button type="button" class="modal-action-btn" data-copy="${s.n}">Copy details</button>
        <button type="button" class="modal-action-btn" data-print>Print</button>
      </div>
    `;
    modal.showModal();
    setOpenId(s.n);
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#service-${pad(s.n)}`);
    }
    modal.querySelector('[data-close]')?.addEventListener('click', () => closeService());
    modal.querySelector('[data-copy]')?.addEventListener('click', (e) => copyDetails(s.n, e.currentTarget as HTMLButtonElement));
    modal.querySelector('[data-print]')?.addEventListener('click', () => window.print());
  };

  const closeService = () => {
    const modal = document.getElementById('modal') as HTMLDialogElement | null;
    if (modal?.open) modal.close();
    setOpenId(null);
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
    }
  };

  const copyDetails = (n: number, btn: HTMLButtonElement) => {
    const s = QUIT_SERVICES.find((x) => x.n === n);
    if (!s) return;
    const text = [
      s.name,
      `${s.org} · ${s.country}`,
      '',
      s.phone ? `Phone: ${s.phone}` : null,
      s.website ? `Web: ${s.website}` : null,
      `Languages: ${s.languages.join(', ')}`,
      `Support: ${s.support.map((k) => QUIT_SUPPORT[k]).join(', ')}`,
      `Cost: ${s.cost}`,
      '',
      s.blurb,
      s.notes ? `\nNote: ${s.notes}` : null,
      '',
      'From The Quit List · FIT50',
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

  const makeTile = (s: QuitService) => {
    const t = document.createElement('button');
    t.className = 'tile';
    t.type = 'button';
    t.dataset.id = String(s.n);
    t.setAttribute('role', 'listitem');
    const supportChips = s.support
      .slice(0, 3)
      .map((k) => {
        const cls = k === 'phone' ? 'chip chip-phone' : `chip chip-${k}`;
        return `<span class="${cls}">${esc(QUIT_SUPPORT[k])}</span>`;
      })
      .join('');
    const langs = s.languages.map((l) => `<span class="tile-lang">${esc(l)}</span>`).join('');
    t.innerHTML = `
      <div class="tile-top">
        <div class="tile-num">${pad(s.n)}</div>
        <div class="tile-country">${esc(s.country)}</div>
      </div>
      <div class="tile-name">${esc(s.name)}</div>
      <div class="tile-org">${esc(s.org)}</div>
      <div class="tile-blurb">${esc(s.blurb)}</div>
      <div class="tile-meta">${supportChips}</div>
      <div class="tile-langs">${langs}</div>
    `;
    t.addEventListener('click', () => openService(s.n));
    return t;
  };

  // initial render of the library
  useEffect(() => {
    if (!hydrated) return;
    syncFilterUi();
    render();
  }, [hydrated, regions, supports]);

  // global event listeners
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const clearBtn = document.getElementById('clear');
    const phoneBtn = document.getElementById('phone-preset');
    const modal = document.getElementById('modal');
    const onClear = () => clearFilters();
    const onPhone = () => phonePreset();
    clearBtn?.addEventListener('click', onClear);
    phoneBtn?.addEventListener('click', onPhone);
    const onBackdrop = (e: MouseEvent) => {
      if ((e.target as HTMLElement).id === 'modal') closeService();
    };
    modal?.addEventListener('click', onBackdrop);
    return () => {
      clearBtn?.removeEventListener('click', onClear);
      phoneBtn?.removeEventListener('click', onPhone);
      modal?.removeEventListener('click', onBackdrop);
    };
  }, []);

  return (
    <>
      {/* Header */}
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

      {/* Hero */}
      <section className="hero">
        <div className="wrap">
          <span className="eyebrow">Rule 04 companion · Clear Lungs</span>
          <h1>
            The <em>Quit List</em>.
          </h1>
          <p className="lede">
            Forty tobacco-cessation services across six continents. Phone lines,
            online programmes, apps, and clinic networks — pick the one closest
            to home. Most are free.
          </p>
          <div className="cta-row">
            <a href="#library" className="btn btn-primary">Browse the list</a>
            <button type="button" className="btn btn-ghost" id="phone-preset">Phone lines only</button>
          </div>
        </div>
      </section>

      {/* Marquee 1 */}
      <div className="marquee" aria-hidden="true">
        <div className="marquee-track">
          {Array.from({ length: 2 }).map((_, groupIdx) => (
            <span key={groupIdx}>
              {['Forty services', 'Six continents', 'Free to call', 'No paywall', 'Forty services', 'Six continents', 'Free to call', 'No paywall'].map((t, i) => (
                <span key={i} style={{ padding: '0 24px' }}>
                  {t} <span style={{ color: 'var(--coral)', fontSize: 18, marginLeft: 24 }}>✦</span>
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* Library + Filters */}
      <section id="library" className="library">
        <div className="wrap">
          <div className="filter-wrap">
            <div className="filter-groups">
              <div className="filter-group">
                <span className="filter-label">Region</span>
                <div className="pills" id="region-pills">
                  {(Object.keys(QUIT_REGIONS) as Array<keyof typeof QUIT_REGIONS>).map((k) => (
                    <button
                      key={k}
                      type="button"
                      data-key={k}
                      data-kind="region"
                      onClick={() => handlePill(k, 'region')}
                      className="pill"
                      aria-pressed="false"
                    >
                      {QUIT_REGIONS[k].label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="filter-group">
                <span className="filter-label">Support</span>
                <div className="pills" id="support-pills">
                  {(Object.keys(QUIT_SUPPORT) as Array<keyof typeof QUIT_SUPPORT>).map((k) => (
                    <button
                      key={k}
                      type="button"
                      data-key={k}
                      data-kind="support"
                      onClick={() => handlePill(k, 'support')}
                      className="pill"
                      aria-pressed="false"
                    >
                      {QUIT_SUPPORT[k]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="filter-meta">
              <span className="count" id="count">40 services</span>
              <button type="button" className="clear-btn" id="clear">Clear filters</button>
            </div>
          </div>

          <div id="regions" />

          <div className="empty" id="empty" hidden>
            <h3>Nothing matches that combo.</h3>
            <p>Try clearing a filter.</p>
            <button type="button" className="btn btn-ghost" onClick={clearFilters}>Clear filters</button>
          </div>
        </div>
      </section>

      {/* Marquee 2 */}
      <div className="marquee" aria-hidden="true">
        <div className="marquee-track">
          {Array.from({ length: 2 }).map((_, groupIdx) => (
            <span key={groupIdx}>
              {['Pick up the phone', 'Make the call', 'Set a quit date', 'Day one starts today', 'Pick up the phone', 'Make the call', 'Set a quit date', 'Day one starts today'].map((t, i) => (
                <span key={i} style={{ padding: '0 24px' }}>
                  {t} <span style={{ color: 'var(--coral)', fontSize: 18, marginLeft: 24 }}>✦</span>
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* Coda */}
      <section className="coda">
        <div className="wrap">
          <h2>Fifty days smoke-free starts with one call.</h2>
          <div className="coda-note">
            Antarctica has no permanent population, so no cessation services exist there.
            Researchers stationed on the ice rely on their home country’s programme.
          </div>
          <a href="/#tracker" className="btn btn-primary">Back to the tracker</a>
        </div>
      </section>

      {/* Footer */}
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
          <div className="footer-copy">
            © 2026 FIT50. All rights reserved. Numbers and web addresses are compiled from
            publicly available government and NGO sources; verify locally before relying on them in a crisis.
          </div>
        </div>
      </footer>

      {/* Modal */}
      <dialog className="modal" id="modal" aria-label="Service details">
        <div className="modal-body" id="modal-content" />
      </dialog>
    </>
  );
}
