'use client';

import { useState } from 'react';

export interface EmailGateConfig {
  pdfSlug: 'fridge-checklist' | 'workout';
  pdfFilename: string;
  previewImage?: string;
  form: {
    eyebrow: string;
    title: string;
    lede: string;
    buttonText: string;
    buttonLoadingText?: string;
  };
  success: {
    eyebrow: string;
    heading: string;
    body1: string;
    body2?: string;
    ctaText: string;
    ctaHref: string;
    textLink: string;
    textLinkHref: string;
  };
  newsletterNote: string;
}

interface EmailGateProps {
  config: EmailGateConfig;
}

type Status = 'idle' | 'submitting' | 'ready' | 'error';

export default function EmailGate({ config }: EmailGateProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');

  const triggerDownload = () => {
    const link = document.createElement('a');
    link.href = `/api/download/${config.pdfSlug}`;
    link.download = config.pdfFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const closeSelf = () => {
    window.dispatchEvent(new CustomEvent('close-active-modal'));
  };

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
      triggerDownload();
    } catch {
      setStatus('error');
      setMessage('Network error. Check your connection and try again.');
    }
  };

  return (
    <div>
      {config.previewImage && (
        <div className="-mx-6 mb-6 bg-cream/30 border-y border-ink/10 overflow-hidden">
          <img
            src={config.previewImage}
            alt={`Preview of ${config.form.title}`}
            className="block w-full h-auto"
          />
        </div>
      )}

      <p className="inline-block font-body text-caption uppercase tracking-widest text-coral mb-3 px-2 py-1 border border-coral/30 bg-coral/5">
        {config.form.eyebrow}
      </p>

      {status === 'ready' ? (
        <div role="status" className="-mx-6 -mb-6 p-6 bg-paper">
          <p className="font-body text-caption uppercase tracking-widest text-coral mb-3">
            {config.success.eyebrow}
          </p>
          <h3 className="font-display text-h1 text-ink leading-[1.05] mb-4">
            {config.success.heading}
          </h3>
          <p className="font-display text-base text-ink-soft leading-[1.4] mb-6">
            {config.success.body1}
          </p>
          {config.success.body2 && (
            <p className="font-display text-base text-ink-soft leading-[1.4] mb-8">
              {config.success.body2}
            </p>
          )}
          <a
            href={config.success.ctaHref}
            onClick={closeSelf}
            className="inline-flex items-center justify-center w-full px-6 py-4 bg-coral-vibrant text-paper font-body text-sm font-semibold tracking-wider uppercase rounded-full transition-colors duration-200 hover:bg-coral-deep mb-4"
          >
            {config.success.ctaText} →
          </a>
          <a
            href={config.success.textLinkHref}
            onClick={closeSelf}
            className="block text-center font-body text-caption uppercase tracking-widest text-ink/60 hover:text-coral underline underline-offset-4 decoration-ink/20 hover:decoration-coral transition-colors"
          >
            {config.success.textLink}
          </a>
        </div>
      ) : (
        <>
          <p className="font-body text-sm text-ink-soft leading-[1.5] mb-6">
            {config.form.lede}
          </p>
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
                {status === 'submitting'
                  ? (config.form.buttonLoadingText ?? 'Sending…')
                  : config.form.buttonText}
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
              {config.newsletterNote}
            </p>
          </form>
        </>
      )}
    </div>
  );
}