'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Section from '@/components/Section';
import Heading from '@/components/Heading';
import Title from '@/components/Title';
import Timer from '@/components/Timer';
import { Board, TodoList, useBoardState } from '@/components/ProjectBoard';
import CalculatorForm from '@/components/macro-calculator/CalculatorForm';
import { useAuth } from '@/contexts/AuthContext';
import { useSyncTracker } from '@/hooks/useSyncTracker';
import { useStreakProtection } from '@/hooks/useStreakProtection';
import { usePremium } from '@/hooks/usePremium';
import { calculateMacros } from '@/components/macro-calculator/formulas';
import type { Goal, Diet, Activity, Sex, HeightUnit, WeightUnit } from '@/components/macro-calculator/types';
import WaterCounter from '@/components/WaterCounter';
import Tracker from '@/components/Tracker';

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

const HABIT_IDS = Object.keys(HABIT_LABELS);

const PREMIUM_FEATURES = [
  { title: 'Cloud sync', description: 'Your progress follows you across every device.' },
  { title: 'Streak protection', description: 'One free pass a week. Miss a day, the streak holds.' },
  { title: 'Daily reminders', description: 'A nudge at the time you pick.' },
  { title: 'Photo proof', description: 'Attach a photo to any check-in.' },
  { title: 'Completion certificate', description: 'A printable PDF on day 50 plus a shareable link.' },
  { title: 'Data export', description: 'Your 50 days as a CSV.' },
];

