'use client';

import { useState } from 'react';
import Section from './Section';
import { createClient, isSupabaseConfigured } from '@/lib/supabase';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setSubmitting(true);
    setError(null);

    if (!isSupabaseConfigured) {
      setSent(true);
      setEmail('');
      setSubmitting(false);
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      setSent(true);
      setEmail('');
      setSubmitting(false);
      return;
    }

    const { error: err } = await supabase
      .from('newsletter_subscribers')
      .upsert({ email: email.toLowerCase() }, { onConflict: 'email' });

    setSubmitting(false);

    if (err) {
      setError('Could not subscribe. Try again later.');
      return;
    }

    setSent(true);
    setEmail('');
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
          Field notes from the 50 days: what worked, what didn&apos;t, what
          we&apos;re shipping next.
        </p>

        {sent ? (
          <p className="font-body text-base text-ink/70">
            ✓ You&apos;re on the list. We&apos;ll be in touch.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="max-w-md mx-auto">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                required
                disabled={submitting}
                className="flex-1 px-4 py-3 bg-white border border-ink/30 text-ink placeholder:text-ink/30 font-body focus:border-coral outline-none disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={submitting}
                className="px-7 py-3 bg-ink text-paper font-body text-caption uppercase hover:bg-coral transition-colors duration-200 disabled:opacity-50"
              >
                {submitting ? 'Sending…' : 'Subscribe'}
              </button>
            </div>
            {error && (
              <p className="font-body text-sm text-coral mt-3">{error}</p>
            )}
          </form>
        )}
      </div>
    </Section>
  );
}