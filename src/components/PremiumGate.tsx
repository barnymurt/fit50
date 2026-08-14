'use client';

import { ReactNode } from 'react';
import { usePremium } from '@/hooks/usePremium';
import { useAuth } from '@/contexts/AuthContext';

interface PremiumGateProps {
  feature: string;
  description: string;
  children: ReactNode;
}

/**
 * Render `children` for premium users, otherwise render a CTA card
 * pointing to the Premium Tools section on the homepage.
 *
 * Used around the Water + Food + Macro sections to gate them. The
 * gate bypasses itself silently during the auth-loading window so
 * SSR/CSR markup matches.
 */
export default function PremiumGate({
  feature,
  description,
  children,
}: PremiumGateProps) {
  const { user, loading: authLoading } = useAuth();
  const { isPremium } = usePremium();

  if (authLoading) {
    return (
      <div className="font-body text-ink/40 text-sm">Loading…</div>
    );
  }

  if (isPremium) {
    return <>{children}</>;
  }

  return (
    <div className="relative border border-ink/10 bg-cream/30 p-6 md:p-8">
      <p className="font-body text-caption uppercase tracking-widest text-coral mb-3">
        Premium
      </p>
      <h3 className="font-display text-h2 text-ink leading-tight mb-3">
        Unlock the {feature}.
      </h3>
      <p className="font-body text-base text-ink/70 mb-6 max-w-xl">
        {description}
      </p>
      <div className="flex flex-wrap gap-3">
        <a
          href="/#sign-up"
          className="inline-flex items-center justify-center bg-coral hover:bg-coral/85 transition-colors px-6 py-3.5 font-body text-caption uppercase tracking-widest text-paper"
        >
          Unlock for €5.99
        </a>
        {!user && (
          <a
            href="/account?next=/#tracker"
            className="inline-flex items-center justify-center border border-ink/30 hover:border-ink px-6 py-3.5 font-body text-caption uppercase tracking-widest text-ink/70 hover:text-ink"
          >
            Sign in
          </a>
        )}
      </div>
      <p className="font-body text-xs text-ink/50 mt-4">
        One payment, yours forever, no subscription.
      </p>
    </div>
  );
}
