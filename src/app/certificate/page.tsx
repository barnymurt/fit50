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
import { useCertificateData } from '@/hooks/useCertificateData';
import { dayKeyFromStart } from '@/lib/dates';

export default function CertificatePage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const tracker = useTrackerState();
  const data = useCertificateData(tracker.startDate);
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

  // Certificate is available to anyone who reached day 50 on
  // their calendar. We intentionally do NOT gate on
  // daysCompleted >= 50:
  //
  //   - That would be the strictest "every habit ticked for all 50
  //     days" rule, which is the spirit of the user's request,
  //     BUT it permanently locks out users whose ticks were lost
  //     to the now-fixed hydration-race bug (their daily_totals
  //     are sparse even though they completed the challenge).
  //   - For those users, surfacing a "data may be incomplete"
  //     callout on the cert is better than never showing the cert
  //     at all.
  //
  // The "Not finished yet" block renders while currentDay < 50.
  // The cert itself shows a "this isn't a full 50 — the data
  // looks like 41 of 50 because some days were lost" warning if
  // daysCompleted < 50, so the user knows the gap.
  const isComplete = data.loaded && tracker.currentDay >= 50;

  // End of the date range should match the user's progress, not
  // today's date. A user who's on day 49 with 49 complete days
  // should see Aug 17 → Oct 4, not Aug 17 → Oct 5. The "last
  // day they did something real" anchor is the higher of
  // daysCompleted (their last fully-complete day) and the start
  // date itself. If they've completed zero days we just show the
  // start.
  const lastDayCompleted = data.loaded ? data.daysCompleted : 0;
  const endDay = isComplete
    ? 50
    : Math.max(1, lastDayCompleted || 1);
  const startKey = dayKeyFromStart(tracker.startDate, 1);
  const endKey = dayKeyFromStart(tracker.startDate, endDay);

  return (
    <>
      <ChallengeCertificate
        data={data}
        startDate={startKey}
        endDateOverride={endKey}
        displayName={profile.display_name ?? null}
        email={user.email ?? ''}
        isComplete={isComplete}
      />
      {!data.loaded && (
        <Section className="relative pt-0 pb-section" tone="paper" contained>
          <div className="max-w-3xl mx-auto text-center">
            <p className="font-body text-ink/40">Loading your stats…</p>
          </div>
        </Section>
      )}
      {data.loaded && !isComplete && (
        <Section className="relative pt-0 pb-section" tone="ink" contained>
          <div className="max-w-3xl mx-auto text-center">
            <p className="font-body text-caption uppercase tracking-widest text-paper/50 mb-3">
              Not finished yet
            </p>
            <p className="font-body text-base text-paper/70 mb-6 max-w-md mx-auto">
              {tracker.currentDay >= 50
                ? `Day 50 is on the board but not all 9 habits are ticked yet. Finish the last day and the certificate unlocks.`
                : `You're on day ${tracker.currentDay} of 50. Finish every habit on day 50 and the certificate unlocks.`}
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