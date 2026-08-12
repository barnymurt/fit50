'use client';

import Link from 'next/link';
import { useState } from 'react';
import Marquee from './Marquee';
import { useAuth } from '@/contexts/AuthContext';

export interface SixFeaturesItem {
  title: string;
  description: string;
}

export const SIX_FEATURES: SixFeaturesItem[] = [
  {
    title: 'Task completion tracker',
    description: 'Tap to mark each of the nine daily habits. Your streak builds automatically.',
  },
  {
    title: 'Streak protection',
    description: 'One free pass a week. Miss a day and the streak holds. Each save shows up as a 🍌 on your certificate.',
  },
  {
    title: 'Water tracker tool',
    description: 'Tap to log each glass. Saved to your account daily, target built in.',
  },
  {
    title: 'Detailed macro food tracker',
    description: 'Search 1000+ foods, log portions, tag meals. Totals fill up against your targets.',
  },
  {
    title: 'Multi-purpose timer',
    description: 'Built-in timer for reading, meditation, focus blocks. Presets included.',
  },
  {
    title: 'To-do planning board',
    description: 'Plan the 50 days with kanban columns. Drag tasks between To do, In progress, Done.',
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
    const checkoutUrl = process.env.NEXT_PUBLIC_CREEM_CHECKOUT_URL;
    if (!checkoutUrl) {
      setError('Checkout not configured. Please contact support.');
      setCheckoutLoading(false);
      return;
    }
    const url = new URL(checkoutUrl);
    if (user?.email) url.searchParams.set('prefilled_email', user.email);
    window.location.href = url.toString();
  };

  const isPremium = !loading && user && profile?.is_premium;

  return (
    <>
      {/* Hero */}
      <section
        id={id}
        className="relative pt-40 md:pt-56 pb-section overflow-hidden"
        style={{ backgroundColor: '#4A9B9B' }}
      >
        <div className="absolute top-0 left-0 right-0 h-32 md:h-52 overflow-hidden pointer-events-none z-0 flex items-center">
          <Marquee
            text="BUY US A CANECA · €5.99 · ONE-TIME · YOURS FOREVER"
            separator="✦"
            speed={200}
            textClassName="text-paper/30"
          />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-6 md:px-10 text-center">
          <p className="font-body text-caption uppercase text-coral mb-6">
            Helpful tools
          </p>
          <h1 className="font-display text-display-1 text-paper mb-8 leading-[0.95]">
            Buy us a beer.
          </h1>
          <p className="font-display text-h2 text-paper/80 mb-12 max-w-2xl mx-auto leading-tight">
            We&apos;ll give you the tools to not need one for 50 days.
          </p>

          {isPremium ? (
            <>
              <p className="font-body text-caption uppercase tracking-widest text-paper/70 mb-3">
                You&apos;re in
              </p>
              <Link
                href="/account"
                className="inline-flex items-center justify-center bg-paper text-ink font-body text-sm px-12 py-5 uppercase tracking-wider hover:bg-cream/80 transition-colors"
              >
                Open your account
              </Link>
            </>
          ) : (
            <>
              <div className="inline-flex items-baseline gap-3 mb-4">
                <span className="font-display text-display-1 text-coral leading-none">
                  €5.99
                </span>
                <span className="font-body text-caption uppercase text-paper/70">
                  one-time
                </span>
              </div>
              <p className="font-body text-sm text-paper/70 mb-8">
                The price of a caneca · secure checkout via Creem · no subscription · no auto-renew
              </p>
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
              {!user && (
                <p className="font-body text-xs text-paper/70 mt-4 max-w-md mx-auto">
                  Pay with the same email you&apos;ll use to sign in, and your premium unlocks automatically.
                </p>
              )}
            </>
          )}
        </div>
      </section>

      {/* The math */}
      <section className="relative py-section bg-paper overflow-hidden">
        <div className="max-w-4xl mx-auto px-6 md:px-10">
          <p className="font-body text-caption uppercase text-coral mb-4">
            The math
          </p>
          <h2 className="font-display text-display-2 text-ink mb-12">
            One of the rules is no alcohol.
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div>
              <p className="font-display text-display-2 text-coral leading-none">
                €6
              </p>
              <p className="font-body text-sm text-ink/60 mt-2">
                average caneca
              </p>
            </div>
            <div>
              <p className="font-display text-display-2 text-coral leading-none">
                50
              </p>
              <p className="font-body text-sm text-ink/60 mt-2">
                days in the challenge
              </p>
            </div>
            <div>
              <p className="font-display text-display-2 text-coral leading-none">
                €300
              </p>
              <p className="font-body text-sm text-ink/60 mt-2">
                you keep (if you would have had one drink a day)
              </p>
            </div>
          </div>

          <p className="font-display text-h2 text-ink max-w-2xl">
            €5.99 buys the tools. The 50 days pays for them many times over.
          </p>
        </div>
      </section>

      {/* What unlocks — the helpful tools */}
      <section className="relative pt-section pb-section bg-paper overflow-hidden">
        <div className="max-w-5xl mx-auto px-6 md:px-10">
          <div className="absolute top-0 left-0 right-0 h-24 md:h-40 overflow-hidden pointer-events-none z-0 flex items-center">
            <Marquee
              text="HELPFUL TOOLS · BUY US A CANECA · €5.99 · ONE-TIME · YOURS FOREVER"
              separator="✦"
              speed={200}
              textClassName="text-ink/10"
            />
          </div>
          <div className="relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-12 pt-24 md:pt-32">
              <div className="md:col-span-7">
                <p className="font-body text-caption uppercase tracking-widest text-ink/50 mb-3">
                  Sign up
                </p>
                <h2 className="font-display text-display-2 text-ink leading-[0.95] mb-6">
                  Sign up for helpful tools.
                </h2>
                <p className="font-body text-base text-ink/70 max-w-xl">
                  Buy us a beer for a handful of helpful tools. €5.99 one-time, yours forever.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 border-t border-l border-ink/20 mb-12">
              {SIX_FEATURES.map((feature, i) => (
                <div
                  key={feature.title}
                  className={`p-6 md:p-8 ${
                    i % 2 === 0 ? 'border-r border-b border-ink/20' : 'border-b border-ink/20'
                  }`}
                >
                  <h3 className="font-display text-h2 text-ink mb-2">
                    {feature.title}
                  </h3>
                  <p className="font-body text-sm text-ink/70">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Free extras */}
      <section className="relative py-section bg-paper overflow-hidden">
        <div className="max-w-3xl mx-auto px-6 md:px-10 text-center">
          <p className="font-body text-caption uppercase tracking-widest text-ink/50 mb-4">
            Free for everyone
          </p>
          <p className="font-body text-base text-ink/70 mb-6">
            The curated toolkit — quit resources, macro calculator, meditation apps, non-alcoholic recipes, sleep and step tracking — is open to everyone, no sign-up needed.
          </p>
          <a
            href="/toolkit"
            className="inline-flex items-center gap-2 font-body text-caption uppercase tracking-wider text-coral hover:text-ink transition-colors"
          >
            Open the toolkit <span>→</span>
          </a>
        </div>
      </section>
    </>
  );
}