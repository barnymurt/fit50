'use client';

import { useState } from 'react';
import Section from './Section';

type Status = 'idle' | 'submitting' | 'ready' | 'error';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      setStatus('error');
      setMessage('Enter an email to subscribe.');
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
        setMessage('Could not subscribe. Try again later.');
        return;
      }

      setStatus('ready');
      setMessage("You're on the list. We'll be in touch.");
    } catch {
      setStatus('error');
      setMessage('Network error. Check your connection and try again.');
    }
  };

  return (
    <Section
      id="newsletter"
      tone="paper"
      className="text-ink py-section"
    >
      <div className="max-w-2xl mx-auto px-6 md:px-10 text-center">
        <p className="font-body text-caption uppercase text-coral mb-4">
          The newsletter
        </p>
        <h2 className="font-display text-h1 text-ink mb-4 leading-[1.1]">
          One email a fortnight. Useful, never noise.
        </h2>
        <p className="font-display text-base text-ink/70 mb-8 max-w-md mx-auto">
          Field notes from the 50 days: what worked, what didn&apos;t.
        </p>

        {status === 'ready' ? (
          <p className="font-body text-base text-ink/70" role="status">
            ✓ {message}
          </p>
        ) : (
          <form onSubmit={onSubmit} noValidate className="max-w-md mx-auto">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (status === 'error') setStatus('idle');
                }}
                placeholder="you@email.com"
                required
                disabled={status === 'submitting'}
                className="flex-1 px-4 py-3 bg-white border border-ink/30 text-ink placeholder:text-ink/30 font-body focus:border-coral outline-none disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={status === 'submitting'}
                className="px-7 py-3 bg-ink text-paper font-body text-caption uppercase hover:bg-coral transition-colors duration-200 disabled:opacity-50"
              >
                {status === 'submitting' ? 'Sending…' : 'Subscribe'}
              </button>
            </div>
            {status === 'error' && message && (
              <p className="font-body text-sm text-coral mt-3" role="alert">
                {message}
              </p>
            )}
          </form>
        )}
      </div>
    </Section>
  );
}