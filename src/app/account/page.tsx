'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Section from '@/components/Section';
import Heading from '@/components/Heading';
import Title from '@/components/Title';
import { Board, TodoList, useBoardState } from '@/components/ProjectBoard';
import CalculatorForm from '@/components/macro-calculator/CalculatorForm';
import { useAuth } from '@/contexts/AuthContext';
import { useTrackerState } from '@/hooks/useTrackerState';
import { useStreakProtection } from '@/hooks/useStreakProtection';
import { usePremium } from '@/hooks/usePremium';
import { calculateMacros } from '@/components/macro-calculator/formulas';
import type { Goal, Diet, Activity, Sex, HeightUnit, WeightUnit } from '@/components/macro-calculator/types';
import WaterCounter from '@/components/WaterCounter';
import Tracker from '@/components/Tracker';
import PremiumGate from '@/components/PremiumGate';
import AccountNav from '@/components/AccountNav';
import FoodDatabase from '@/components/food-database/FoodDatabase';
import AccountWorkouts from '@/components/AccountWorkouts';
import BuddyPurchasePicker from '@/components/BuddyPurchasePicker';
import FeedYourBrain from '@/components/FeedYourBrain';
import { useMacroTargets } from '@/hooks/useMacroTargets';
import { saveJson } from '@/lib/storage';
import { useMacroProfile, timeSince } from '@/hooks/useMacroProfile';
import { getRememberMe, setRememberMe } from '@/lib/supabase';
import MyMotivator from '@/components/MyMotivator';
import CollapsibleSection from '@/components/CollapsibleSection';
import { useAccountLayout, DEFAULT_ORDER } from '@/hooks/useAccountLayout';

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

