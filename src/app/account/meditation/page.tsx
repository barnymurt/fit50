'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Fraunces, Inter } from 'next/font/google';

const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['300', '400', '600', '700', '900'],
  style: ['normal', 'italic'],
  variable: '--tm-font-display',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--tm-font-body',
  display: 'swap',
});

/* ============================================================
   Taxonomy
   ============================================================ */
const CATEGORIES = {
  free:    { label: 'Free',    blurb: 'Fully usable without paying — either non-profit, university-backed, or with a genuinely functional free tier.' },
  premium: { label: 'Premium', blurb: 'Subscription-based with the strongest 10-minute daily programming and structured courses. Most offer a free trial before you commit.' },
} as const;

const FEATURES = {
  beginner: 'Beginner-friendly',
  daily:    'Daily 10-min',
  courses:  'Structured courses',
  sleep:    'Sleep',
  anxiety:  'Anxiety',
  timer:    'Timer / unguided',
  secular:  'Secular / philosophy',
} as const;

type CategoryKey = keyof typeof CATEGORIES;
type FeatureKey = keyof typeof FEATURES;

interface App {
  n: number;
  category: CategoryKey;
  name: string;
  org: string;
  price: string;
  blurb: string;
  website: string;
  platforms: string[];
  features: FeatureKey[];
  best_for: string;
  notes: string | null;
}

/* ============================================================
   Data
   ============================================================ */
