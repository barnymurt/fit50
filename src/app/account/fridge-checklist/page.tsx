'use client';

import localFont from 'next/font/local';
import FridgeChecklist from '@/components/FridgeChecklist';

const fraunces = localFont({
  display: 'swap',
  variable: '--fc-font-display',
  src: [
    { path: '../../../../node_modules/@fontsource/fraunces/files/fraunces-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: '../../../../node_modules/@fontsource/fraunces/files/fraunces-latin-400-italic.woff2', weight: '400', style: 'italic' },
    { path: '../../../../node_modules/@fontsource/fraunces/files/fraunces-latin-600-normal.woff2', weight: '600', style: 'normal' },
    { path: '../../../../node_modules/@fontsource/fraunces/files/fraunces-latin-700-normal.woff2', weight: '700', style: 'normal' },
  ],
});

const inter = localFont({
  display: 'swap',
  variable: '--fc-font-body',
  src: [
    { path: '../../../../node_modules/@fontsource/inter/files/inter-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: '../../../../node_modules/@fontsource/inter/files/inter-latin-500-normal.woff2', weight: '500', style: 'normal' },
    { path: '../../../../node_modules/@fontsource/inter/files/inter-latin-600-normal.woff2', weight: '600', style: 'normal' },
  ],
});

export default function FridgeChecklistPage() {
  return (
    <div className={`fc-root ${fraunces.variable} ${inter.variable}`}>
      <section className="fc-hero">
        <div className="fc-wrap">
          <p className="fc-eyebrow">On the house</p>
          <h1 className="fc-title">Fridge checklist.</h1>
          <FridgeChecklist />
        </div>
      </section>

      <style jsx>{`
        .fc-root {
          --fc-fd: var(--fc-font-display, 'Fraunces', Georgia, serif);
          --fc-fb: var(--fc-font-body, 'Inter', system-ui, sans-serif);
          background: var(--color-paper);
          color: var(--ink-deep);
          font-family: var(--fc-fb);
          font-size: 16px;
          line-height: 1.5;
          min-height: 100vh;
          -webkit-font-smoothing: antialiased;
        }

        :where(.fc-root *) { box-sizing: border-box; }
        :where(.fc-root button) {
          font: inherit; cursor: pointer; border: none; background: none;
          color: inherit; padding: 0;
        }
        :where(.fc-root input) {
          font: inherit; color: inherit;
        }
        :where(.fc-root a) { color: inherit; text-decoration: none; }

        .fc-hero { padding: 96px 0 80px; }
        .fc-wrap { max-width: 720px; margin: 0 auto; padding: 0 24px; }

        .fc-eyebrow {
          font-family: var(--fc-fb);
          font-size: 13px;
          font-weight: 500;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--coral-vibrant);
          margin: 0 0 18px;
        }
        .fc-eyebrow::before {
          content: '';
          display: inline-block;
          width: 32px;
          height: 1.5px;
          background: var(--coral-vibrant);
          vertical-align: middle;
          margin-right: 12px;
        }

        .fc-title {
          font-family: var(--fc-fd);
          font-weight: 400;
          font-size: clamp(48px, 8vw, 88px);
          line-height: 0.95;
          letter-spacing: -0.015em;
          color: var(--ink-deep);
          margin: 0 0 22px;
        }

        @media (max-width: 540px) {
          .fc-hero { padding: 64px 0 56px; }
        }
      `}</style>
    </div>
  );
}