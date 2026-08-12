'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Section from '@/components/Section';
import Button from '@/components/Button';
import CalculatorSection from '@/components/macro-calculator/CalculatorSection';
import { useAuth } from '@/contexts/AuthContext';

export default function MacrocalcPage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async () => {
    setCheckoutLoading(true);
    setError(null);
    const checkoutUrl = process.env.NEXT_PUBLIC_STRIPE_CHECKOUT_URL;
    if (!checkoutUrl) {
      setError('Stripe checkout is not configured yet. We are switching over from Creem — check back soon.');
      setCheckoutLoading(false);
      return;
    }
    const url = new URL(checkoutUrl);
    if (user?.email) url.searchParams.set('prefilled_email', user.email);
    window.location.href = url.toString();
  };

  // Auth gate
  if (loading) {
    return (
      <Section className="relative py-section min-h-[60vh] flex items-center justify-center" tone="paper" contained>
        <p className="font-body text-ink/50">Loading…</p>
      </Section>
    );
  }

  if (!user) {
    return (
      <Section className="relative py-section min-h-[60vh]" tone="paper" contained>
        <div className="max-w-md mx-auto text-center">
          <p className="font-body text-caption uppercase text-coral mb-3">
            Premium
          </p>
          <h1 className="font-display text-display-2 text-ink mb-6">
            Sign in to continue.
          </h1>
          <p className="font-body text-lg text-ink/70 mb-8">
            The macro calculator is a premium tool. Sign in or create an account to access it.
          </p>
          <Button href="/account" variant="primary" tone="light">
            Sign in
          </Button>
        </div>
      </Section>
    );
  }

  // Premium gate
  if (!profile?.is_premium) {
    return (
      <Section className="relative py-section min-h-[60vh]" tone="paper" contained>
        <div className="max-w-md mx-auto text-center">
          <p className="font-body text-caption uppercase text-coral mb-3">
            Premium
          </p>
          <h1 className="font-display text-display-2 text-ink mb-6">
            Unlock the macro calculator.
          </h1>
          <p className="font-body text-lg text-ink/70 mb-8">
            Nine habits demand fuel. Get the BMR, TDEE, protein, carbs, fat, and water targets that match your goal — in one calculation.
          </p>
          {error && (
            <p className="font-body text-sm text-coral mb-4">{error}</p>
          )}
          <Button
            onClick={handleCheckout}
            disabled={checkoutLoading}
            variant="primary"
            tone="light"
          >
            {checkoutLoading ? 'Opening checkout…' : 'Sign up for €5.99'}
          </Button>
          <p className="font-body text-xs text-ink/50 mt-4">
            Already unlocked? <a href="/account" className="text-coral underline">Sign out and back in</a> to refresh.
          </p>
        </div>
      </Section>
    );
  }

  return <CalculatorSection />;
}