export default function AccountPage() {
  const router = useRouter();
  const { user, profile, loading, signIn, signUp, signOut, resetPassword } = useAuth();
  const tracker = useTrackerState();
  const trackerData = tracker.data;
  const trackerLoaded = tracker.loaded;
  const currentDay = tracker.currentDay;
  const todayTaps = tracker.todayTaps;
  const { isPremium } = usePremium();
  const { totalUsed, hasProtectionForWeek, redeemProtection } = useStreakProtection();
  const layout = useAccountLayout(user?.id ?? null);
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  // Drag-and-drop state for premium reorder. The dragging id and
  // the currently hovered section live here so all CollapsibleSection
  // children can read them and render the right indicator.
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropHover, setDropHover] = useState<{ id: string; side: 'before' | 'after' } | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMeState] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authHint, setAuthHint] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);
  const [streakRedeeming, setStreakRedeeming] = useState(false);
  const [streakMessage, setStreakMessage] = useState<string | null>(null);
  const { targets } = useMacroTargets();

  useEffect(() => {
    setRememberMeState(getRememberMe());
  }, []);

  const challengeStarted = profile?.challenge_started_at
    ? new Date(profile.challenge_started_at).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '—';

  const completedDays = (() => {
    let n = 0;
    Object.values(trackerData.closedDays || {}).forEach((day) => {
      Object.values(day || {}).forEach((done) => { if (done) n++; });
    });
    Object.values(trackerData.pendingTaps || {}).forEach((done) => { if (done) n++; });
    return n;
  })();
  const totalDays = Math.max(0, trackerData.startDate ? Math.floor((Date.now() - new Date(trackerData.startDate).getTime()) / 86_400_000) : 0);
  const completionPct = totalDays > 0 ? Math.round((completedDays / (totalDays * 9)) * 100) : 0;
  const progressPct = Math.min(100, Math.round((totalDays / 50) * 100));

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitting(true);
    setAuthError(null);
    setAuthHint(null);
    setRememberMe(rememberMe);

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
    const success = await redeemProtection(currentDay);
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
                  <div className="relative mb-4">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={8}
                      disabled={submitting}
                      className="w-full p-4 pr-12 bg-cream/30 border-2 border-ink/20 text-ink font-body focus:border-ink outline-none rounded-none disabled:opacity-50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      aria-pressed={showPassword}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-ink/40 hover:text-ink transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                          <path d="M14.12 14.12A3 3 0 1 1 9.88 9.88" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {authMode === 'signin' && (
                    <label className="flex items-center gap-3 mb-6 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMeState(e.target.checked)}
                        className="w-5 h-5 accent-ink cursor-pointer"
                        aria-describedby="remember-me-hint"
                      />
                      <span className="font-body text-sm text-ink/80">
                        Remember me for 7 days
                      </span>
                      <span id="remember-me-hint" className="sr-only">
                        When checked, you stay signed in for 7 days. When unchecked, you will need to sign in again when you close the browser.
                      </span>
                    </label>
                  )}
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
                  <Link href="/#sign-up" className="block text-center font-body text-caption uppercase tracking-widest text-ink/60 hover:text-ink">
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
  const todayDone = HABIT_IDS.filter((h) => todayTaps[h]).length;
  const todayTotal = HABIT_IDS.length;

  return (
    <>
      {/* ============ Jump-to nav (top of page, sticky under main nav) ============ */}
      <AccountNav
        sections={[
          { id: 'tracker', label: 'Tracker' },
          { id: 'my-motivator', label: 'Motivator' },
          { id: 'buddy', label: 'Buddy' },
          { id: 'feed-your-brain', label: 'Feed Brain' },
          { id: 'workouts', label: 'Workouts' },
          { id: 'macro-calc', label: 'Macro calc' },
          ...(profile?.is_premium
            ? [
                { id: 'hydration', label: 'Hydration' },
                { id: 'food-database', label: 'Foods' },
                { id: 'todo', label: 'To-do' },
                { id: 'board', label: 'Board' },
              ]
            : []),
        ]}
      />

      {/* ============ Collapsible + reorderable middle sections ============ */}
      {layout.order
        .filter((id) => {
          // Premium-only sections stay hidden (not just unrendered)
          // for free users so the layout doesn't waste a render slot.
          if (!profile?.is_premium) {
            return !['hydration', 'food-database', 'todo', 'board'].includes(id);
          }
          return true;
        })
        .map((id) => {
          const collapsed = layout.isCollapsed(id);
          const idx = layout.indexOf(id);
          const isPremium = !!profile?.is_premium;
          const wrapper = (content: React.ReactNode) => (
            <CollapsibleSection
              key={id}
              id={id}
              title={SECTION_TITLES[id] ?? id}
              collapsed={collapsed}
              onToggle={() => layout.toggleCollapse(id)}
              draggable={isPremium}
              isDragging={draggingId === id}
              isDragHover={
                draggingId && draggingId !== id && dropHover?.id === id
                  ? dropHover.side
                  : null
              }
              onDragStart={isPremium ? () => setDraggingId(id) : undefined}
              onDragEnd={
                isPremium
                  ? () => {
                      setDraggingId(null);
                      setDropHover(null);
                    }
                  : undefined
              }
              onDragOver={
                isPremium
                  ? (side) => setDropHover({ id, side })
                  : undefined
              }
              onDragLeave={
                isPremium
                  ? () => {
                      if (dropHover?.id === id) setDropHover(null);
                    }
                  : undefined
              }
              onDrop={
                isPremium
                  ? (side) => {
                      if (draggingId === null || draggingId === id) return;
                      const fromIdx = layout.order.indexOf(draggingId);
                      const targetIdx = layout.order.indexOf(id);
                      if (fromIdx < 0 || targetIdx < 0) return;
                      let toIdx = side === 'before' ? targetIdx : targetIdx + 1;
                      if (toIdx > fromIdx) toIdx -= 1;
                      layout.moveSection(fromIdx, toIdx);
                      setDraggingId(null);
                      setDropHover(null);
                    }
                  : undefined
              }
            >
              {content}
            </CollapsibleSection>
          );
          switch (id) {
            case 'tracker':
              return wrapper(<Tracker hideMarquee />);
            case 'my-motivator':
              return wrapper(<MyMotivator />);
            case 'buddy':
              return wrapper(
                <Section
                  className="relative pt-12 md:pt-16 pb-section"
                  tone="paper"
                  contained
                >
                  <div className="max-w-5xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-8">
                      <div className="md:col-span-7">
                        <p className="font-body text-caption uppercase tracking-widest text-coral mb-3">
                          Buddy
                        </p>
                        <Heading>Shout ya mate</Heading>
                        <p className="font-body text-base text-ink/70 mt-3 mb-8 max-w-xl">
                          The finish line is so much sweeter with mates. Tag in a
                          mate and You&apos;ll see each other&apos;s streaks on the
                          tracker — one more reason to keep showing up.
                        </p>
                      </div>
                    </div>
                    <BuddyPurchasePicker variant="wide" mode="add_buddy" />
                  </div>
                </Section>
              );
            case 'feed-your-brain':
              return wrapper(<FeedYourBrain withTimer />);
            case 'workouts':
              return wrapper(<AccountWorkouts />);
            case 'macro-calc':
              return wrapper(
                <Section
                  className="relative pt-12 md:pt-16 pb-section"
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
              );
            case 'hydration':
              return wrapper(
                <Section
                  className="relative pt-12 md:pt-16 pb-section"
                  tone="paper"
                  contained
                >
                  <div className="max-w-5xl mx-auto">
                    <p className="font-body text-caption uppercase tracking-widest text-ink/50 mb-3">
                      Hydration
                    </p>
                    <Heading>2.5 litres a day.</Heading>
                    <p className="font-body text-base text-ink/70 mt-3 mb-8 max-w-2xl">
                      Tap a preset or enter a custom amount. Saved to your account daily.
                    </p>
                    <WaterCounter />
                  </div>
                </Section>
              );
            case 'food-database':
              return wrapper(
                <Section
                  className="relative pt-12 md:pt-16 pb-section"
                  tone="paper"
                  contained
                >
                  <div className="max-w-5xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-8">
                      <div className="md:col-span-7">
                        <p className="font-body text-caption uppercase tracking-widest text-ink/50 mb-3">
                          Foods
                        </p>
                        <Heading>Track what you eat.</Heading>
                        <p className="font-body text-base text-ink/70 mt-3 max-w-xl">
                          Search a database of common foods, pick a portion, tag a meal. Totals fill up against your macro targets as you log.
                        </p>
                      </div>
                    </div>
                    <PremiumGate
                      feature="food log"
                      description="Search over 5,000 foods from an international taste palette, log portions, tag meals, totals roll up against your daily macro targets in seconds. Premium unlocks the food database and the macro math."
                    >
                      <FoodDatabase targets={targets} />
                    </PremiumGate>
                  </div>
                </Section>
              );
            case 'todo':
              return wrapper(
                <Section
                  className="relative pt-12 md:pt-16 pb-section"
                  tone="paper"
                  contained
                >
                  <div className="max-w-5xl mx-auto">
                    <p className="font-body text-caption uppercase tracking-widest text-ink/50 mb-3">
                      The to-do list
                    </p>
                    <Heading>Capture first. Sort later.</Heading>
                    <p className="font-body text-base text-ink/70 mt-3 mb-8">
                      Things you don&apos;t want to lose. Drop them here, drag them to the board when you&apos;re ready.
                    </p>
                    <TodoList />
                  </div>
                </Section>
              );
            case 'board':
              return wrapper(
                <Section
                  className="relative pt-12 md:pt-16 pb-section"
                  tone="paper"
                  contained
                >
                  <div className="max-w-5xl mx-auto">
                    <p className="font-body text-caption uppercase tracking-widest text-ink/50 mb-3">
                      The board
                    </p>
                    <Heading>To do · In progress · Done.</Heading>
                    <p className="font-body text-base text-ink/70 mt-3 mb-8">
                      Plan the 50 days. Add tasks, move them when you finish. Drag between columns, double-click a column name to rename, or add a new one.
                    </p>
                    <Board />
                  </div>
                </Section>
              );
            default:
              return null;
          }
        })}

      {/* ============ Bottom call-to-action (free users) ============ */}
      {!profile?.is_premium && (
        <Section
          className="relative pt-12 md:pt-16 pb-section"
          tone="ink"
          contained
        >
          <div className="max-w-3xl mx-auto text-center">
            <p className="font-body text-caption uppercase text-coral mb-3">
              Free tier
            </p>
            <Title tone="dark">Unlock premium.</Title>
            <p className="font-body text-lg text-paper/70 mt-4 mb-8">
              Unlock the detailed macro food tracker, streak protection, multi-purpose timer, kanban board, and to-do list. One payment, yours forever.
            </p>
            <Link
              href="/upgrade"
              className="inline-flex items-center justify-center bg-coral text-paper font-body text-sm px-10 py-5 uppercase tracking-wider hover:bg-coral/85 transition-colors"
            >
              Sign up for €5.99
            </Link>
            <p className="font-body text-caption uppercase tracking-widest text-ink/40 mt-3">
              The price of a caneca · one-time · yours forever
            </p>
          </div>
        </Section>
      )}
    </>
  );
}

