'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Section from '@/components/Section';
import Button from '@/components/Button';
import Timer from '@/components/Timer';
import { useAuth } from '@/contexts/AuthContext';

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

export default function AccountPage() {
  const router = useRouter();
  const { user, profile, loading, signOut } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  if (loading || !user) {
    return (
      <Section
        className="relative py-section min-h-[70vh] flex items-center justify-center"
        tone="paper"
        contained
      >
        <p className="font-body text-ink/50">Loading your account…</p>
      </Section>
    );
  }

  const challengeStarted = profile?.challenge_started_at
    ? new Date(profile.challenge_started_at).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '—';

  return (
    <Section className="relative py-section" tone="paper" contained>
      <div className="max-w-3xl mx-auto">
        <p className="font-body text-caption uppercase text-coral mb-3">
          Account
        </p>
        <h1 className="font-display text-display-2 text-ink mb-12">
          You&apos;re in.
        </h1>

        <div className="space-y-12">
          <div>
            <p className="font-body text-caption uppercase text-ink/50 mb-2">
              Signed in as
            </p>
            <p className="font-display text-h2 text-ink mb-4">
              {user.email}
            </p>
            <button
              onClick={handleSignOut}
              className="font-body text-caption uppercase text-ink/60 hover:text-ink transition-colors"
            >
              Sign out
            </button>
          </div>

          <div className="pt-8 border-t border-rule">
            <p className="font-body text-caption uppercase text-ink/50 mb-2">
              Challenge
            </p>
            <p className="font-body text-ink">
              Started {challengeStarted}
            </p>
          </div>

          <div className="pt-8 border-t border-rule">
            <p className="font-body text-caption uppercase text-ink/50 mb-3">
              Security
            </p>
            <p className="font-body text-sm text-ink/60 mb-3">
              Passkeys (Face ID, Touch ID, Windows Hello) sign you in with one tap — no password, no email.
            </p>
            <button
              className="border-2 border-ink/20 text-ink font-body text-sm px-6 py-3 uppercase tracking-wider hover:border-ink/40 transition-colors"
            >
              Set up passkey
            </button>
          </div>

          <div className="pt-8 border-t border-rule">
            <p className="font-body text-caption uppercase text-ink/50 mb-3">
              Premium
            </p>
            {profile?.is_premium ? (
              <div>
                <p className="font-display text-h3 text-teal mb-4">
                  ✓ Premium unlocked
                </p>
                <p className="font-body text-sm text-ink/70 mb-6">
                  All six premium features are active.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 border-t border-l border-ink/10 mb-6">
                  {PREMIUM_FEATURES.map((feature, i) => (
                    <div
                      key={feature.title}
                      className={`p-4 md:p-5 ${i % 2 === 0 ? 'border-r border-b border-ink/10' : 'border-b border-ink/10'}`}
                    >
                      <h4 className="font-display text-h3 text-ink mb-1">
                        {feature.title}
                      </h4>
                      <p className="font-body text-sm text-ink/65">
                        {feature.description}
                      </p>
                    </div>
                  ))}
                </div>

                <a
                  href="/macrocalc"
                  className="inline-flex items-center gap-2 font-body text-caption uppercase tracking-wider text-coral hover:text-ink transition-colors"
                >
                  Open macro calculator <span>→</span>
                </a>
              </div>
            ) : (
              <div>
                <p className="font-body text-ink mb-3">
                  Free tier. Track locally on this device.
                </p>
                <p className="font-body text-sm text-ink/60 mb-6">
                  Unlock cloud sync, streak protection, daily reminders, and the completion certificate.
                </p>
                <Button href="/upgrade" variant="primary" tone="light">
                  Unlock for £7.99
                </Button>
              </div>
            )}
          </div>

          {profile?.is_premium && (
            <div className="pt-8 border-t border-rule">
              <p className="font-body text-caption uppercase text-ink/50 mb-2">
                Tools
              </p>
              <p className="font-display text-h2 text-ink mb-6">
                Built-in timer.
              </p>
              <p className="font-body text-base text-ink/70 mb-8 max-w-lg">
                Pick a duration, hit start, get on with it. The 30-min default fits the Feed Your Brain rule perfectly.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Timer label="Default · 30 min" defaultMinutes={30} />
                <Timer label="Quick set · 15 min" defaultMinutes={15} />
              </div>
            </div>
          )}
        </div>
      </div>
    </Section>
  );
}
