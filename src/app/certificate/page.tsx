'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Section from '@/components/Section';
import Heading from '@/components/Heading';
import Title from '@/components/Title';
import ChallengeCertificate from '@/components/ChallengeCertificate';
import { useAuth } from '@/contexts/AuthContext';
import { useTrackerState } from '@/hooks/useTrackerState';
import { useChallengeStats } from '@/hooks/useChallengeStats';
import { dayKeyFromStart } from '@/lib/dates';

export default function CertificatePage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const tracker = useTrackerState();
  const stats = useChallengeStats(tracker.startDate);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  if (loading || !hydrated || !tracker.loaded) {
    return (
      <Section className="relative py-section min-h-[70vh] flex items-center justify-center" tone="paper" contained>
        <p className="font-body text-ink/50">Loading…</p>
      </Section>
    );
  }

  if (!user) {
    return (
      <Section className="relative py-section min-h-[70vh] flex items-center justify-center" tone="paper" contained>
        <div className="max-w-md mx-auto text-center">
          <p className="font-body text-caption uppercase tracking-widest text-coral mb-3">
            Certificate
          </p>
          <h1 className="font-display text-display-2 text-ink mb-4">
            Sign in to view your certificate.
          </h1>
          <p className="font-body text-base text-ink/70 mb-8">
            Your challenge stats live in your account.
          </p>
          <Link
            href="/account"
            className="inline-flex items-center justify-center bg-ink text-paper font-body text-sm px-8 py-4 uppercase tracking-wider hover:bg-ink/85 transition-colors"
          >
            Sign in
          </Link>
        </div>
      </Section>
    );
  }

  if (!profile?.is_premium) {
    return (
      <Section className="relative py-section min-h-[70vh] flex items-center justify-center" tone="ink" contained>
        <div className="max-w-2xl mx-auto text-center">
          <p className="font-body text-caption uppercase tracking-widest text-coral mb-3">
            Premium
          </p>
          <Title tone="dark">The certificate is a premium perk.</Title>
          <p className="font-body text-lg text-paper/80 mt-4 mb-8">
            Walk out of the 50 days with a personalised certificate showing
            every stat, every book, every workout line. One-time payment of
            €5.99 — yours forever.
          </p>
          <Link
            href="/upgrade"
            className="inline-flex items-center justify-center bg-coral text-paper font-body text-sm px-10 py-5 uppercase tracking-wider hover:bg-coral/85 transition-colors"
          >
            Unlock for €5.99
          </Link>
        </div>
      </Section>
    );
  }

  if (!tracker.hasStarted || !tracker.startDate) {
    return (
      <Section className="relative py-section min-h-[70vh] flex items-center justify-center" tone="paper" contained>
        <div className="max-w-md mx-auto text-center">
          <p className="font-body text-caption uppercase tracking-widest text-coral mb-3">
            Certificate
          </p>
          <h1 className="font-display text-display-2 text-ink mb-4">
            Start the 50 days first.
          </h1>
          <p className="font-body text-base text-ink/70 mb-8">
            Your certificate will appear here when you do.
          </p>
          <Link
            href="/account#tracker"
            className="inline-flex items-center justify-center bg-ink text-paper font-body text-sm px-8 py-4 uppercase tracking-wider hover:bg-ink/85 transition-colors"
          >
            Open the tracker
          </Link>
        </div>
      </Section>
    );
  }

  const isComplete = tracker.currentDay >= 50;
  const startKey = dayKeyFromStart(tracker.startDate, 1);

  return (
    <>
      <ChallengeCertificate
        stats={stats}
        startDate={startKey}
        displayName={profile.display_name ?? null}
        email={user.email ?? ''}
        isComplete={isComplete}
      />
      {!isComplete && (
        <Section className="relative pt-0 pb-section" tone="ink" contained>
          <div className="max-w-3xl mx-auto text-center">
            <p className="font-body text-caption uppercase tracking-widest text-paper/50 mb-3">
              Not finished yet
            </p>
            <p className="font-body text-base text-paper/70 mb-6 max-w-md mx-auto">
              You&apos;re on day {tracker.currentDay} of 50. Finish the
              challenge and the numbers above will be locked in for your
              certificate.
            </p>
            <button
              type="button"
              onClick={() => router.push('/account#tracker')}
              className="font-body text-caption uppercase tracking-widest text-coral hover:text-paper transition-colors underline underline-offset-4"
            >
              Back to the tracker →
            </button>
          </div>
        </Section>
      )}
    </>
  );
}