const SECTION_TITLES: Record<string, string> = {
  'tracker': 'The tracker',
  'my-motivator': 'My motivator',
  'buddy': 'Buddy',
  'feed-your-brain': 'Feed your brain',
  'workouts': 'Workouts',
  'macro-calc': 'Macro calculator',
  'hydration': 'Hydration',
  'food-database': 'Food database',
  'todo': 'To-do list',
  'board': 'Board',
};

// ---------- Inline macro calculator ----------
function MacroCalculatorInline() {
  const { profile: savedProfile, loaded: profileLoaded, save: saveProfile } = useMacroProfile();
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
  const [saveError, setSaveError] = useState<string | null>(null);

  // Pre-fill from saved profile on first load so returning users
  // don't have to re-enter their stats.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    if (hydrated || !profileLoaded || !savedProfile) return;
    setAge(String(savedProfile.age));
    setSex(savedProfile.sex);
    setHeightUnit('cm');
    setHeightVal(String(Math.round(savedProfile.height_cm)));
    setWeightUnit('kg');
    setWeightVal(String(Math.round(savedProfile.weight_kg)));
    setBodyFat(savedProfile.body_fat != null ? String(savedProfile.body_fat) : '');
    setActivity(savedProfile.activity);
    setGoal(savedProfile.goal);
    setDiet(savedProfile.diet);
    if (!results) {
      setResults({
        bmr: 0,
        tdee: 0,
        calories: savedProfile.results_kcal,
        proteinG: savedProfile.results_protein,
        carbsG: savedProfile.results_carbs,
        fatG: savedProfile.results_fat,
        waterL: savedProfile.results_water,
        // Placeholders for the new fields. Recalculation fills them
        // in; we don't recompute from the saved kcal/protein/etc
        // because that would require re-loading the input state.
        workoutKcal: 0,
        steps10kKcal: 0,
      });
    }
    setHydrated(true);
  }, [hydrated, profileLoaded, savedProfile, results]);

  const handleCalculate = async () => {
    setError(null);
    setSaveError(null);
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
    // Normalise to metric for storage
    const height_cm = heightUnit === 'cm'
      ? heightNum
      : (Math.floor(heightNum) * 12 + 0) * 2.54;
    const weight_kg = weightUnit === 'kg' ? weightNum : weightNum * 0.453592;
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
      saveJson('fit50-macro-results-v1', r);
      window.dispatchEvent(new CustomEvent('fit50-macro-results-changed'));
      // Persist the inputs + results to the user's profile
      const saved = await saveProfile({
        age: parseInt(age),
        sex,
        height_cm: Math.round(height_cm * 10) / 10,
        weight_kg: Math.round(weight_kg * 10) / 10,
        body_fat: bodyFatNum,
        activity,
        goal,
        diet,
        results: r,
      });
      if (!saved.ok) {
        setSaveError(saved.error || 'Could not save profile.');
      }
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

      <div className="flex justify-center md:justify-end mb-6">
        <button
          onClick={handleCalculate}
          className="bg-ink text-paper font-body text-sm px-6 py-3 uppercase tracking-wider hover:bg-ink/85 transition-colors"
        >
          {results ? 'Recalculate' : 'Calculate my macros'}
        </button>
      </div>

      {profileLoaded && savedProfile && (
        <p className="font-body text-caption uppercase tracking-widest text-ink/50 text-center md:text-right mb-4">
          Macro profile · last saved {timeSince(savedProfile.calculated_at)} · synced to your account
        </p>
      )}

      {saveError && (
        <div className="border border-coral/40 bg-coral/5 p-3 mb-4">
          <p className="font-body text-caption uppercase tracking-widest text-coral mb-1">
            Could not sync profile
          </p>
          <p className="font-body text-sm text-ink/80">{saveError}</p>
        </div>
      )}

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
