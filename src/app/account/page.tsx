'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Section from '@/components/Section';
import Button from '@/components/Button';
import { useAuth } from '@/contexts/AuthContext';

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
        className="relative py-section min-h-[60vh] flex items-center justify-center"
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
    <Section
      className="relative py-section"
      contained
    >
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
              Premium
            </p>
            {profile?.is_premium ? (
              <div>
                <p className="font-display text-h3 text-teal">
                  ✓ Premium unlocked
                </p>
                <p className="font-body text-sm text-ink/60 mt-2">
                  Cloud sync, streak protection, daily reminders, photo proof, and the completion certificate are all active.
                </p>
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
                  Unlock for €7.99
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Section>
  );
}