const APPS: App[] = [
  /* ===== FREE ===== */
  { n: 1, category: 'free', name: 'Insight Timer', org: 'Insight Network Inc.', price: 'Free (Member Plus ~$69.99/yr optional)', blurb: 'The largest free meditation library on the planet — 200,000+ guided sessions from 10,000+ teachers, plus one of the best silent-meditation timers going. Filter by length to find plenty of 10-minute sessions.', website: 'https://insighttimer.com/', platforms: ['iOS', 'Android', 'Web'], features: ['timer', 'beginner', 'anxiety', 'sleep'], best_for: 'Anyone who wants variety, and experienced meditators who mostly want a good timer with bells.', notes: 'The Member Plus tier unlocks courses and offline downloads, but the free tier alone is more content than most people will get through in a lifetime.' },
  { n: 2, category: 'free', name: 'Smiling Mind', org: 'Smiling Mind (Australian not-for-profit)', price: 'Free forever', blurb: 'Fully free, no premium tier, no ads. Built by Australian psychologists with age-specific programmes from age 3 to adult. Sessions are typically 5–15 minutes — ideal for the 10-minute slot.', website: 'https://www.smilingmind.com.au/', platforms: ['iOS', 'Android', 'Web'], features: ['beginner', 'daily', 'anxiety'], best_for: 'Households — genuinely usable content for kids alongside adult programmes.', notes: 'Funded by donations and government grants. Also offers structured workplace and classroom programmes.' },
  { n: 3, category: 'free', name: 'UCLA Mindful', org: 'UCLA Mindful Awareness Research Center', price: 'Free', blurb: "The university's public meditation app, drawn from decades of MARC clinical practice. Short guided sessions of 3–19 minutes, in English and Spanish, with a fair chunk sitting right in the 10-minute range.", website: 'https://www.uclahealth.org/programs/marc/free-guided-meditations', platforms: ['iOS', 'Android', 'Web'], features: ['beginner', 'anxiety', 'secular'], best_for: 'People who want an academic, non-commercial voice with clinical credibility.', notes: 'No streaks, no gamification, no upsells. Just meditations.' },
  { n: 4, category: 'free', name: 'Medito', org: 'Medito Foundation (non-profit)', price: 'Free forever, no ads, no premium', blurb: 'A registered non-profit built to keep meditation free. Guided sessions on stress, sleep, focus, and grief, plus a timer with interval bells. Deliberately simple design — no upsell surface at all.', website: 'https://meditofoundation.org/', platforms: ['iOS', 'Android', 'Web'], features: ['beginner', 'sleep', 'anxiety', 'timer'], best_for: 'Anyone allergic to the freemium sales funnel of Calm and Headspace.', notes: 'Runs on donations. Open-source. Content quality is genuinely competitive with the paid apps.' },
  /* ===== PREMIUM ===== */
  { n: 5, category: 'premium', name: 'Headspace', org: 'Headspace Inc. (co-founded by Andy Puddicombe)', price: '$12.99/month or $69.99/year · 14-day free trial', blurb: 'The most structured onboarding in the category. The Basics course teaches one technique at a time with short animations explaining the concept. Every session lets you pick 10, 15 or 20 minutes.', website: 'https://www.headspace.com/', platforms: ['iOS', 'Android', 'Web'], features: ['beginner', 'courses', 'daily', 'sleep'], best_for: 'Complete beginners who want a curriculum rather than a buffet.', notes: 'One Oxford-published study found 10 days of use reduced mind-wandering by 32%. Andy is still the dominant voice, which some love and some tire of.' },
  { n: 6, category: 'premium', name: 'Calm', org: 'Calm.com Inc.', price: '$12.99/month or $69.99/year · 7-day free trial', blurb: 'Best-in-class 10-minute daily session. The Daily Calm changes every day, and Daily Trips are always around 10 minutes with stress-management guidance. Also the strongest sleep content on any app.', website: 'https://www.calm.com/', platforms: ['iOS', 'Android', 'Web'], features: ['daily', 'sleep', 'anxiety', 'beginner'], best_for: 'People whose main pain point is sleep, or who want a fresh 10-minute session waiting each day.', notes: 'Sleep Stories narrated by Matthew McConaughey and Harry Styles are surprisingly effective. A lifetime membership is also sold for $499.99.' },
  { n: 7, category: 'premium', name: 'Waking Up', org: 'Sam Harris', price: '$99.99/year · 7-day free trial · free scholarship on request', blurb: "Sam Harris's secular, philosophy-led path. Lessons run around 10 minutes and cover both practical mindfulness and deeper theory. Not a buffet — you're put on a sequential path.", website: 'https://www.wakingup.com/', platforms: ['iOS', 'Android', 'Web'], features: ['secular', 'courses', 'daily'], best_for: 'Experienced meditators, and anyone who wants meditation stripped of woo.', notes: "Harris publicly offers free access to anyone who genuinely can't afford it — email support and ask." },
  { n: 8, category: 'premium', name: 'Ten Percent Happier', org: 'Ten Percent Happier (founded by Dan Harris)', price: '~$99.99/year · limited free tier', blurb: "Grew out of the ABC news anchor's book of the same name. Structured courses with sessions typically in the 5–15 minute range and a strong bench of teachers (Joseph Goldstein, Sharon Salzberg, Jeff Warren).", website: 'https://www.tenpercent.com/', platforms: ['iOS', 'Android', 'Web'], features: ['courses', 'beginner', 'anxiety', 'secular'], best_for: "Skeptics — the tone is 'meditation for people who think meditation is silly'.", notes: 'The free tier gives you the introductory course. Coaches and 1:1 messaging sit in the paid plan.' },
];

/* ============================================================
   Helpers
   ============================================================ */
