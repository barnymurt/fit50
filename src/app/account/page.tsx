'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import Section from '@/components/Section';
import Button from '@/components/Button';
import Title from '@/components/Title';
import Heading from '@/components/Heading';
import Timer from '@/components/Timer';
import ProjectBoard from '@/components/ProjectBoard';
import Marquee from '@/components/Marquee';
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

  const completedDays = Object.keys(trackerData.habitCompletions).reduce((acc, habitId) => {
    return acc + Object.values(trackerData.habitCompletions[habitId] || {}).filter(Boolean).length;
  }, 0);
  const totalDays = trackerData.currentDay - 1;
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

  // ---------- Not signed in: sign-in form ----------
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

  // ---------- Signed in: account content with proper section structure ----------
  const totalForProgress = trackerData.currentDay - 1;
  const progressPct = Math.min(100, Math.round((trackerData.currentDay - 1) / 50 * 100));

  return (
    <>
      {/* ============ HERO: paper, with marquee ============ */}
      <Section
        className="relative pt-40 md:pt-56 pb-section overflow-hidden"
        tone="paper"
        contained
      >
        <div className="absolute top-0 left-0 right-0 h-32 md:h-52 overflow-hidden pointer-events-none z-0 flex items-center">
          <Marquee
            text="YOUR ACCOUNT · THE FIFTY · PREMIUM TOOLS"
            separator="✦"
            speed={240}
            textClassName="text-paper/10"
          />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto">
          <p className="font-body text-caption uppercase text-coral mb-3">
            FIT50 Account
          </p>
          <Title>You’re in.</Title>
          <p className="font-body text-lg text-ink/70 mt-6 max-w-2xl">
            Signed in as <span className="text-ink">{user.email}</span>. {profile?.is_premium ? 'Premium tools are active.' : 'Free tier. Track locally on this device.'}
          </p>
          <button
            onClick={handleSignOut}
            className="mt-4 font-body text-caption uppercase text-ink/60 hover:text-coral transition-colors"
          >
            Sign out
          </button>
        </div>
      </Section>

      {/* ============ CHALLENGE: ink, with marquee ============ */}
      <Section
        className="relative py-section overflow-hidden"
        tone="ink"
        contained
      >
        <div className="absolute top-0 left-0 right-0 h-32 md:h-52 overflow-hidden pointer-events-none z-0 flex items-center">
          <Marquee
            text="DAY BY DAY · THE FIFTY · TRACKER · STREAKS"
            separator="✦"
            speed={220}
            textClassName="text-coral/55"
          />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto">
          <p className="font-body text-caption uppercase text-coral mb-4">
            The challenge
          </p>
          <Title tone="dark">Day {trackerData.currentDay} of 50.</Title>

          <div className="mt-8 mb-6">
            <p className="font-body text-paper/70">
              Started {challengeStarted} · {progressPct}% done
            </p>
          </div>

          {/* progress bar */}
          <div className="h-1.5 bg-paper/15 mb-12 overflow-hidden">
            <div
              className="h-full bg-coral"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          {trackerLoaded ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-paper/15 mb-8">
              <div className="p-6 border-b md:border-b-0 md:border-r border-paper/15">
                <p className="font-display text-display-2 text-paper leading-none tabular-nums">
                  {completionPct}
                  <span className="text-2xl text-paper/50 font-body font-normal ml-1">%</span>
                </p>
                <p className="font-body text-caption uppercase tracking-widest text-paper/50 mt-2">
                  Overall complete
                </p>
              </div>
              <div className="p-6 border-b md:border-b-0 md:border-r border-paper/15">
                <p className="font-display text-display-2 text-paper leading-none tabular-nums">
                  {trackerData.streakCount}
                </p>
                <p className="font-body text-caption uppercase tracking-widest text-paper/50 mt-2">
                  Current streak
                </p>
              </div>
              <div className="p-6">
                <p className="font-display text-display-2 text-paper leading-none tabular-nums">
                  {completedDays}
                </p>
                <p className="font-body text-caption uppercase tracking-widest text-paper/50 mt-2">
                  Boxes ticked
                </p>
              </div>
            </div>
          ) : (
            <p className="font-body text-paper/40">Loading tracker data…</p>
          )}

          {/* Per-habit breakdown */}
          <div className="border border-paper/15">
            {Object.entries(trackerData.habitCompletions).map(([habitId, days], i, arr) => {
              const completed = Object.values(days).filter(Boolean).length;
              return (
                <div
                  key={habitId}
                  className={`flex items-center justify-between p-4 ${
                    i < arr.length - 1 ? 'border-b border-paper/15' : ''
                  }`}
                >
                  <p className="font-body text-paper">
                    {HABIT_LABELS[habitId] || habitId}
                  </p>
                  <p className="font-body text-sm text-paper/60 tabular-nums">
                    {completed} {completed === 1 ? 'day' : 'days'}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </Section>

      {/* ============ SECURITY: paper, plain ============ */}
      <Section className="relative py-section" tone="paper" contained>
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-8">
            <div className="md:col-span-5">
              <p className="font-body text-caption uppercase text-ink/50 mb-3">
                Security
              </p>
              <Heading>One tap. No password.</Heading>
            </div>
            <div className="md:col-span-6 md:col-start-7 flex items-end">
              <p className="font-body text-base text-ink/70">
                Add a passkey to sign in with Face ID, Touch ID, or Windows Hello. Free for everyone.
              </p>
            </div>
          </div>
          <button
            className="border-2 border-ink/20 text-ink font-body text-sm px-6 py-3 uppercase tracking-wider hover:border-ink/40 transition-colors"
          >
            Set up passkey
          </button>
        </div>
      </Section>

      {/* ============ PREMIUM TOOLS ============ */}
      {profile?.is_premium ? (
        <>
          {/* Premium intro: ink, with marquee */}
          <Section
            className="relative py-section overflow-hidden"
            tone="ink"
            contained
          >
            <div className="absolute top-0 left-0 right-0 h-32 md:h-52 overflow-hidden pointer-events-none z-0 flex items-center">
              <Marquee
                text="PREMIUM TOOLS · THE FIFTY · MACRO CALCULATOR · TIMER · PROJECT BOARD"
                separator="✦"
                speed={200}
                textClassName="text-coral/55"
              />
            </div>

            <div className="relative z-10 max-w-5xl mx-auto">
              <p className="font-body text-caption uppercase text-coral mb-3">
                Premium
              </p>
              <Title tone="dark">Premium unlocked.</Title>
              <p className="font-body text-lg text-paper/70 mt-4 max-w-2xl">
                All six premium features are active. The macro calculator, the timer, and the project board are all yours.
              </p>
            </div>
          </Section>

          {/* Macro calculator CTA: teal */}
          <Section
            className="relative py-section overflow-hidden"
            style={{ backgroundColor: '#4A9B9B' }}
            contained
          >
            <div className="max-w-5xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                <div className="md:col-span-7">
                  <p className="font-body text-caption uppercase text-paper/70 mb-3">
                    Macro calculator
                  </p>
                  <h2 className="font-display text-display-2 text-paper leading-[0.95]">
                    Know your numbers.
                  </h2>
                  <p className="font-body text-base text-paper/85 mt-4 max-w-md">
                    BMR, TDEE, protein, carbs, fat, water. Built for the 50-day challenge — adjust for your goal, sync with your tracker.
                  </p>
                </div>
                <div className="md:col-span-5 md:text-right">
                  <Link
                    href="/macrocalc"
                    className="inline-flex items-center justify-center bg-ink text-paper font-body text-sm px-8 py-4 uppercase tracking-wider hover:bg-ink/85 transition-colors"
                  >
                    Open macro calculator <span className="ml-2">→</span>
                  </Link>
                </div>
              </div>
            </div>
          </Section>

          {/* Timer + Project board side by side: paper */}
          <Section className="relative py-section" tone="paper" contained>
            <div className="max-w-5xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Timer */}
                <div>
                  <p className="font-body text-caption uppercase text-ink/50 mb-3">
                    The timer
                  </p>
                  <Heading>Feed Your Brain.</Heading>
                  <p className="font-body text-base text-ink/70 mt-3 mb-8">
                    30 mins a day on a book or personal project. Start the timer, get to work.
                  </p>
                  <Timer
                    label="Feed Your Brain"
                    context="Read 5 books in 50 days · 30 mins/day on personal projects"
                    defaultMinutes={30}
                    preset={[15, 30, 50]}
                  />
                </div>

                {/* Project board */}
                <div>
                  <p className="font-body text-caption uppercase text-ink/50 mb-3">
                    The board
                  </p>
                  <Heading>To do · In progress · Done.</Heading>
                  <p className="font-body text-base text-ink/70 mt-3 mb-8">
                    Plan the 50 days. Add tasks, move them when you finish.
                  </p>
                  <ProjectBoard />
                </div>
              </div>
            </div>
          </Section>

          {/* The six features: cream */}
          <Section
            className="relative py-section"
            style={{ backgroundColor: '#F2D9A2' }}
            contained
          >
            <div className="max-w-5xl mx-auto">
              <p className="font-body text-caption uppercase text-ink/50 mb-3">
                The six features
              </p>
              <h2 className="font-display text-display-2 text-ink leading-[0.95] mb-12">
                All active.
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 border-t border-l border-ink/20">
                {PREMIUM_FEATURES.map((feature, i) => (
                  <div
                    key={feature.title}
                    className={`p-6 md:p-8 ${i % 2 === 0 ? 'border-r border-b border-ink/20' : 'border-b border-ink/20'}`}
                  >
                    <h3 className="font-display text-h2 text-ink mb-2">
                      {feature.title}
                    </h3>
                    <p className="font-body text-sm text-ink/70">
                      {feature.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </Section>
        </>
      ) : (
        // Free tier
        <Section
          className="relative py-section overflow-hidden"
          tone="ink"
          contained
        >
          <div className="absolute top-0 left-0 right-0 h-32 md:h-52 overflow-hidden pointer-events-none z-0 flex items-center">
            <Marquee
              text="UNLOCK PREMIUM · THE FIFTY · MACRO CALCULATOR · TIMER · PROJECT BOARD"
              separator="✦"
              speed={220}
              textClassName="text-coral/55"
            />
          </div>

          <div className="relative z-10 max-w-3xl mx-auto text-center">
            <p className="font-body text-caption uppercase text-coral mb-3">
              Free tier
            </p>
            <Title tone="dark">Unlock premium.</Title>
            <p className="font-body text-lg text-paper/70 mt-4 mb-8">
              Get the macro calculator, the timer, the project board, and the rest of the premium tools. One payment, yours forever.
            </p>
            <div className="flex justify-center">
              <Button href="/upgrade" variant="primary" tone="light">
                Unlock for £7.99
              </Button>
            </div>
          </div>
        </Section>
      )}
    </>
  );
}
