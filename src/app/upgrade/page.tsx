'use client';

import { useState } from 'react';
import Section from '@/components/Section';
import Button from '@/components/Button';
import { useAuth } from '@/contexts/AuthContext';

const PREMIUM_FEATURES = [
  {
    title: 'Cloud sync',
    description: 'Your progress saved across every device. Switch from phone to laptop without losing a day.',
  },
  {
    title: 'Streak protection',
    description: 'One free pass per week. Miss a day, the streak holds. Each save becomes a banana on your certificate.',
  },
  {
    title: 'Daily reminders',
    description: 'A nudge at the time you pick. Never forget to check the boxes.',
  },
  {
    title: 'Photo proof',
    description: 'Attach a photo to any check-in. Hold yourself accountable and prove it to yourself later.',
  },
  {
    title: 'Completion certificate',
    description: 'A printable PDF on day 50 plus a shareable link. Show the world you finished.',
  },
  {
    title: 'Data export',
    description: 'Your 50 days as a CSV. Yours to keep, analyse, or just print and pin.',
  },
];

export default function UpgradePage() {
  const { user, profile, loading } = useAuth();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // No auth gate — the Creem webhook matches by email, so users can
  // pay even without a Supabase account. After paying, they sign in
  // with the same email to see their premium status.

  const handleCheckout = async () => {
    setCheckoutLoading(true);
    setError(null);

    const checkoutUrl = process.env.NEXT_PUBLIC_CREEM_CHECKOUT_URL;
    if (!checkoutUrl) {
      setError('Checkout not configured. Please contact support.');
      setCheckoutLoading(false);
      return;
    }

    // Pass the signed-in user's email to Creem via query param so
    // it's prefilled. The webhook still matches by email server-side.
    const url = new URL(checkoutUrl);
    if (user?.email) {
      url.searchParams.set('prefilled_email', user.email);
    }

    window.location.href = url.toString();
  };

  // If already premium and signed in, show confirmation
  if (!loading && user && profile?.is_premium) {
    return (
      <Section className="relative py-section" contained>
        <div className="max-w-2xl mx-auto text-center">
          <p className="font-body text-caption uppercase text-coral mb-3">Premium</p>
          <h1 className="font-display text-display-2 text-ink mb-6">
            You&apos;re already in.
          </h1>
          <p className="font-body text-lg text-ink/70 mb-8">
            All premium features are active. Thank you for the support.
          </p>
          <Button href="/account" variant="primary" tone="light">
            Back to account
          </Button>
        </div>
      </Section>
    );
  }

  return (
    <Section className="relative py-section" contained>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <p className="font-body text-caption uppercase text-coral mb-3">
            FIT50 Premium
          </p>
          <h1 className="font-display text-display-2 text-ink mb-6">
            Finish the thing.
          </h1>
          <p className="font-body text-xl text-ink/70 max-w-2xl mx-auto">
            One payment. Every premium feature unlocked. Less than a beer.
          </p>
          <div className="mt-8">
            <span className="font-display text-display-2 text-coral">€7.99</span>
            <span className="font-body text-ink/60 ml-2">one-time</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border border-ink/10 mb-12">
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

        <div className="text-center">
          {error && (
            <p className="font-body text-sm text-coral mb-4">{error}</p>
          )}
          <button
            onClick={handleCheckout}
            disabled={checkoutLoading}
            className="inline-flex items-center justify-center bg-coral text-paper font-body text-sm px-10 py-5 uppercase tracking-wider hover:bg-coral/85 transition-colors disabled:opacity-50"
          >
            {checkoutLoading ? 'Opening checkout…' : 'Unlock for €7.99'}
          </button>
          <p className="font-body text-xs text-ink/50 mt-4">
            Secure checkout via Creem. No subscription. One payment.
          </p>
          {!user && (
            <p className="font-body text-xs text-ink/40 mt-2">
              Pay with the same email you&apos;ll use to sign in, and your premium will unlock automatically.
            </p>
          )}
        </div>
      </div>
    </Section>
  );
}