const pad = (n: number) => String(n).padStart(2, '0');
const cleanUrl = (u: string) => u.replace(/^https?:\/\//, '').replace(/\/$/, '');

/* ============================================================
   Component
   ============================================================ */
export default function TenMinutesPage() {
  const [categories, setCategories] = useState<Set<CategoryKey>>(new Set());
  const [features, setFeatures] = useState<Set<FeatureKey>>(new Set());
  const [openId, setOpenId] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const hydrated = useRef(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const c = params.get('c');
    const f = params.get('f');
    if (c) setCategories(new Set(c.split(',').filter((v): v is CategoryKey => v in CATEGORIES)));
    if (f) setFeatures(new Set(f.split(',').filter((v): v is FeatureKey => v in FEATURES)));
    const hashMatch = window.location.hash.match(/^#app-(\d+)$/);
    if (hashMatch) {
      const n = parseInt(hashMatch[1], 10);
      if (APPS.find((x) => x.n === n)) setOpenId(n);
    }
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    const params = new URLSearchParams();
    if (categories.size) params.set('c', [...categories].join(','));
    if (features.size) params.set('f', [...features].join(','));
    const q = params.toString();
    const hash = openId !== null ? `#app-${pad(openId)}` : '';
    window.history.replaceState(null, '', window.location.pathname + (q ? `?${q}` : '') + hash);
  }, [categories, features, openId]);

  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (openId !== null && !dlg.open) dlg.showModal();
    else if (openId === null && dlg.open) dlg.close();
  }, [openId]);

  const filtered = useMemo(
    () =>
      APPS.filter((a) => {
        if (categories.size && !categories.has(a.category)) return false;
        if (features.size && !a.features.some((f) => features.has(f))) return false;
        return true;
      }),
    [categories, features]
  );

  const grouped = useMemo(() => {
    const order = Object.keys(CATEGORIES) as CategoryKey[];
    return order
      .map((key) => ({
        key,
        meta: CATEGORIES[key],
        items: filtered.filter((a) => a.category === key),
      }))
      .filter((g) => g.items.length > 0);
  }, [filtered]);

  const toggleCategory = (key: CategoryKey) => {
    setCategories((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };
  const toggleFeature = (key: FeatureKey) => {
    setFeatures((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };
  const clearFilters = () => { setCategories(new Set()); setFeatures(new Set()); };
  const freeOnly = () => {
    setCategories(new Set(['free']));
    setFeatures(new Set());
    document.getElementById('tm-library')?.scrollIntoView({ behavior: 'smooth' });
  };

  const copyDetails = useCallback((a: App, btn: HTMLButtonElement) => {
    const lines = [
      a.name,
      a.org,
      '',
      `Price: ${a.price}`,
      a.website ? `Web: ${a.website}` : null,
      `Platforms: ${a.platforms.join(', ')}`,
      `Best for: ${a.best_for}`,
      `Strengths: ${a.features.map((k) => FEATURES[k]).join(', ')}`,
      '',
      a.blurb,
      a.notes ? `\nNote: ${a.notes}` : null,
      '',
      'From The Ten Minutes · FIT50',
    ].filter(Boolean).join('\n');
    navigator.clipboard.writeText(lines).then(() => {
      const original = btn.textContent;
      btn.textContent = 'Copied ✓';
      setTimeout(() => { btn.textContent = original; }, 1500);
    }).catch(() => { btn.textContent = 'Copy failed'; });
  }, []);

  const active = openId !== null ? APPS.find((a) => a.n === openId) ?? null : null;

  return (
    <div className={`tm-root ${fraunces.variable} ${inter.variable}`}>
      <section className="tm-hero">
        <div className="tm-wrap">
          <span className="tm-eyebrow">Rule 05 companion · Quiet Mind</span>
          <h1 className="tm-h1">The <em>Ten Minutes</em>.</h1>
          <p className="tm-lede">Eight meditation apps and sites that do great ten-minute sessions. Four free forever. Four premium with structure. Pick one, press play.</p>
          <div className="tm-cta-row">
            <a href="#tm-library" className="tm-btn tm-btn-primary">Browse the eight</a>
            <button type="button" className="tm-btn tm-btn-ghost" onClick={freeOnly}>Free only</button>
          </div>
        </div>
      </section>

      <div className="tm-marquee" aria-hidden="true">
        <div className="tm-marquee-track">
          {Array.from({ length: 3 }).map((_, i) => (
            <span key={i} className="tm-marquee-group">
              <span>Eight apps</span><span className="tm-star">✦</span>
              <span>Ten minutes</span><span className="tm-star">✦</span>
              <span>Press play</span><span className="tm-star">✦</span>
              <span>Breathe in</span><span className="tm-star">✦</span>
            </span>
          ))}
        </div>
      </div>

      <section id="tm-library" className="tm-library">
        <div className="tm-wrap">
          <div className="tm-filter-wrap">
            <div className="tm-filter-groups">
              <div className="tm-filter-group">
                <span className="tm-filter-label">Category</span>
                <div className="tm-pills">
                  {(Object.entries(CATEGORIES) as [CategoryKey, typeof CATEGORIES[CategoryKey]][]).map(([k, v]) => (
                    <button key={k} type="button" className="tm-pill" aria-pressed={categories.has(k)} onClick={() => toggleCategory(k)}>{v.label}</button>
                  ))}
                </div>
              </div>
              <div className="tm-filter-group">
                <span className="tm-filter-label">Best for</span>
                <div className="tm-pills">
                  {(Object.entries(FEATURES) as [FeatureKey, string][]).map(([k, label]) => (
                    <button key={k} type="button" className="tm-pill" aria-pressed={features.has(k)} onClick={() => toggleFeature(k)}>{label}</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="tm-filter-meta">
              <span className="tm-count">{filtered.length} app{filtered.length === 1 ? '' : 's'}</span>
              <button type="button" className="tm-clear-btn" onClick={clearFilters}>Clear filters</button>
            </div>
          </div>

          {grouped.length === 0 ? (
            <div className="tm-empty">
              <h3>Nothing matches that combo.</h3>
              <p>Try clearing a filter.</p>
              <button type="button" className="tm-btn tm-btn-ghost" onClick={clearFilters}>Clear filters</button>
            </div>
          ) : (
            grouped.map(({ key, meta, items }) => (
              <section key={key} className="tm-cat-section" id={`tm-cat-${key}`}>
                <div className="tm-cat-header">
                  <h2 className="tm-cat-title">{meta.label}</h2>
                  <div className="tm-cat-count">{items.length} app{items.length === 1 ? '' : 's'}</div>
                </div>
                <p className="tm-cat-blurb">{meta.blurb}</p>
                <div className="tm-grid" role="list">
                  {items.map((a) => (
                    <button key={a.n} type="button" className="tm-tile" role="listitem" onClick={() => setOpenId(a.n)}>
                      <div className="tm-tile-top">
                        <div className="tm-tile-num">{pad(a.n)}</div>
                        <div className={`tm-tile-flag ${a.category === 'free' ? 'tm-tile-flag-free' : ''}`}>
                          {a.category === 'free' ? 'Free' : 'Premium'}
                        </div>
                      </div>
                      <div className="tm-tile-name">{a.name}</div>
                      <div className="tm-tile-org">{a.org}</div>
                      <div className="tm-tile-blurb">{a.blurb}</div>
                      <div className="tm-tile-meta">
                        {a.features.slice(0, 3).map((k) => (
                          <span key={k} className="tm-chip tm-chip-neutral">{FEATURES[k]}</span>
                        ))}
                      </div>
                      <div className="tm-tile-platforms">
                        {a.platforms.map((p, i) => (
                          <span key={i} className="tm-tile-platform">{p}</span>
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            ))
          )}
        </div>
      </section>

      <div className="tm-marquee" aria-hidden="true">
        <div className="tm-marquee-track">
          {Array.from({ length: 3 }).map((_, i) => (
            <span key={i} className="tm-marquee-group">
              <span>Sit down</span><span className="tm-star">✦</span>
              <span>Close your eyes</span><span className="tm-star">✦</span>
              <span>Notice the breath</span><span className="tm-star">✦</span>
              <span>Ten minutes done</span><span className="tm-star">✦</span>
            </span>
          ))}
        </div>
      </div>

      <section className="tm-coda">
        <div className="tm-wrap">
          <h2 className="tm-coda-h2">The best app is the one you&apos;ll actually open tomorrow.</h2>
          <div className="tm-coda-note">Meditation apps complement therapy but don&apos;t replace it. If anxiety is significantly affecting your daily life, speak with a mental health professional first.</div>
        </div>
      </section>

      <dialog
        ref={dialogRef}
        className="tm-modal"
        aria-label="Meditation app details"
        onClose={() => setOpenId(null)}
        onClick={(e) => {
          if ((e.target as HTMLElement).classList.contains('tm-modal')) setOpenId(null);
        }}
      >
        {active && (
          <div className="tm-modal-body">
            <div className="tm-modal-header">
              <div>
                <div className="tm-modal-eyebrow">No. {pad(active.n)} · {CATEGORIES[active.category].label}</div>
                <div className="tm-modal-title">{active.name}</div>
                <div className="tm-modal-org">{active.org}</div>
              </div>
              <button type="button" className="tm-modal-close" aria-label="Close" onClick={() => setOpenId(null)}>×</button>
            </div>
            <div className="tm-modal-blurb">{active.blurb}</div>
            <div className="tm-modal-meta">
              <div><span>Price</span><strong>{active.price}</strong></div>
              <div><span>Website</span><strong><a href={active.website} target="_blank" rel="noopener noreferrer">{cleanUrl(active.website)}</a></strong></div>
              <div><span>Platforms</span><strong>{active.platforms.join(', ')}</strong></div>
              <div><span>Best for</span><strong>{active.best_for}</strong></div>
            </div>
            <div className="tm-modal-section-title">Strengths</div>
            <div className="tm-modal-feats">
              {active.features.map((k) => (
                <span key={k} className="tm-chip tm-chip-neutral">{FEATURES[k]}</span>
              ))}
            </div>
            {active.notes && <div className="tm-modal-note"><strong>Good to know</strong>{active.notes}</div>}
            <div className="tm-modal-actions">
              <a href={active.website} target="_blank" rel="noopener noreferrer" className="tm-modal-action-btn tm-modal-action-primary">Visit site ↗</a>
              <button type="button" className="tm-modal-action-btn" onClick={(e) => copyDetails(active, e.currentTarget)}>Copy details</button>
              <button type="button" className="tm-modal-action-btn" onClick={() => window.print()}>Print</button>
            </div>
          </div>
        )}
      </dialog>

      <style jsx>{`
        .tm-root {
          --tm-lavender: #e4def3;
          --tm-lavender-soft: #efeaf9;
          --tm-paper: #fbf7ee;
          --tm-coral: #f05a3e;
          --tm-coral-deep: #d8422c;
          --tm-ink: #1a1730;
          --tm-ink-2: #4c4568;
          --tm-ink-3: #7a7396;
          --tm-border: rgba(26, 23, 48, 0.1);
          --tm-border-strong: rgba(26, 23, 48, 0.2);
          --tm-fd: var(--tm-font-display, 'Fraunces', Georgia, serif);
          --tm-fb: var(--tm-font-body, 'Inter', system-ui, sans-serif);
          --tm-radius: 20px;
          --tm-radius-sm: 10px;
          --tm-radius-pill: 999px;
          --tm-shadow: 0 1px 0 rgba(26, 23, 48, 0.04), 0 12px 28px -14px rgba(26, 23, 48, 0.2);
          --tm-shadow-hover: 0 1px 0 rgba(26, 23, 48, 0.06), 0 22px 40px -18px rgba(26, 23, 48, 0.28);
          --tm-tx-fast: 160ms cubic-bezier(0.4, 0, 0.2, 1);
          --tm-tx-mid: 260ms cubic-bezier(0.4, 0, 0.2, 1);
          background: var(--color-cream);
          color: var(--tm-ink);
          font-family: var(--tm-fb);
          font-size: 16px;
          line-height: 1.5;
          min-height: 100vh;
          -webkit-font-smoothing: antialiased;
        }
        :where(.tm-root *) { box-sizing: border-box; }
        :where(.tm-root button) { font: inherit; cursor: pointer; border: none; background: none; color: inherit; padding: 0; }
        :where(.tm-root a) { color: inherit; text-decoration: none; }

        .tm-wrap { max-width: 1240px; margin: 0 auto; padding: 0 28px; }
        .tm-hero { padding: 48px 0 64px; }
        .tm-eyebrow { display: inline-flex; align-items: center; gap: 10px; font-size: 11px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: var(--tm-coral); margin-bottom: 28px; }
        .tm-eyebrow::before { content: ''; width: 32px; height: 1.5px; background: var(--tm-coral); }
        .tm-h1 { font-family: var(--tm-fd); font-weight: 900; font-size: clamp(60px, 11vw, 140px); line-height: 0.9; letter-spacing: -0.04em; color: var(--tm-ink); margin: 0 0 28px; }
        .tm-h1 em { font-style: italic; color: var(--tm-coral); font-weight: 400; }
        .tm-lede { font-size: 20px; max-width: 620px; color: var(--tm-ink-2); margin: 0 0 36px; line-height: 1.5; }
        .tm-cta-row { display: flex; gap: 12px; flex-wrap: wrap; }
        .tm-btn { display: inline-flex; align-items: center; gap: 8px; padding: 15px 26px; border-radius: var(--tm-radius-pill); font-weight: 600; font-size: 15px; transition: background var(--tm-tx-fast), border-color var(--tm-tx-fast), color var(--tm-tx-fast), transform var(--tm-tx-fast); border: none; }
        .tm-btn:active { transform: translateY(1px); }
        .tm-btn-primary { background: var(--tm-ink); color: var(--tm-paper); }
        .tm-btn-primary:hover { background: var(--tm-coral); }
        .tm-btn-ghost { border: 1.5px solid var(--tm-ink); color: var(--tm-ink); background: transparent; }
        .tm-btn-ghost:hover { border-color: var(--tm-coral); color: var(--tm-coral); }

        .tm-marquee { border-top: 1.5px solid var(--tm-ink); border-bottom: 1.5px solid var(--tm-ink); overflow: hidden; white-space: nowrap; font-family: var(--tm-fd); font-size: 15px; font-weight: 600; letter-spacing: 0.14em; padding: 16px 0; background: var(--color-cream); color: var(--tm-ink); text-transform: uppercase; }
        .tm-marquee-track { display: inline-flex; animation: tm-marquee 46s linear infinite; will-change: transform; }
        .tm-marquee-group span { padding: 0 24px; }
        .tm-marquee-group .tm-star { color: var(--tm-coral); font-size: 18px; }
        @keyframes tm-marquee { from { transform: translateX(0); } to { transform: translateX(-33.333%); } }

        .tm-library { padding-top: 36px; padding-bottom: 60px; }
        .tm-filter-wrap { position: sticky; top: 0; z-index: 30; background: var(--color-cream); color: var(--tm-ink); padding: 22px 0 18px; border-bottom: 1px solid var(--tm-border); }
        .tm-filter-groups { display: flex; flex-direction: column; gap: 14px; }
        .tm-filter-group { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
        .tm-filter-label { font-family: var(--tm-fd); font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: 0.14em; color: var(--tm-ink); min-width: 90px; }
        .tm-pills { display: flex; gap: 8px; flex-wrap: wrap; }
        .tm-pill { padding: 7px 14px; border-radius: var(--tm-radius-pill); background: var(--tm-paper); border: 1px solid var(--tm-border); font-size: 13px; color: var(--tm-ink-2); font-weight: 500; transition: background var(--tm-tx-fast), color var(--tm-tx-fast), border-color var(--tm-tx-fast); }
        .tm-pill:hover { border-color: var(--tm-coral); color: var(--tm-coral); }
        .tm-pill[aria-pressed='true'] { background: var(--tm-coral); color: var(--tm-paper); border-color: var(--tm-coral); }
        .tm-filter-meta { display: flex; align-items: center; gap: 20px; margin-top: 16px; padding-top: 16px; border-top: 1px dashed var(--tm-border); font-size: 14px; color: var(--tm-ink-2); }
        .tm-count { font-weight: 600; color: var(--tm-ink); }
        .tm-clear-btn { color: var(--tm-coral); font-weight: 600; text-decoration: underline; text-underline-offset: 4px; font-size: 14px; }
        .tm-clear-btn:hover { color: var(--tm-coral-deep); }

        .tm-cat-section { margin-top: 36px; margin-bottom: 56px; }
        .tm-cat-section:last-child { margin-bottom: 0; }
        .tm-cat-header { display: flex; align-items: baseline; justify-content: space-between; gap: 20px; flex-wrap: wrap; padding-bottom: 18px; margin-bottom: 22px; border-bottom: 1.5px solid var(--tm-ink); }
        .tm-cat-title { font-family: var(--tm-fd); font-weight: 600; font-size: clamp(32px, 5vw, 52px); line-height: 1.02; letter-spacing: -0.03em; color: var(--tm-ink); margin: 0; }
        .tm-cat-count { font-family: var(--tm-fd); font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: 0.14em; color: var(--tm-ink-3); }
        .tm-cat-blurb { font-size: 15px; color: var(--tm-ink-2); max-width: 620px; margin: 0 0 22px; line-height: 1.55; }

        .tm-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
        .tm-tile { background: var(--tm-paper); border-radius: var(--tm-radius); padding: 24px 22px 22px; box-shadow: var(--tm-shadow); border: 1.5px solid transparent; cursor: pointer; text-align: left; display: flex; flex-direction: column; gap: 12px; min-height: 320px; transition: transform var(--tm-tx-fast), box-shadow var(--tm-tx-fast), border-color var(--tm-tx-fast); position: relative; overflow: hidden; }
        .tm-tile:hover { transform: translateY(-3px); box-shadow: var(--tm-shadow-hover); border-color: var(--tm-coral); }
        .tm-tile:focus-visible { outline: 2px solid var(--tm-coral); outline-offset: 3px; }
        .tm-tile-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; }
        .tm-tile-num { font-family: var(--tm-fd); font-weight: 300; font-style: italic; font-size: 64px; line-height: 0.85; color: var(--tm-coral); letter-spacing: -0.04em; }
        .tm-tile-flag { font-family: var(--tm-fd); font-weight: 700; font-size: 9px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--tm-ink); border: 1px solid var(--tm-ink); padding: 4px 8px; border-radius: var(--tm-radius-pill); text-align: right; white-space: nowrap; }
        .tm-tile-flag-free { background: var(--tm-ink); color: var(--tm-paper); }
        .tm-tile-name { font-family: var(--tm-fd); font-weight: 600; font-size: 22px; line-height: 1.1; letter-spacing: -0.02em; color: var(--tm-ink); }
        .tm-tile-org { font-size: 12px; color: var(--tm-ink-3); font-weight: 500; margin-top: -6px; }
        .tm-tile-blurb { font-size: 13.5px; color: var(--tm-ink-2); line-height: 1.5; flex-grow: 1; }
        .tm-tile-meta { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
        .tm-chip { font-size: 10.5px; font-weight: 600; padding: 4px 9px; border-radius: var(--tm-radius-pill); letter-spacing: 0.04em; }
        .tm-chip-neutral { color: var(--tm-ink-2); border: 1px solid var(--tm-border-strong); }
        .tm-tile-platforms { display: flex; gap: 6px; flex-wrap: wrap; font-size: 10.5px; color: var(--tm-ink-3); text-transform: uppercase; letter-spacing: 0.1em; font-weight: 600; padding-top: 10px; border-top: 1px dashed var(--tm-border); }
        .tm-tile-platform + .tm-tile-platform::before { content: ' · '; color: var(--tm-ink-3); padding: 0 2px; }

        .tm-empty { padding: 80px 20px; text-align: center; background: var(--tm-paper); border-radius: var(--tm-radius); margin-top: 20px; }
        .tm-empty h3 { font-family: var(--tm-fd); font-weight: 600; font-size: 32px; color: var(--tm-ink); margin: 0 0 12px; letter-spacing: -0.02em; }
        .tm-empty p { color: var(--tm-ink-2); margin: 0 0 24px; }

        .tm-coda { padding: 80px 0 100px; text-align: center; }
        .tm-coda-h2 { font-family: var(--tm-fd); font-weight: 400; font-style: italic; font-size: clamp(40px, 6vw, 76px); line-height: 1.02; letter-spacing: -0.03em; margin: 0 auto 32px; color: var(--tm-ink); max-width: 800px; }
        .tm-coda-note { font-size: 13px; color: var(--tm-ink-3); max-width: 560px; margin: 0 auto 32px; padding: 16px 20px; border: 1px dashed var(--tm-border-strong); border-radius: var(--tm-radius-sm); }

        .tm-modal { border: none; padding: 0; border-radius: var(--tm-radius); background: var(--tm-paper); max-width: 640px; width: calc(100% - 32px); max-height: 90vh; overflow: hidden; box-shadow: 0 30px 80px -20px rgba(26, 23, 48, 0.4); color: var(--tm-ink); font-family: var(--tm-fb); }
        .tm-modal::backdrop { background: rgba(26, 23, 48, 0.55); backdrop-filter: blur(3px); }
        .tm-modal[open] { animation: tm-modal-in var(--tm-tx-mid) ease-out; }
        @keyframes tm-modal-in { from { opacity: 0; transform: translateY(12px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .tm-modal-body { padding: 32px 34px 28px; overflow-y: auto; max-height: 90vh; }
        .tm-modal-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 18px; }
        .tm-modal-eyebrow { font-family: var(--tm-fd); font-weight: 400; font-style: italic; font-size: 20px; color: var(--tm-coral); margin-bottom: 4px; }
        .tm-modal-title { font-family: var(--tm-fd); font-weight: 600; font-size: 36px; line-height: 1.02; letter-spacing: -0.025em; color: var(--tm-ink); }
        .tm-modal-org { font-size: 14px; color: var(--tm-ink-3); margin-top: 6px; }
        .tm-modal-close { width: 40px; height: 40px; border-radius: 50%; background: var(--tm-ink); color: var(--tm-paper); font-size: 20px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: background var(--tm-tx-fast); }
        .tm-modal-close:hover { background: var(--tm-coral); }
        .tm-modal-blurb { font-size: 15px; color: var(--tm-ink-2); line-height: 1.55; margin-bottom: 22px; }
        .tm-modal-meta { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px 20px; padding: 18px 0; border-top: 1px solid var(--tm-border); border-bottom: 1px solid var(--tm-border); margin-bottom: 22px; }
        .tm-modal-meta > div span { display: block; font-family: var(--tm-fd); font-weight: 700; font-size: 10px; text-transform: uppercase; letter-spacing: 0.14em; color: var(--tm-ink-3); margin-bottom: 3px; }
        .tm-modal-meta > div strong { font-weight: 600; color: var(--tm-ink); font-size: 14px; word-break: break-word; }
        .tm-modal-meta > div strong a { color: var(--tm-coral); border-bottom: 1px solid transparent; transition: border-color var(--tm-tx-fast); }
        .tm-modal-meta > div strong a:hover { border-color: var(--tm-coral); }
        .tm-modal-section-title { font-family: var(--tm-fd); font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 0.16em; color: var(--tm-coral); margin-bottom: 10px; }
        .tm-modal-feats { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 22px; }
        .tm-modal-feats .tm-chip { font-size: 12px; padding: 5px 11px; }
        .tm-modal-note { padding: 14px 16px; background: var(--tm-lavender-soft); border-radius: var(--tm-radius-sm); font-size: 13px; color: var(--tm-ink-2); margin-bottom: 12px; }
        .tm-modal-note strong { font-family: var(--tm-fd); font-weight: 700; font-size: 10px; text-transform: uppercase; letter-spacing: 0.14em; color: var(--tm-coral); display: block; margin-bottom: 4px; }
        .tm-modal-actions { display: flex; gap: 6px; padding-top: 16px; border-top: 1px solid var(--tm-border); flex-wrap: wrap; }
        .tm-modal-action-btn { font-size: 13px; font-weight: 500; color: var(--tm-ink-2); padding: 8px 14px; border-radius: var(--tm-radius-pill); transition: color var(--tm-tx-fast), background var(--tm-tx-fast); }
        .tm-modal-action-btn:hover { color: var(--tm-coral); background: var(--tm-lavender-soft); }
        .tm-modal-action-primary { background: var(--tm-ink); color: var(--tm-paper); padding: 10px 18px; }
        .tm-modal-action-primary:hover { background: var(--tm-coral); color: var(--tm-paper); }

        @media (prefers-reduced-motion: reduce) {
          .tm-root *, .tm-root *::before, .tm-root *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
          .tm-marquee-track { animation: none; }
        }
        @media (max-width: 1024px) { .tm-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 720px) {
          .tm-grid { grid-template-columns: repeat(2, 1fr); }
          .tm-modal-meta { grid-template-columns: 1fr; }
          .tm-hero { padding: 24px 0 40px; }
          .tm-filter-label { min-width: auto; width: 100%; }
          .tm-modal-body { padding: 24px 22px 20px; }
          .tm-modal-title { font-size: 30px; }
          .tm-tile { min-height: 300px; padding: 20px 18px 18px; }
          .tm-tile-num { font-size: 52px; }
        }
        @media (max-width: 440px) { .tm-grid { grid-template-columns: 1fr; } .tm-tile { min-height: 260px; } }
      `}</style>
    </div>
  );
}
