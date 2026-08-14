'use client';

import { useState } from 'react';

const PDF_URL = '/downloads/fit50-fridge-checklist.pdf';
const PDF_FILENAME = 'FIT50_Fridge_Checklist.pdf';

type Status = 'idle' | 'submitting' | 'ready' | 'error';

interface FridgeChecklistProps {
  onSubmitted?: () => void;
  compact?: boolean;
}

export default function FridgeChecklist({ onSubmitted, compact = false }: FridgeChecklistProps) {
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
      onSubmitted?.();
    } catch {
      setStatus('error');
      setMessage('Network error. Check your connection and try again.');
    }
  };

  return (
    <div>
      <div className="-mx-6 mb-6 bg-cream/30 border-y border-ink/10 overflow-hidden">
        <img
          src="/previews/fit50-fridge-checklist.png"
          alt="Preview of the FIT50 Free Daily Fridge Checklist"
          className="block w-full h-auto"
        />
      </div>

      <p className="inline-block font-body text-caption uppercase tracking-widest text-coral mb-3 px-2 py-1 border border-coral/30 bg-coral/5">
        Free Daily Fridge Checklist
      </p>

      {!compact && (
        <p className="font-display text-base text-ink-soft leading-[1.4] mb-6">
          A printable, nine-discipline daily tracker for the fifty days.
          Drop your email and download the PDF below. You&apos;ll also get
          the occasional note from us — cohort start dates, new tools, and
          whatever we&apos;ve learned. Unsubscribe whenever, no dramas.
        </p>
      )}

      {compact && (
        <p className="font-body text-sm text-ink-soft leading-[1.5] mb-6">
          A printable, nine-discipline daily tracker for the fifty days.
          Drop your email and download the PDF below. You&apos;ll also get
          the occasional note from us — cohort start dates, new tools, and
          whatever we&apos;ve learned. Unsubscribe whenever, no dramas.
        </p>
      )}

      {status === 'ready' ? (
        <div role="status">
          <p className="font-display text-base text-ink leading-[1.4] mb-5">
            {message}
          </p>
          <a
            className="inline-flex items-center gap-3 px-7 py-4 bg-coral-vibrant text-paper font-body text-sm font-semibold tracking-wider uppercase rounded-full transition-colors duration-200 hover:bg-coral-deep"
            href={PDF_URL}
            download={PDF_FILENAME}
          >
            Download {PDF_FILENAME}
            <span aria-hidden="true">↓</span>
          </a>
          <p className="font-body text-caption text-ink-muted mt-4">
            We added you to the FIT50 newsletter. Unsubscribe any time.
          </p>
        </div>
      ) : (
        <form onSubmit={onSubmit} noValidate>
          <label
            className="block font-body text-caption uppercase tracking-widest text-ink-muted mb-2.5"
            htmlFor="fc-email"
          >
            Email
          </label>
          <div className="flex gap-2.5 flex-wrap">
            <input
              id="fc-email"
              className="flex-1 min-w-[280px] px-4 py-3.5 bg-white border-[1.5px] border-ink-deep text-ink-deep text-base outline-none transition-colors duration-200 focus:border-coral-vibrant disabled:opacity-60"
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
              className="px-5 py-3.5 bg-ink-deep text-paper font-body text-sm font-semibold tracking-wider uppercase rounded-full transition-colors duration-200 hover:bg-coral-vibrant disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={status === 'submitting'}
            >
              {status === 'submitting' ? 'Sending…' : 'Send me the checklist'}
            </button>
          </div>
          {status === 'error' && message && (
            <p
              className="font-body text-sm text-coral-deep mt-3"
              role="alert"
            >
              {message}
            </p>
          )}
          <p className="font-body text-caption text-ink-muted mt-4">
            We add your email to the FIT50 newsletter. Unsubscribe any time.
          </p>
        </form>
      )}
    </div>
  );
}