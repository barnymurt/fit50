'use client';

import { useState } from 'react';
import Link from 'next/link';
import Marquee from './Marquee';
import { useAuth } from '@/contexts/AuthContext';

export interface SixFeaturesItem {
  title: string;
  description: string;
}

export const SIX_FEATURES: SixFeaturesItem[] = [
  {
    title: 'Task tracker',
    description: 'Tap to mark the nine daily habits; streak builds automatically.',
  },
  {
    title: 'Streak protection',
    description:
      'One free pass a week. Miss a day and the streak holds. Each save shows up as a 🍌 on your certificate.',
  },
  {
    title: 'Water tracker',
    description: 'Tap to log each glass, target built in.',
  },
  {
    title: 'Macro food tracker',
    description:
      'Search 1,000+ foods, log portions, tag meals, totals against your targets.',
  },
  {
    title: 'Multi-purpose timer',
    description: 'Reading, meditation, focus blocks, presets included.',
  },
  {
    title: 'Kanban board',
    description:
      'Plan the 50 days across To do / In progress / Done.',
  },
];

export default function SixFeatures({
  id,
}: {
  id?: string;
}) {
  const { user, profile, loading } = useAuth();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async () => {
    setCheckoutLoading(true);
    setError(null);
    const checkoutUrl = process.env.NEXT_PUBLIC_STRIPE_CHECKOUT_URL;
    if (!checkoutUrl) {
      setError(
        'Stripe checkout is not configured yet. We are switching over from Creem — check back soon.'
      );
      setCheckoutLoading(false);
      return;
    }
    const url = new URL(checkoutUrl);
    if (user?.email) url.searchParams.set('prefilled_email', user.email);
    window.location.href = url.toString();
  };

  const isPremium = !loading && user && profile?.is_premium;

  return (
    <section
      id={id}
      className="relative pt-40 md:pt-56 pb-section overflow-hidden"
      style={{ backgroundColor: '#4A9B9B' }}
    >
      <div className="absolute top-0 left-0 right-0 h-32 md:h-52 overflow-hidden pointer-events-none z-0 flex items-center">
        <Marquee
          text="Buy us a Caneca - Keep the tools forever"
          separator="✦"
          speed={200}
          textClassName="text-paper/30"
        />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 md:px-10">
        {/* Hero */}
        <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
          <p className="font-body text-caption uppercase text-coral mb-6">
            Helpful tools
          </p>
          <h1 className="font-display text-display-1 text-paper mb-6 leading-[0.95]">
            Buy us a beer.
          </h1>
          <p className="font-display text-h2 text-paper/85 mb-10 leading-tight max-w-2xl mx-auto">
            Walk away with six tools you could save yourself €300.
          </p>
          <p className="font-body text-caption uppercase tracking-widest text-paper/65 mb-2">
            One payment, yours forever, no subscription.
          </p>
        </div>

        {/* The math */}
        <div className="mb-12 md:mb-16 border-t border-b border-paper/20 py-10 md:py-12 text-center">
          <p className="font-body text-caption uppercase tracking-widest text-coral mb-4">
            The math
          </p>
          <p className="font-display text-h2 md:text-h1 text-paper leading-tight max-w-3xl mx-auto">
            A caneca is ~€6. Skip one a day for 50 days and you keep €300 — €5.99
            buys the tools, the challenge pays for them.
          </p>
          <div className="grid grid-cols-3 gap-4 md:gap-8 mt-8 max-w-2xl mx-auto">
            <div>
              <p className="font-display text-h1 md:text-display-1 text-coral leading-none tabular-nums">
                €6
              </p>
              <p className="font-body text-caption uppercase tracking-widest text-paper/65 mt-2">
                caneca
              </p>
            </div>
            <div>
              <p className="font-display text-h1 md:text-display-1 text-coral leading-none tabular-nums">
                50
              </p>
              <p className="font-body text-caption uppercase tracking-widest text-paper/65 mt-2">
                days
              </p>
            </div>
            <div>
              <p className="font-display text-h1 md:text-display-1 text-coral leading-none tabular-nums">
                €300
              </p>
              <p className="font-body text-caption uppercase tracking-widest text-paper/65 mt-2">
                you keep
              </p>
            </div>
          </div>
        </div>

        {/* What you get */}
        <div className="mb-12 md:mb-16">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-8">
            <div className="md:col-span-7">
              <p className="font-body text-caption uppercase tracking-widest text-paper/65 mb-3">
                What you get
              </p>
              <h2 className="font-display text-display-2 text-paper leading-[0.95]">
                Six tools to walk into the challenge.
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 border-t border-l border-paper/20">
            {SIX_FEATURES.map((feature, i) => (
              <div
                key={feature.title}
                className={`p-6 md:p-8 ${
                  i % 2 === 0 ? 'border-r border-b border-paper/20' : 'border-b border-paper/20'
                }`}
              >
                <h3 className="font-display text-h2 text-paper mb-2">
                  {feature.title}
                </h3>
                <p className="font-body text-sm text-paper/75">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        {isPremium ? (
          <div className="text-center max-w-2xl mx-auto border border-paper/25 bg-paper/5 p-8">
            <p className="font-body text-caption uppercase tracking-widest text-coral mb-3">
              You&apos;re in
            </p>
            <h3 className="font-display text-h2 text-paper mb-4">
              All helpful tools are active.
            </h3>
            <p className="font-body text-base text-paper/75 mb-6">
              Thank you for the caneca.
            </p>
            <Link
              href="/account"
              className="inline-flex items-center justify-center bg-paper text-ink font-body text-sm px-10 py-4 uppercase tracking-wider hover:bg-cream/80 transition-colors"
            >
              Open your account
            </Link>
          </div>
        ) : (
          <div className="text-center max-w-2xl mx-auto">
            {error && (
              <p className="font-body text-sm text-coral mb-4">{error}</p>
            )}
            <button
              onClick={handleCheckout}
              disabled={checkoutLoading}
              className="inline-flex items-center justify-center bg-coral text-paper font-body text-sm px-12 py-5 uppercase tracking-wider hover:bg-coral/85 transition-colors disabled:opacity-50"
            >
              {checkoutLoading ? 'Opening checkout…' : 'Sign up for €5.99'}
            </button>
            <p className="font-body text-caption uppercase tracking-widest text-paper/65 mt-4">
              The price of a caneca · secure checkout via Stripe
            </p>
          </div>
        )}
      </div>
    </section>
  );
}