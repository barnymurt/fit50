'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Section from '@/components/Section';
import Button from '@/components/Button';
import Timer from '@/components/Timer';
import ProjectBoard from '@/components/ProjectBoard';
import { useAuth } from '@/contexts/AuthContext';
import { useSyncTracker } from '@/hooks/useSyncTracker';

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

const HABIT_LABELS: Record<string, string> = {
  'chill-out': 'Chill Out',
  'fuel-right': 'Fuel Right',
  'crispy-clarity': 'Crispy Clarity',
  'fresh-lungs': 'Fresh Lungs',
  'open-mind': 'Open Mind',
  'move-body': 'Move Your Body',
  'wet-lips': 'Wet The Lips',
  'step-it-up': 'Step It Up',
  'feed-brain': 'Feed Your Brain',
};

export default function AccountPage() {
  const router = useRouter();
  const { user, profile, loading, signIn, signUp, signOut, resetPassword } = useAuth();
  const { data: trackerData, loaded: trackerLoaded } = useSyncTracker();
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authHint, setAuthHint] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

  const challengeStarted = profile?.challenge_started_at
    ? new Date(profile.challenge_started_at).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '—';

  // Tracker stats
  const completedDays = Object.keys(trackerData.habitCompletions).reduce((acc, habitId) => {
    return acc + Object.values(trackerData.habitCompletions[habitId] || {}).filter(Boolean).length;
  }, 0);
  const totalDays = trackerData.currentDay - 1; // Days completed (yesterday and before)
  const completionPct = totalDays > 0 ? Math.round((completedDays / (totalDays * 9)) * 100) : 0;

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitting(true);
    setAuthError(null);
    setAuthHint(null);

    if (authMode === 'forgot') {
      const { error: err } = await resetPassword(email);
      setSubmitting(false);
      if (err) {
        setAuthError(err.message);
        return;
      }
      setResetSent(true);
      return;
    }

    if (authMode === 'signup') {
      const { error: err } = await signUp(email, password);
      setSubmitting(false);
      if (err) {
        setAuthError(err.message);
        if (err.hint) setAuthHint(err.hint);
        return;
      }
      return;
    }

    const { error: err } = await signIn(email, password);
    setSubmitting(false);
    if (err) {
      setAuthError(err.message);
      if (err.hint) setAuthHint(err.hint);
      return;
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <Section
        className="relative py-section min-h-[70vh] flex items-center justify-center"
        tone="paper"
        contained
      >
        <p className="font-body text-ink/50">Loading…</p>
      </Section>
    );
  }

  // Not signed in — show sign-in form
  if (!user) {
    return (
      <Section
        className="relative py-section min-h-[70vh] flex items-center"
        tone="paper"
        contained
      >
        <div className="max-w-md mx-auto w-full">
          <p className="font-body text-caption uppercase text-coral mb-3 text-center">
            Account
          </p>
          <h1 className="font-display text-display-2 text-ink mb-4 text-center">
            {authMode === 'signup' && 'Create account.'}
            {authMode === 'signin' && 'Sign in.'}
            {authMode === 'forgot' && 'Reset password.'}
          </h1>
          <p className="font-body text-base text-ink/70 mb-10 text-center">
            {authMode === 'signup' && 'Pick a password, start your 50 days.'}
            {authMode === 'signin' && 'Welcome back.'}
            {authMode === 'forgot' && "We'll email you a reset link."}
          </p>

          {resetSent ? (
            <div className="bg-paper border border-ink/10 p-8 text-center">
              <p className="font-display text-h2 text-teal mb-3">Check your email ✓</p>
              <p className="font-body text-sm text-ink/70">
                Reset link sent to <span className="text-ink">{email}</span>. Click the link in the email to set a new password. The link expires in 1 hour.
              </p>
              <button
                onClick={() => { setAuthMode('signin'); setResetSent(false); setPassword(''); }}
                className="mt-6 font-body text-caption uppercase text-coral hover:underline"
              >
                ← Back to sign in
              </button>
            </div>
          ) : (
            <form onSubmit={handleAuth} className="bg-paper border border-ink/10 p-8">
              <label htmlFor="email" className="block font-body text-caption uppercase tracking-widest text-ink/50 mb-3">
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
                className="w-full p-4 bg-cream/30 border-2 border-ink/20 text-ink font-body focus:border-ink outline-none rounded-none mb-4 disabled:opacity-50"
                autoFocus
              />

              {authMode !== 'forgot' && (
                <>
                  <label htmlFor="password" className="block font-body text-caption uppercase tracking-widest text-ink/50 mb-3">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={8}
                    disabled={submitting}
                    className="w-full p-4 bg-cream/30 border-2 border-ink/20 text-ink font-body focus:border-ink outline-none rounded-none mb-4 disabled:opacity-50"
                  />
                </>
              )}

              {authError && (
                <p role="alert" className="font-body text-sm text-coral mb-2">{authError}</p>
              )}
              {authHint && (
                <p className="font-body text-xs text-ink/50 mb-4">{authHint}</p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-ink text-paper font-body text-sm px-6 py-4 uppercase tracking-wider hover:bg-ink/85 transition-colors disabled:opacity-50"
              >
                {submitting
                  ? '...'
                  : authMode === 'signin'
                  ? 'Sign in'
                  : authMode === 'signup'
                  ? 'Create account'
                  : 'Send reset link'}
              </button>

              <div className="mt-6 space-y-2 text-center">
                {authMode === 'signin' && (
                  <>
                    <button
                      type="button"
                      onClick={() => { setAuthMode('signup'); setAuthError(null); setAuthHint(null); }}
                      className="block w-full font-body text-sm text-ink/60 hover:text-ink"
                    >
                      Don&apos;t have an account? <span className="text-coral">Create one</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setAuthMode('forgot'); setAuthError(null); setAuthHint(null); }}
                      className="block w-full font-body text-sm text-ink/60 hover:text-ink"
                    >
                      Forgot password?
                    </button>
                  </>
                )}
                {authMode === 'signup' && (
                  <button
                    type="button"
                    onClick={() => { setAuthMode('signin'); setAuthError(null); setAuthHint(null); }}
                    className="block w-full font-body text-sm text-ink/60 hover:text-ink"
                  >
                    Already have an account? <span className="text-coral">Sign in</span>
                  </button>
                )}
                {authMode === 'forgot' && (
                  <button
                    type="button"
                    onClick={() => { setAuthMode('signin'); setAuthError(null); setAuthHint(null); }}
                    className="block w-full font-body text-sm text-ink/60 hover:text-ink"
                  >
                    ← Back to sign in
                  </button>
                )}
              </div>

              {authMode !== 'forgot' && (
                <>
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-ink/10" />
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-paper px-3 font-body text-caption uppercase text-ink/40">or</span>
                    </div>
                  </div>
                  <Link
                    href="/toolkit"
                    className="block text-center font-body text-caption uppercase tracking-widest text-ink/60 hover:text-ink"
                  >
                    Browse the toolkit →
                  </Link>
                </>
              )}
            </form>
          )}
        </div>
      </Section>
    );
  }

  // Signed in — show account content
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
            <p className="font-body text-caption uppercase text-ink/50 mb-3">
              Challenge
            </p>
            {trackerLoaded ? (
              <div>
                <p className="font-body text-ink mb-4">
                  Started {challengeStarted} · Day {trackerData.currentDay} of 50
                </p>

                {/* Completion summary */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  <div className="border border-ink/10 p-4">
                    <p className="font-display text-2xl text-ink leading-none tabular-nums">
                      {totalDays > 0 ? Math.round((completedDays / (totalDays * 9)) * 100) : 0}
                      <span className="text-sm text-ink/50 font-body font-normal ml-1">%</span>
                    </p>
                    <p className="font-body text-caption uppercase tracking-widest text-ink/50 mt-2">
                      Overall
                    </p>
                  </div>
                  <div className="border border-ink/10 p-4">
                    <p className="font-display text-2xl text-ink leading-none tabular-nums">
                      {trackerData.streakCount}
                    </p>
                    <p className="font-body text-caption uppercase tracking-widest text-ink/50 mt-2">
                      Streak
                    </p>
                  </div>
                  <div className="border border-ink/10 p-4">
                    <p className="font-display text-2xl text-ink leading-none tabular-nums">
                      {completedDays}
                    </p>
                    <p className="font-body text-caption uppercase tracking-widest text-ink/50 mt-2">
                      Boxes
                    </p>
                  </div>
                </div>

                {/* Per-habit completion */}
                <div className="border border-ink/10">
                  {Object.entries(trackerData.habitCompletions).map(([habitId, days], i) => {
                    const completed = Object.values(days).filter(Boolean).length;
                    return (
                      <div
                        key={habitId}
                        className={`flex items-center justify-between p-3 ${
                          i < Object.keys(trackerData.habitCompletions).length - 1 ? 'border-b border-ink/10' : ''
                        }`}
                      >
                        <p className="font-body text-sm text-ink">
                          {HABIT_LABELS[habitId] || habitId}
                        </p>
                        <p className="font-body text-sm text-ink/60 tabular-nums">
                          {completed} {completed === 1 ? 'day' : 'days'}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="font-body text-ink">Started {challengeStarted}</p>
            )}
          </div>

          <div className="pt-8 border-t border-rule">
            <p className="font-body text-caption uppercase tracking-widest text-ink/50 mb-3">
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

          {profile?.is_premium && (
            <>
              <div className="pt-8 border-t border-rule">
                <p className="font-body text-caption uppercase tracking-widest text-ink/50 mb-3">
                  Premium
                </p>
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

              <div className="pt-8 border-t border-rule">
                <p className="font-body text-caption uppercase tracking-widest text-ink/50 mb-2">
                  Tools
                </p>
                <p className="font-display text-h2 text-ink mb-2">
                  Built-in timer.
                </p>
                <p className="font-body text-base text-ink/70 mb-8 max-w-lg">
                  Pick a duration, hit start, get on with it. The 30-min default fits the Feed Your Brain rule perfectly.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                  <Timer label="Default · 30 min" defaultMinutes={30} />
                  <Timer label="Quick set · 15 min" defaultMinutes={15} />
                </div>
              </div>

              <div className="pt-8 border-t border-rule">
                <p className="font-body text-caption uppercase tracking-widest text-ink/50 mb-2">
                  Project board
                </p>
                <p className="font-display text-h2 text-ink mb-2">
                  To do · In progress · Done.
                </p>
                <p className="font-body text-base text-ink/70 mb-8 max-w-lg">
                  Plan your 50 days. Add tasks, move them as you go. Saves locally — premium gets Supabase sync.
                </p>

                <ProjectBoard />
              </div>
            </>
          )}

          {!profile?.is_premium && (
            <div className="pt-8 border-t border-rule">
              <p className="font-body text-caption uppercase tracking-widest text-ink/50 mb-3">
                Premium
              </p>
              <p className="font-body text-ink mb-3">
                Free tier. Track locally on this device.
              </p>
              <p className="font-body text-sm text-ink/60 mb-6">
                Unlock cloud sync, streak protection, daily reminders, the macro calculator, and the project board.
              </p>
              <Button href="/upgrade" variant="primary" tone="light">
                Unlock for £7.99
              </Button>
            </div>
          )}
        </div>
      </div>
    </Section>
  );
}
