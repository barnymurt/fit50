'use client';

import { useState } from 'react';
import Section from './Section';
import { useEmailCapture } from './EmailCaptureContext';

export default function Footer() {
  const { isCaptured, captureEmail } = useEmailCapture();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      captureEmail(email);
      setSubmitted(true);
      setEmail('');
    }
  };

  return (
    <Section as="footer" tone="ink" className="py-20 md:py-24" contained>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
        <div className="md:col-span-5">
          <h2 className="font-display text-display-2 text-paper leading-none">
            FIT50
          </h2>
          <p className="font-body text-paper/50 mt-4 max-w-sm">
            50 days, 9 habits, 1 life.
          </p>
        </div>

        <div className="md:col-span-6 md:col-start-7">
          {isCaptured || submitted ? (
            <p className="font-body text-paper/70">
              You&apos;re on the list. We&apos;ll be in touch.
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
                  className="flex-1 px-4 py-3 bg-transparent border border-paper/30 text-paper placeholder:text-paper/30 font-body focus:border-paper outline-none"
                />
                <button
                  type="submit"
                  className="px-7 py-3 bg-paper text-ink font-body text-caption uppercase hover:bg-coral hover:text-paper transition-colors duration-200"
                >
                  Subscribe
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      <div className="pt-8 border-t border-paper/15 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
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

        <div className="flex items-center gap-6">
          <a href="#" className="font-body text-caption uppercase text-paper/60 hover:text-paper transition-colors">
            Instagram
          </a>
          <a href="#" className="font-body text-caption uppercase text-paper/60 hover:text-paper transition-colors">
            Twitter
          </a>
          <a href="#" className="font-body text-caption uppercase text-paper/60 hover:text-paper transition-colors">
            Contact
          </a>
        </div>
      </div>

      <p className="mt-10 font-body text-xs text-paper/40">
        © 2026 FIT50. All rights reserved.
      </p>
    </Section>
  );
}
