'use client';

import { useState } from 'react';
import { Fraunces, Inter } from 'next/font/google';

const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['300', '400', '600', '700', '900'],
  style: ['normal', 'italic'],
  variable: '--fc-font-display',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--fc-font-body',
  display: 'swap',
});

const PDF_URL = '/downloads/fit50-fridge-checklist.pdf';
const PDF_FILENAME = 'FIT50_Fridge_Checklist.pdf';

type Status = 'idle' | 'submitting' | 'ready' | 'error';

export default function FridgeChecklistPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      setStatus('error');
      setMessage('Enter an email so we can send the download link.');
      return;
    }

    setStatus('submitting');
    setMessage('');

    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: trimmed }),
      });

      if (!res.ok) {
        setStatus('error');
        setMessage('Something went wrong. Try again in a moment.');
        return;
      }

      setStatus('ready');
      setMessage("Saved. Download below — it's a one-page PDF.");
    } catch {
      setStatus('error');
      setMessage('Network error. Check your connection and try again.');
    }
  };

  return (
    <div className={`fc-root ${fraunces.variable} ${inter.variable}`}>
      <section className="fc-hero">
        <div className="fc-wrap">
          <p className="fc-eyebrow">On the house</p>
          <h1 className="fc-title">Fridge checklist.</h1>
          <p className="fc-lede">
            A printable checklist of what to keep on hand during the 50 days.
            One page, easy to tick off, easy to stick on the fridge.
          </p>

          {status === 'ready' ? (
            <div className="fc-success" role="status">
              <p className="fc-success-msg">{message}</p>
              <a
                className="fc-download"
                href={PDF_URL}
                download={PDF_FILENAME}
              >
                Download {PDF_FILENAME}
                <span aria-hidden="true">↓</span>
              </a>
              <p className="fc-fineprint">
                We added you to the FIT50 newsletter. Unsubscribe any time.
              </p>
            </div>
          ) : (
            <form className="fc-form" onSubmit={onSubmit} noValidate>
              <label className="fc-label" htmlFor="fc-email">
                Email
              </label>
              <div className="fc-input-row">
                <input
                  id="fc-email"
                  className="fc-input"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (status === 'error') setStatus('idle');
                  }}
                  disabled={status === 'submitting'}
                  required
                />
                <button
                  type="submit"
                  className="fc-btn"
                  disabled={status === 'submitting'}
                >
                  {status === 'submitting' ? 'Sending…' : 'Send me the PDF'}
                </button>
              </div>
              {status === 'error' && message && (
                <p className="fc-error" role="alert">
                  {message}
                </p>
              )}
              <p className="fc-fineprint">
                We add your email to the FIT50 newsletter. Unsubscribe any time.
              </p>
            </form>
          )}
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

        .fc-hero {
          padding: 96px 0 80px;
        }
        .fc-wrap {
          max-width: 720px;
          margin: 0 auto;
          padding: 0 24px;
        }

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

        .fc-lede {
          font-family: var(--fc-fd);
          font-weight: 400;
          font-size: 22px;
          line-height: 1.4;
          color: var(--ink-soft);
          margin: 0 0 44px;
          max-width: 56ch;
        }

        .fc-form,
        .fc-success {
          border-top: 1.5px solid var(--ink-deep);
          border-bottom: 1.5px solid var(--ink-deep);
          padding: 28px 0 26px;
        }

        .fc-label {
          display: block;
          font-family: var(--fc-fb);
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--ink-muted);
          margin-bottom: 10px;
        }

        .fc-input-row {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .fc-input {
          flex: 1 1 280px;
          min-width: 0;
          padding: 14px 16px;
          background: #fff;
          border: 1.5px solid var(--ink-deep);
          border-radius: 0;
          font-size: 16px;
          color: var(--ink-deep);
          outline: none;
          transition: border-color 160ms cubic-bezier(0.4, 0, 0.2, 1);
        }
        .fc-input:focus {
          border-color: var(--coral-vibrant);
        }
        .fc-input:disabled {
          opacity: 0.6;
        }

        .fc-btn {
          padding: 14px 22px;
          background: var(--ink-deep);
          color: var(--color-paper);
          font-family: var(--fc-fb);
          font-size: 15px;
          font-weight: 600;
          letter-spacing: 0.04em;
          border-radius: 999px;
          transition: background 160ms cubic-bezier(0.4, 0, 0.2, 1);
        }
        .fc-btn:hover:not(:disabled) {
          background: var(--coral-vibrant);
        }
        .fc-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .fc-error {
          margin: 12px 0 0;
          font-size: 14px;
          color: var(--coral-deep);
        }

        .fc-fineprint {
          margin: 16px 0 0;
          font-size: 13px;
          color: var(--ink-muted);
        }

        .fc-success-msg {
          font-family: var(--fc-fd);
          font-weight: 400;
          font-size: 22px;
          line-height: 1.4;
          color: var(--ink-deep);
          margin: 0 0 22px;
        }

        .fc-download {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          padding: 16px 28px;
          background: var(--coral-vibrant);
          color: #fff;
          font-family: var(--fc-fb);
          font-size: 16px;
          font-weight: 600;
          letter-spacing: 0.04em;
          border-radius: 999px;
          transition: background 160ms cubic-bezier(0.4, 0, 0.2, 1);
        }
        .fc-download:hover {
          background: var(--coral-deep);
        }

        @media (max-width: 540px) {
          .fc-hero { padding: 64px 0 56px; }
          .fc-input-row { flex-direction: column; }
          .fc-btn { width: 100%; }
          .fc-download { width: 100%; justify-content: center; }
        }
      `}</style>
    </div>
  );
}