export default function AccountPage() {
  const router = useRouter();
  const { user, profile, loading, signIn, signUp, signOut, resetPassword } = useAuth();
  const { data: trackerData, loaded: trackerLoaded } = useSyncTracker();
  const { isPremium } = usePremium();
  const { totalUsed, hasProtectionForWeek, redeemProtection } = useStreakProtection();
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authHint, setAuthHint] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);
  const [streakRedeeming, setStreakRedeeming] = useState(false);
  const [streakMessage, setStreakMessage] = useState<string | null>(null);

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
  const progressPct = Math.min(100, Math.round((trackerData.currentDay - 1) / 50 * 100));

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitting(true);
    setAuthError(null);
    setAuthHint(null);

    if (authMode === 'forgot') {
      const { error: err } = await resetPassword(email);
      setSubmitting(false);
      if (err) { setAuthError(err.message); return; }
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
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const handleRedeemStreak = async () => {
    if (!isPremium) return;
    setStreakRedeeming(true);
    setStreakMessage(null);
    const success = await redeemProtection(trackerData.currentDay);
    setStreakRedeeming(false);
    if (success) {
      setStreakMessage('✓ Streak protected. Your day is banked.');
    } else {
      setStreakMessage('You already used this week\'s protection. Try again next week.');
    }
  };

  if (loading) {
    return (
      <Section className="relative py-section min-h-[70vh] flex items-center justify-center" tone="paper" contained>
        <p className="font-body text-ink/50">Loading…</p>
      </Section>
    );
  }

  // ---------- Not signed in: sign-in form ----------
  if (!user) {
    return (
      <Section className="relative py-section min-h-[70vh] flex items-center" tone="paper" contained>
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
              <label htmlFor="email" className="block font-body text-caption uppercase tracking-widest text-ink/50 mb-3">Email address</label>
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
                  <label htmlFor="password" className="block font-body text-caption uppercase tracking-widest text-ink/50 mb-3">Password</label>
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

              {authError && <p role="alert" className="font-body text-sm text-coral mb-2">{authError}</p>}
              {authHint && <p className="font-body text-xs text-ink/50 mb-4">{authHint}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-ink text-paper font-body text-sm px-6 py-4 uppercase tracking-wider hover:bg-ink/85 transition-colors disabled:opacity-50"
              >
                {submitting ? '...' : authMode === 'signin' ? 'Sign in' : authMode === 'signup' ? 'Create account' : 'Send reset link'}
              </button>

              <div className="mt-6 space-y-2 text-center">
                {authMode === 'signin' && (
                  <>
                    <button type="button" onClick={() => { setAuthMode('signup'); setAuthError(null); setAuthHint(null); }} className="block w-full font-body text-sm text-ink/60 hover:text-ink">
                      Don&apos;t have an account? <span className="text-coral">Create one</span>
                    </button>
                    <button type="button" onClick={() => { setAuthMode('forgot'); setAuthError(null); setAuthHint(null); }} className="block w-full font-body text-sm text-ink/60 hover:text-ink">
                      Forgot password?
                    </button>
                  </>
                )}
                {authMode === 'signup' && (
                  <button type="button" onClick={() => { setAuthMode('signin'); setAuthError(null); setAuthHint(null); }} className="block w-full font-body text-sm text-ink/60 hover:text-ink">
                    Already have an account? <span className="text-coral">Sign in</span>
                  </button>
                )}
                {authMode === 'forgot' && (
                  <button type="button" onClick={() => { setAuthMode('signin'); setAuthError(null); setAuthHint(null); }} className="block w-full font-body text-sm text-ink/60 hover:text-ink">
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
                  <Link href="/toolkit" className="block text-center font-body text-caption uppercase tracking-widest text-ink/60 hover:text-ink">
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

  // ---------- Signed in: account content ----------
  const todayDone = HABIT_IDS.filter((h) => trackerData.habitCompletions[h]?.[trackerData.currentDay]).length;
  const todayTotal = HABIT_IDS.length;

  return (
    <>
      {/* ============ The tracker ============ */}
      <Tracker hideMarquee />

      {/* ============ Premium tools ============ */}
      {profile?.is_premium ? (
        <>
          {/* Macro calculator inline */}
          <Section
            className="relative py-section"
            style={{ backgroundColor: '#4A9B9B' }}
            contained
          >
            <div className="max-w-5xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-8">
                <div className="md:col-span-5">
                  <p className="font-body text-caption uppercase text-paper/70 mb-3">
                    Macro calculator
                  </p>
                  <h2 className="font-display text-display-2 text-paper leading-[0.95]">
                    Know your numbers.
                  </h2>
                  <p className="font-body text-base text-paper/85 mt-4 max-w-md">
                    BMR, TDEE, protein, carbs, fat, water. Built for the 50-day challenge.
                  </p>
                </div>
                <div className="md:col-span-6 md:col-start-7 flex items-end">
                  <p className="font-body text-base text-paper/70">
                    Enter your stats, get your daily targets. Adjust for your goal.
                  </p>
                </div>
              </div>

              <MacroCalculatorInline />
            </div>
          </Section>

          {/* Timer + Board + To-do list */}
          <Section className="relative py-section" tone="paper" contained>
            <div className="max-w-5xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-12">
                <div className="md:col-span-5">
                  <p className="font-body text-caption uppercase tracking-widest text-ink/50 mb-3">
                    The timer
                  </p>
                  <Heading>Feed Your Brain.</Heading>
                  <p className="font-body text-base text-ink/70 mt-3 mb-8">
                    30 mins a day on a book or personal project. Start the timer, get to work.
                  </p>
                </div>
                <div className="md:col-span-6 md:col-start-7 flex items-end">
                  <p className="font-body text-base text-ink/70">
                    Set any custom time down to seconds. Pre-set at 30 mins for the Feed Your Brain rule.
                  </p>
                </div>
              </div>

              <div className="flex justify-center mb-16">
                <Timer
                  label="Feed Your Brain"
                  context="Read 5 books in 50 days · 30 mins/day on personal projects"
                  defaultMinutes={30}
                />
              </div>

              <p className="font-body text-caption uppercase tracking-widest text-ink/50 mb-3">
                The to-do list
              </p>
              <Heading>Capture first. Sort later.</Heading>
              <p className="font-body text-base text-ink/70 mt-3 mb-8">
                Things you don't want to lose. Drop them here, drag them to the board when you're ready.
              </p>
              <TodoList />

              <p className="font-body text-caption uppercase tracking-widest text-ink/50 mt-12 mb-3">
                The board
              </p>
              <Heading>To do · In progress · Done.</Heading>
              <p className="font-body text-base text-ink/70 mt-3 mb-8">
                Plan the 50 days. Add tasks, move them when you finish. Drag between columns, double-click a column name to rename, or add a new one.
              </p>
              <Board />
            </div>
          </Section>

          {/* The six features */}
          <Section
            className="relative py-section"
            style={{ backgroundColor: '#F2D9A2' }}
            contained
          >
            <div className="max-w-5xl mx-auto">
              <p className="font-body text-caption uppercase tracking-widest text-ink/50 mb-3">
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
        <Section
          className="relative py-section"
          tone="ink"
          contained
        >
          <div className="max-w-3xl mx-auto text-center">
            <p className="font-body text-caption uppercase text-coral mb-3">
              Free tier
            </p>
            <Title tone="dark">Unlock premium.</Title>
            <p className="font-body text-lg text-paper/70 mt-4 mb-8">
              Get the macro calculator, the timer, the project board, and the rest of the premium tools. One payment, yours forever.
            </p>
            <Link
              href="/upgrade"
              className="inline-flex items-center justify-center bg-coral text-paper font-body text-sm px-10 py-5 uppercase tracking-wider hover:bg-coral/85 transition-colors"
            >
              Unlock for £7.99
            </Link>
          </div>
        </Section>
      )}
    </>
  );
}

// ---------- Inline macro calculator ----------
function MacroCalculatorInline() {
  const [age, setAge] = useState('');
  const [sex, setSex] = useState<Sex | null>(null);
  const [heightVal, setHeightVal] = useState('');
  const [heightUnit, setHeightUnit] = useState<HeightUnit>('cm');
  const [weightVal, setWeightVal] = useState('');
  const [weightUnit, setWeightUnit] = useState<WeightUnit>('kg');
  const [bodyFat, setBodyFat] = useState('');
  const [activity, setActivity] = useState<Activity | null>(null);
  const [goal, setGoal] = useState<Goal>('loss');
  const [diet, setDiet] = useState<Diet>('balanced');
  const [results, setResults] = useState<ReturnType<typeof calculateMacros> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCalculate = () => {
    setError(null);
    if (!age || !sex) {
      setError('Enter age and select sex.');
      return;
    }
    const heightNum = parseFloat(heightVal);
    const weightNum = parseFloat(weightVal);
    if (!heightNum || !weightNum) {
      setError('Enter height and weight.');
      return;
    }
    if (!activity) {
      setError('Select activity level.');
      return;
    }
    const height = heightUnit === 'cm'
      ? { value: heightNum, unit: 'cm' as HeightUnit }
      : { value: heightNum, unit: 'ftin' as HeightUnit, feet: Math.floor(heightNum), inches: 0 };
    const weight = { value: weightNum, unit: weightUnit };
    const bodyFatNum = bodyFat ? parseFloat(bodyFat) : null;
    try {
      const r = calculateMacros({
        age: parseInt(age),
        sex,
        height,
        weight,
        bodyFat: bodyFatNum,
        activity,
        goal,
        diet,
      });
      setResults(r);
    } catch (e) {
      setError('Could not calculate. Check your inputs.');
    }
  };

  return (
    <div className="bg-paper border border-ink/10 p-6 md:p-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <CalculatorForm
          age={age}
          setAge={setAge}
          sex={sex}
          setSex={setSex}
          heightVal={heightVal}
          setHeightVal={setHeightVal}
          heightUnit={heightUnit}
          setHeightUnit={setHeightUnit}
          weightVal={weightVal}
          setWeightVal={setWeightVal}
          weightUnit={weightUnit}
          setWeightUnit={setWeightUnit}
          bodyFat={bodyFat}
          setBodyFat={setBodyFat}
          activity={activity}
          setActivity={setActivity}
          goal={goal}
          setGoal={setGoal}
          diet={diet}
          setDiet={setDiet}
        />
      </div>

      <div className="flex justify-end mb-6">
        <button
          onClick={handleCalculate}
          className="bg-ink text-paper font-body text-sm px-6 py-3 uppercase tracking-wider hover:bg-ink/85 transition-colors"
        >
          Calculate my macros
        </button>
      </div>

      {error && <p className="font-body text-sm text-coral mb-4">{error}</p>}

      {results && (
        <>
          <div className="border-t border-ink/10 pt-6 mb-4">
            <p className="font-body text-caption uppercase tracking-widest text-ink/50 mb-3">
              Daily calories
            </p>
            <p className="font-display text-5xl text-ink leading-none tabular-nums">
              {results.calories.toLocaleString()}
              <span className="text-lg text-ink/50 font-body font-normal ml-3">kcal</span>
            </p>
          </div>
          <div className="border-t border-ink/10">
            <Row label="Protein" grams={results.proteinG} kcal={results.proteinG * 4} total={results.calories} />
            <Row label="Carbs" grams={results.carbsG} kcal={results.carbsG * 4} total={results.calories} />
            <Row label="Fat" grams={results.fatG} kcal={results.fatG * 9} total={results.calories} />
            <Row label="Water" grams={results.waterL} suffix="L" />
          </div>
        </>
      )}
    </div>
  );
}

function Row({ label, grams, kcal, total, suffix }: { label: string; grams: number; kcal?: number; total?: number; suffix?: string }) {
  const pct = kcal !== undefined && total !== undefined ? Math.round((kcal / total) * 100) : 0;
  return (
    <div className="flex items-center justify-between py-4 border-b border-ink/10 last:border-b-0">
      <p className="font-body text-caption uppercase tracking-widest text-ink/50">{label}</p>
      <div className="flex items-baseline gap-6">
        <p className="font-display text-2xl text-ink tabular-nums leading-none">
          {grams}<span className="text-base text-ink/50 font-body font-normal ml-1">{suffix || 'g'}</span>
        </p>
        {kcal !== undefined && total !== undefined && (
          <p className="font-body text-sm text-ink/60 tabular-nums">
            {pct}% <span className="text-ink/40">·</span> {kcal} kcal
          </p>
        )}
      </div>
    </div>
  );
}
