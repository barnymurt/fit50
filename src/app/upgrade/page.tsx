'use client';

import { useState } from 'react';
import Section from '@/components/Section';
import { useAuth } from '@/contexts/AuthContext';

const PREMIUM_FEATURES = [
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

export default function UpgradePage() {
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

  if (!loading && user && profile?.is_premium) {
    return (
      <Section className="relative py-section" tone="paper" contained>
        <div className="max-w-2xl mx-auto text-center">
          <p className="font-body text-caption uppercase text-coral mb-3">Premium</p>
          <h1 className="font-display text-display-2 text-ink mb-6">
            You&apos;re already in.
          </h1>
          <p className="font-body text-lg text-ink/70 mb-8">
            All helpful tools are active. Thank you for the caneca.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="/account"
              className="inline-flex items-center justify-center bg-ink text-paper font-body text-sm px-10 py-4 uppercase tracking-wider hover:bg-ink/85 transition-colors"
            >
              Open your account
            </a>
          </div>
        </div>
      </Section>
    );
  }

  return (
    <>
      {/* Hero */}
      <Section
        tone="paper"
        className="relative pt-40 md:pt-56 pb-section overflow-hidden"
        contained
      >
        <div className="absolute top-0 left-0 right-0 h-32 md:h-52 overflow-hidden pointer-events-none z-0 flex items-center">
          <div className="font-marquee text-paper/10 leading-none uppercase whitespace-nowrap"
               style={{ fontSize: 'clamp(5rem, 13vw, 12rem)' }}>
            <span className="px-6">SIGN UP · BUY US A CANECA · GET THE TOOLS · </span>
            <span className="px-6">SIGN UP · BUY US A CANECA · GET THE TOOLS · </span>
          </div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <p className="font-body text-caption uppercase text-coral mb-6">
            Helpful tools
          </p>
          <h1 className="font-display text-display-1 text-ink mb-8 leading-[0.95]">
            Buy us a beer.
          </h1>
          <p className="font-display text-h2 text-ink/80 mb-12 max-w-2xl mx-auto leading-tight">
            We&apos;ll give you the tools to not need one for 50 days.
          </p>

          <div className="inline-flex items-baseline gap-3 mb-4">
            <span className="font-display text-display-1 text-coral leading-none">€5.99</span>
            <span className="font-body text-caption uppercase text-ink/60">one-time</span>
          </div>
          <p className="font-body text-sm text-ink/50">
            The price of a caneca · secure checkout via Creem · no subscription · no auto-renew
          </p>
        </div>
      </Section>

      {/* The math */}
      <Section tone="ink" className="relative py-section" contained>
        <div className="max-w-4xl mx-auto">
          <p className="font-body text-caption uppercase text-coral mb-4">
            The math
          </p>
          <h2 className="font-display text-display-2 text-paper mb-12">
            One of the rules is no alcohol.
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div>
              <p className="font-display text-display-2 text-coral leading-none">€6</p>
              <p className="font-body text-sm text-paper/60 mt-2">
                average caneca
              </p>
            </div>
            <div>
              <p className="font-display text-display-2 text-coral leading-none">50</p>
              <p className="font-body text-sm text-paper/60 mt-2">
                days in the challenge
              </p>
            </div>
            <div>
              <p className="font-display text-display-2 text-coral leading-none">€300</p>
              <p className="font-body text-sm text-paper/60 mt-2">
                you keep (if you would have had one drink a day)
              </p>
            </div>
          </div>

          <p className="font-display text-h2 text-paper max-w-2xl">
            €5.99 buys the tools. The 50 days pays for them many times over.
          </p>
        </div>
      </Section>

      {/* What you get — the helpful tools */}
      <Section tone="paper" className="relative py-section" contained>
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-12">
            <div className="md:col-span-5">
              <p className="font-body text-caption uppercase text-ink/50 mb-3">
                What unlocks
              </p>
              <h2 className="font-display text-display-2 text-ink">
                Six tools.
              </h2>
              <p className="font-display text-h2 text-ink/80 mt-4 leading-tight">
                One price. All yours.
              </p>
            </div>
            <div className="md:col-span-6 md:col-start-7 flex items-end">
              <p className="font-body text-lg text-ink/70">
                Everything that makes FIT50 easier to actually finish — built in, no extra apps, no setup.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 border-t border-l border-ink/10">
            {PREMIUM_FEATURES.map((feature, i) => (
              <div
                key={feature.title}
                className={`p-6 md:p-8 ${i % 2 === 0 ? 'border-r border-ink/10' : ''} ${
                  i < PREMIUM_FEATURES.length - 2 ? 'border-b border-ink/10' : ''
                }`}
              >
                <h3 className="font-display text-h3 text-ink mb-2">
                  {feature.title}
                </h3>
                <p className="font-body text-sm text-ink/70">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* CTA */}
      <Section tone="paper" className="relative py-section" contained>
        <div className="max-w-3xl mx-auto text-center">
          <p className="font-body text-caption uppercase text-coral mb-6">
            Ready
          </p>
          <h2 className="font-display text-display-2 text-ink mb-6">
            One caneca. One payment.
          </h2>
          <p className="font-body text-lg text-ink/70 mb-10 max-w-xl mx-auto">
            Less than a round at the pub. More than all the tools you need to finish 50 days.
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
          <p className="font-body text-xs text-ink/50 mt-6">
            Secure checkout via Creem. One payment. Yours forever.
          </p>
          {!user && (
            <p className="font-body text-xs text-ink/40 mt-2">
              Pay with the same email you&apos;ll use to sign in, and your premium unlocks automatically.
            </p>
          )}

          {/* Free extras */}
          <div className="mt-16 pt-12 border-t border-ink/10">
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
        </div>
      </Section>
    </>
  );
}
