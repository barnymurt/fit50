'use client';

import { useState } from 'react';
import Section from './Section';
import { useAuth } from '@/contexts/AuthContext';

export default function Footer() {
  const { user, signInWithMagicLink } = useAuth();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setSubmitting(true);
    setError(null);
    const { error: err } = await signInWithMagicLink(email);
    setSubmitting(false);

    if (err) {
      setError(err);
      return;
    }

    setSent(true);
    setEmail('');
  };

  const isSignedIn = !!user || sent;

  return (
    <Section
      as="footer"
      className="text-paper py-20 md:py-24"
      contained
      style={{ backgroundColor: '#1A1A1A' }}
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
        <div className="md:col-span-5">
          <h2 className="font-display text-display-2 text-paper leading-none">
            FIT50
          </h2>
          <p className="font-body text-paper/50 mt-4 max-w-sm">
            50 days. 9 habits. 1 fresh start.
          </p>
        </div>

        <div className="md:col-span-6 md:col-start-7">
          {isSignedIn ? (
            <p className="font-body text-paper/70">
              {sent
                ? '✓ Sign-in link sent. Check your email.'
                : '✓ You\'re signed in. Your progress is saved.'}
            </p>
          ) : (
            <form onSubmit={handleSubmit}>
              <label
                htmlFor="footer-email"
                className="font-body text-caption uppercase text-paper/50 block mb-3"
              >
                The newsletter
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  id="footer-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  required
                  disabled={submitting}
                  className="flex-1 px-4 py-3 bg-transparent border border-paper/30 text-paper placeholder:text-paper/30 font-body focus:border-paper outline-none disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-7 py-3 bg-paper text-ink font-body text-caption uppercase hover:bg-coral hover:text-paper transition-colors duration-200 disabled:opacity-50"
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
      </div>

      <div className="pt-8 border-t border-paper/15 flex flex-col md:flex-row md:items-center gap-4">
        <nav className="flex flex-wrap gap-x-8 gap-y-2">
          {['Rules', 'Workouts', 'Tracker', 'FAQ'].map((label) => (
            <a
              key={label}
              href={`#${label.toLowerCase()}`}
              className="font-body text-caption uppercase text-paper/60 hover:text-paper transition-colors"
            >
              {label}
            </a>
          ))}
        </nav>

        {/* Social links (Instagram, Twitter, Contact) removed for now —
            accounts aren't set up and Contact has no form yet.
            Re-enable when the socials are live or a contact form exists. */}
      </div>

      <p className="mt-10 font-body text-xs text-paper/40">
        © 2026 FIT50. All rights reserved.
      </p>
    </Section>
  );
}
