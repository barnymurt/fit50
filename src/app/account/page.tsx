'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Section from '@/components/Section';
import Button from '@/components/Button';
import Timer from '@/components/Timer';
import { useAuth } from '@/contexts/AuthContext';
import type { User } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase';

type Profile = Database['public']['Tables']['profiles']['Row'];

export default function AccountPage() {
  const router = useRouter();
  const { user, profile, loading, signInWithMagicLink } = useAuth();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitting(true);
    setError(null);
    const { error: err } = await signInWithMagicLink(email);
    setSubmitting(false);
    if (err) {
      setError(err);
      return;
    }
    setSent(true);
  };

  if (loading) {
    return (
      <Section
        className="relative py-section min-h-[60vh] flex items-center justify-center"
        contained
      >
        <p className="font-body text-ink/50">Loading…</p>
      </Section>
    );
  }

  // Not signed in — show sign-in form
  if (!user) {
    return (
      <Section className="relative py-section min-h-[70vh] flex items-center" contained>
        <div className="max-w-md mx-auto w-full">
          <p className="font-body text-caption uppercase text-coral mb-3 text-center">
            Account
          </p>
          <h1 className="font-display text-display-2 text-ink mb-4 text-center">
            Sign in.
          </h1>
          <p className="font-body text-base text-ink/70 mb-10 text-center">
            Enter your email — we&apos;ll send a one-tap link to save your progress and unlock your premium features.
          </p>

          {sent ? (
            <div className="bg-paper border border-ink/10 p-8 text-center">
              <p className="font-display text-h2 text-teal mb-3">Check your email ✓</p>
              <p className="font-body text-sm text-ink/70">
                Sign-in link sent to <span className="text-ink">{email}</span>. Click the link in the email to sign in. The link expires in 1 hour.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSignIn} className="bg-paper border border-ink/10 p-8">
              <label htmlFor="email" className="font-body text-caption uppercase text-ink/50 block mb-3">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                required
                disabled={submitting}
                className="w-full p-4 bg-cream/30 border-2 border-ink/20 text-ink font-body focus:border-coral outline-none rounded-none mb-4 disabled:opacity-50"
                autoFocus
              />
              {error && (
                <p className="font-body text-sm text-coral mb-4">{error}</p>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-ink text-paper font-body text-sm px-6 py-4 uppercase tracking-wider hover:bg-ink/85 transition-colors disabled:opacity-50"
              >
                {submitting ? 'Sending…' : 'Send sign-in link'}
              </button>
              <p className="font-body text-xs text-ink/40 mt-4 text-center">
                No password. We&apos;ll email you a one-tap link.
              </p>
            </form>
          )}
        </div>
      </Section>
    );
  }

  return (
    <Section className="relative py-section" contained>
      <AccountContent user={user} profile={profile} />
    </Section>
  );
}

function AccountContent({
  user,
  profile,
}: {
  user: User;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  profile: any;
}) {
  const router = useRouter();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const challengeStarted = profile?.challenge_started_at
    ? new Date(profile.challenge_started_at).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '—';

  return (
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
  );
}
