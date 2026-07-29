'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Section from '@/components/Section';
import { useAuth } from '@/contexts/AuthContext';

export default function AccountPage() {
  const router = useRouter();
  const { user, profile, loading, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  const handleSignOut = async () => {
    setSigningOut(true);
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
              disabled={signingOut}
              className="font-body text-caption uppercase text-ink/60 hover:text-ink transition-colors disabled:opacity-50"
            >
              {signingOut ? 'Signing out…' : 'Sign out'}
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
                <button
                  className="bg-ink text-paper font-body text-sm px-6 py-3 uppercase tracking-wider hover:bg-ink/85 transition-colors"
                  disabled
                >
                  Premium coming soon
                </button>
                <p className="font-body text-xs text-ink/40 mt-3">
                  Payments via Lemon Squeezy launch in Phase 2.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Section>
  );
}
