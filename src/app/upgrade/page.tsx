'use client';

import { useState } from 'react';
import Section from '@/components/Section';
import { useAuth } from '@/contexts/AuthContext';

interface ToolkitItem {
  category: string;
  title: string;
  description: string;
  href: string;
}

const PREMIUM_FEATURES = [
  {
    title: 'Cloud sync',
    description: 'Your progress follows you. Phone, laptop, tablet — pick up where you left off on any device.',
  },
  {
    title: 'Streak protection',
    description: 'One free pass a week. Miss a day and the streak holds. Each save becomes a 🍌 on your certificate.',
  },
  {
    title: 'Daily reminders',
    description: 'A nudge at the time you pick. Never forget to check the boxes after a long day.',
  },
  {
    title: 'Photo proof',
    description: 'Attach a photo to any check-in. See the streak build in images, not just ticks.',
  },
  {
    title: 'Completion certificate',
    description: 'A printable PDF on day 50 plus a shareable link. Show the world you finished what you started.',
  },
  {
    title: 'Data export',
    description: 'Your 50 days as a CSV. Yours to keep, analyse, or print and pin somewhere you see it every morning.',
  },
];

const TOOLKIT: ToolkitItem[] = [
  {
    category: 'Smoking cessation',
    title: 'Quit resources',
    description: 'Curated links to NHS Smokefree, Quit.org, and the Smokefree app — pick the one that fits your style.',
    href: 'https://www.nhs.uk/smokefree',
  },
  {
    category: 'Drinking less',
    title: 'Non-alcoholic recipes',
    description: '50 zero-proof cocktails, mocktails, and infusions so the "no alcohol" rule never feels like a punishment.',
    href: 'https://www.bonappetit.com/recipes/slideshow/non-alcoholic-cocktail-recipes',
  },
  {
    category: 'Nutrition',
    title: 'Macro calculator',
    description: 'Plug in your stats, get a daily protein/carb/fat target. No app install, no sign-up, just numbers.',
    href: '/fuel',
  },
  {
    category: 'Meditation',
    title: 'Meditation apps',
    description: 'Direct links to Headspace, Calm, Waking Up, and Insight Timer — with a note on which one fits which kind of brain.',
    href: 'https://www.headspace.com',
  },
  {
    category: 'Movement',
    title: 'Workout inspiration',
    description: 'YouTube channels and free programs for the 50 days. Beginner to advanced, all bodyweight.',
    href: 'https://www.youtube.com/results?search_query=bodyweight+workout+50+days',
  },
  {
    category: 'Tracking',
    title: 'Sleep + steps',
    description: "How to use your phone's built-in sleep and step tracking so the \"10K steps\" rule is friction-free.",
    href: 'https://support.apple.com/en-us/108789',
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
            All premium features are active. Thank you for the support.
          </p>
          <a
            href="/account"
            className="inline-flex items-center justify-center bg-ink text-paper font-body text-sm px-10 py-5 uppercase tracking-wider hover:bg-ink/85 transition-colors"
          >
            Back to account
          </a>
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
            <span className="px-6">PREMIUM · UNLOCK · FINISH · PREMIUM · UNLOCK · FINISH · </span>
            <span className="px-6">PREMIUM · UNLOCK · FINISH · PREMIUM · UNLOCK · FINISH · </span>
          </div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <p className="font-body text-caption uppercase text-coral mb-6">
            FIT50 Premium
          </p>
          <h1 className="font-display text-display-1 text-ink mb-8 leading-[0.95]">
            Buy us a beer.
          </h1>
          <p className="font-display text-h2 text-ink/80 mb-12 max-w-2xl mx-auto leading-tight">
            We&apos;ll give you the tools to not need one for 50 days.
          </p>

          <div className="inline-flex items-baseline gap-3 mb-4">
            <span className="font-display text-display-1 text-coral leading-none">£7.99</span>
            <span className="font-body text-caption uppercase text-ink/60">one-time</span>
          </div>
          <p className="font-body text-sm text-ink/50">
            Secure checkout via Creem. No subscription. No auto-renew.
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
              <p className="font-display text-display-2 text-coral leading-none">£8</p>
              <p className="font-body text-sm text-paper/60 mt-2">
                average pint in London
              </p>
            </div>
            <div>
              <p className="font-display text-display-2 text-coral leading-none">50</p>
              <p className="font-body text-sm text-paper/60 mt-2">
                days in the challenge
              </p>
            </div>
            <div>
              <p className="font-display text-display-2 text-coral leading-none">£400</p>
              <p className="font-body text-sm text-paper/60 mt-2">
                you keep (if you would have had one drink a day)
              </p>
            </div>
          </div>

          <p className="font-display text-h2 text-paper max-w-2xl">
            £7.99 buys the tools. The 50 days pays for them many times over.
          </p>
        </div>
      </Section>

      {/* What you get — the premium features */}
      <Section tone="paper" className="relative py-section" contained>
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-12">
            <div className="md:col-span-5">
              <p className="font-body text-caption uppercase text-ink/50 mb-3">
                What you get
              </p>
              <h2 className="font-display text-display-2 text-ink">
                Six features.
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

      {/* The toolkit — what you also get */}
      <Section tone="ink" className="relative py-section" contained>
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-12">
            <div className="md:col-span-7">
              <p className="font-body text-caption uppercase text-coral mb-3">
                The toolkit
              </p>
              <h2 className="font-display text-display-2 text-paper">
                All the links you need.
              </h2>
            </div>
            <div className="md:col-span-5 md:col-start-8 flex items-end">
              <p className="font-body text-base text-paper/70">
                Curated resources for each of the 9 rules. No googling. No scrolling. Open the link, do the thing.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 border-t border-l border-paper/15">
            {TOOLKIT.map((item, i) => (
              <a
                key={item.title}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`p-6 md:p-8 group hover:bg-paper/5 transition-colors block ${
                  i % 2 === 0 ? 'border-r border-paper/15' : ''
                } ${i < TOOLKIT.length - 2 ? 'border-b border-paper/15' : ''}`}
              >
                <p className="font-body text-caption uppercase text-coral mb-2">
                  {item.category}
                </p>
                <h3 className="font-display text-h3 text-paper mb-2 flex items-center gap-2">
                  {item.title}
                  <span className="text-paper/40 group-hover:text-coral group-hover:translate-x-1 transition-all">
                    →
                  </span>
                </h3>
                <p className="font-body text-sm text-paper/60">
                  {item.description}
                </p>
              </a>
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
            One beer. One payment.
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
            {checkoutLoading ? 'Opening checkout…' : 'Unlock for £7.99'}
          </button>
          <p className="font-body text-xs text-ink/50 mt-6">
            Secure checkout via Creem. One payment. Yours forever.
          </p>
          {!user && (
            <p className="font-body text-xs text-ink/40 mt-2">
              Pay with the same email you&apos;ll use to sign in, and your premium unlocks automatically.
            </p>
          )}
        </div>
      </Section>
    </>
  );
}
