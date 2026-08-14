'use client';

import { useEffect, useMemo, useState } from 'react';
import Section from './Section';
import Heading from './Heading';
import HabitIcon, { HabitIconName } from './HabitIcon';
import Marquee from './Marquee';
import CellConfetti from './CellConfetti';
import ConfirmDialog from './ConfirmDialog';
import { useAuth } from '@/contexts/AuthContext';
import { useTrackerState, TrackerDay } from '@/hooks/useTrackerState';
import { useStreakProtection } from '@/hooks/useStreakProtection';
import { usePremium } from '@/hooks/usePremium';
import { dateKeyLocal, formatDateKeyShort, dayKeyFromStart } from '@/lib/dates';

interface Habit {
  id: string;
  icon: HabitIconName;
  name: string;
}

const habits: Habit[] = [
  { id: 'chill-out', icon: 'chill-out', name: 'Chill Out' },
  { id: 'fuel-right', icon: 'fuel-right', name: 'Fuel Right' },
  { id: 'crispy-clarity', icon: 'crispy-clarity', name: 'Crispy Clarity' },
  { id: 'fresh-lungs', icon: 'fresh-lungs', name: 'Fresh Lungs' },
  { id: 'open-mind', icon: 'open-mind', name: 'Open Mind' },
  { id: 'move-body', icon: 'move-body', name: 'Move Your Body' },
  { id: 'wet-lips', icon: 'wet-lips', name: 'Wet The Lips' },
  { id: 'step-it-up', icon: 'step-it-up', name: 'Step It Up' },
  { id: 'feed-brain', icon: 'feed-brain', name: 'Feed Your Brain' },
];

const HABIT_IDS = habits.map((h) => h.id);

function calculateStreak(days: TrackerDay[]): {
  current: number;
  longest: number;
} {
  let longest = 0;
  let current = 0;
  for (const day of days) {
    if (day.status === 'complete') {
      current++;
    } else if (day.status === 'past-incomplete') {
      longest = Math.max(longest, current);
      current = 0;
    } else if (day.status === 'today') {
      // preserve current run, do not break yet
    }
  }
  longest = Math.max(longest, current);
  return { current, longest };
}

interface StartSplashProps {
  hasSession: boolean;
  onStart: (iso?: string) => Promise<void> | void;
  onDiscardOld: () => void;
}

function StartSplash({ hasSession, onStart, onDiscardOld }: StartSplashProps) {
  const today = dateKeyLocal(new Date());
  const minDate = new Date();
  minDate.setDate(minDate.getDate() - 30);
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 30);

  const [showPicker, setShowPicker] = useState(false);
  const [customDate, setCustomDate] = useState<string>(today);
  const [busy, setBusy] = useState(false);

  const handleStart = async (iso?: string) => {
    setBusy(true);
    await onStart(iso);
    setBusy(false);
  };

  return (
    <div className="max-w-2xl mx-auto text-center">
      <p className="font-body text-caption uppercase tracking-widest text-coral mb-4">
        Day 0 · The 50-day challenge
      </p>
      <h2 className="font-display text-display-2 text-ink mb-6 leading-[1.05]">
        Start the 50 days.
      </h2>
      <p className="font-body text-lg text-ink/70 mb-8 max-w-md mx-auto">
        Pick the day you start. We count to day 50 from there and
        roll over automatically at midnight each day.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 items-center justify-center mb-4">
        <button
          type="button"
          onClick={() => handleStart()}
          disabled={busy}
          className="inline-flex items-center justify-center bg-ink hover:bg-ink/85 transition-colors px-8 py-4 font-body text-caption uppercase tracking-widest text-paper disabled:opacity-50"
        >
          {busy ? 'Starting…' : 'Start today'}
        </button>
        <button
          type="button"
          onClick={() => setShowPicker((v) => !v)}
          className="inline-flex items-center justify-center border border-ink/30 hover:border-ink px-8 py-4 font-body text-caption uppercase tracking-widest text-ink/70 hover:text-ink transition-colors"
        >
          {showPicker ? 'Cancel custom date' : 'Pick a different day'}
        </button>
      </div>

      {showPicker && (
        <form
          className="max-w-sm mx-auto mb-6"
          onSubmit={(e) => {
            e.preventDefault();
            const iso = `${customDate}T00:00:00`;
            handleStart(iso);
          }}
        >
          <label
            htmlFor="start-date"
            className="block font-body text-caption uppercase tracking-widest text-ink/60 mb-2"
          >
            Start date
          </label>
          <input
            id="start-date"
            type="date"
            value={customDate}
            min={dateKeyLocal(minDate)}
            max={dateKeyLocal(maxDate)}
            onChange={(e) => setCustomDate(e.target.value)}
            className="w-full px-3 py-3 border border-ink/30 bg-white text-ink font-body focus:border-coral outline-none"
          />
          <button
            type="submit"
            disabled={busy}
            className="mt-3 inline-flex items-center justify-center bg-coral hover:bg-coral/85 transition-colors px-6 py-3 font-body text-caption uppercase tracking-widest text-paper disabled:opacity-50"
          >
            {busy ? 'Starting…' : 'Start on this day'}
          </button>
        </form>
      )}

      <p className="font-body text-xs text-ink/40 mt-6">
        {hasSession
          ? 'Your start date syncs to your account across devices.'
          : 'Starting as a guest. Your progress is saved on this device.'}
      </p>

      <button
        type="button"
        onClick={onDiscardOld}
        className="mt-6 font-body text-caption uppercase tracking-widest text-ink/40 hover:text-coral underline underline-offset-4 transition-colors"
      >
        Discard old data and start fresh
      </button>
    </div>
  );
}

interface ChipStripProps {
  days: TrackerDay[];
  startDate: string;
  currentDay: number;
}

function ChipStrip({ days, startDate }: ChipStripProps) {
  return (
    <div className="overflow-x-auto -mx-6 px-6 md:-mx-10 md:px-10 pb-2">
      <div className="flex gap-1.5 min-w-fit">
        {days.map((day) => {
          const isToday = day.status === 'today';
          const isComplete = day.status === 'complete';
          const isPast = day.status === 'past-incomplete';
          const isFuture = day.status === 'future';
          const dateKey = dayKeyFromStart(startDate, day.dayNumber);
          return (
            <div
              key={day.dayNumber}
              className={`flex flex-col items-center justify-center w-10 h-10 rounded-md font-body text-caption tabular-nums flex-shrink-0 ${
                isToday
                  ? 'bg-coral text-paper ring-2 ring-coral/40 ring-offset-2 ring-offset-paper'
                  : isComplete
                  ? 'bg-coral/15 text-coral border border-coral/40'
                  : isPast
                  ? 'bg-ink/5 text-ink/60 border border-ink/15'
                  : 'bg-transparent text-ink/30 border border-ink/10'
              }`}
              title={`Day ${day.dayNumber} — ${formatDateKeyShort(dateKey)} — ${day.completedCount}/9`}
              aria-label={`Day ${day.dayNumber}, ${formatDateKeyShort(dateKey)}, ${day.completedCount} of 9 complete`}
            >
              {isComplete ? '✓' : day.dayNumber}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Tracker({ hideMarquee = false }: { hideMarquee?: boolean }) {
  const { user, loading: authLoading } = useAuth();
  const { isPremium } = usePremium();
  const tracker = useTrackerState();
  const { hasProtectionForWeek } = useStreakProtection();

  const [pulsingHabit, setPulsingHabit] = useState<string | null>(null);
  const [confettiKey, setConfettiKey] = useState(0);
  const [confettiIntensity, setConfettiIntensity] = useState<'small' | 'big'>('small');
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  const streak = useMemo(
    () => calculateStreak(tracker.days),
    [tracker.days]
  );

  const handleToggle = (habitId: string) => {
    setPulsingHabit(habitId);
    setTimeout(() => setPulsingHabit(null), 600);
    const wasDone = !!tracker.todayTaps[habitId];
    tracker.toggleHabit(habitId);

    // Only fire confetti when a habit goes from un-done -> done.
    // The tap that completes the full 9/9 day gets the big burst;
    // every other completion gets the small one.
    if (!wasDone) {
      const nextCount =
        HABIT_IDS.filter((id) => !!tracker.todayTaps[id]).length + 1;
      if (nextCount === HABIT_IDS.length) {
        setConfettiIntensity('big');
        setConfettiKey((k) => k + 1);
      } else {
        setConfettiIntensity('small');
        setConfettiKey((k) => k + 1);
      }
    }
  };

  const handleUseStreakProtection = async () => {
    if (!isPremium) return;
    if (hasProtectionForWeek(new Date())) return;
    await tracker.useStreakProtectionForWeek();
  };

  const handleStart = async (iso?: string) => {
    const resolved = iso || `${dateKeyLocal(new Date())}T00:00:00`;
    tracker.updateStartDate(resolved);
  };

  const handleDiscardOld = () => {
    setResetConfirmOpen(true);
  };

  const performReset = async () => {
    await tracker.reset();
  };

  if (authLoading || !tracker.loaded) {
    return (
      <Section
        id="tracker"
        className="relative py-section overflow-hidden"
        contained
      >
        <div className="min-h-[400px] flex items-center justify-center">
          <p className="font-body text-ink/50">Loading…</p>
        </div>
      </Section>
    );
  }

  if (!tracker.hasStarted) {
    return (
      <Section
        id="tracker"
        tone="paper"
        className={`relative ${hideMarquee ? 'pt-16 md:pt-24 pb-2 md:pb-4' : 'pt-40 md:pt-56 pb-section'} overflow-hidden`}
        contained
      >
        <h2 className="sr-only">Tracker</h2>

        {!hideMarquee && (
          <div className="absolute top-0 left-0 right-0 h-32 md:h-52 overflow-hidden pointer-events-none z-0 flex items-center">
            <Marquee
              text="CHECK THE BOX · BUILD THE STREAK · DAY BY DAY"
              separator="✦"
              speed={240}
              textClassName="text-ink/10"
            />
          </div>
        )}

        <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-10">
          <StartSplash
            hasSession={!!user}
            onStart={handleStart}
            onDiscardOld={handleDiscardOld}
          />
        </div>
      </Section>
    );
  }

  const todayKey = dateKeyLocal(new Date());

  return (
    <Section
      id="tracker"
      tone="paper"
      className={`relative ${hideMarquee ? 'pt-16 md:pt-24 pb-2 md:pb-4' : 'pt-40 md:pt-56 pb-section'} overflow-hidden`}
      contained
    >
      <h2 className="sr-only">Tracker</h2>

      {!hideMarquee && (
        <div className="absolute top-0 left-0 right-0 h-32 md:h-52 overflow-hidden pointer-events-none z-0 flex items-center">
          <Marquee
            text="CHECK THE BOX · BUILD THE STREAK · DAY BY DAY"
            separator="✦"
            speed={240}
            textClassName="text-ink/10"
          />
        </div>
      )}

      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-10">
        {/* Header */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-8">
          <div className="md:col-span-8">
            <p className="font-body text-caption uppercase tracking-widest text-coral mb-3">
              Day {tracker.currentDay} of 50 · {formatDateKeyShort(todayKey)}
            </p>
            <h2 className="font-display text-display-2 text-ink leading-[1.05]">
              {streak.current} day{streak.current === 1 ? '' : 's'} in a row.
            </h2>
            <p className="font-body text-base text-ink/60 mt-2">
              best: {streak.longest} day{streak.longest === 1 ? '' : 's'}
            </p>
          </div>
          {!isPremium && (
            <div className="md:col-span-4 md:flex md:items-end">
              <a
                href="/#sign-up"
                className="block bg-coral hover:bg-coral/90 transition-colors p-5 text-paper text-left"
              >
                <p className="font-body text-caption uppercase tracking-widest text-paper/90 mb-2">
                  🍌 Streak protection
                </p>
                <p className="font-display text-h3 text-paper leading-tight mb-2">
                  Unlock the full toolkit.
                </p>
                <p className="font-body text-sm text-paper/90">
                  Streak protection, water tracker, food log, macrocalc,
                  kanban. €5.99, yours forever.
                </p>
                <p className="font-body text-caption uppercase tracking-widest text-paper inline-flex items-center gap-2 mt-3">
                  See the toolkit →
                </p>
              </a>
            </div>
          )}
          {isPremium && (
            <div className="md:col-span-4 md:flex md:items-end">
              <div className="bg-coral/10 border border-coral/30 p-5 text-left w-full">
                <p className="font-body text-caption uppercase tracking-widest text-coral mb-2">
                  🛡 Streak protection
                </p>
                <p className="font-display text-h3 text-ink leading-tight mb-2">
                  {hasProtectionForWeek(new Date())
                    ? 'Used this week.'
                    : 'One free pass this week.'}
                </p>
                <p className="font-body text-sm text-ink/70">
                  {hasProtectionForWeek(new Date())
                    ? 'Resets Sunday midnight. Miss a day with no penalty.'
                    : 'Use it before midnight Sunday if you miss a day.'}
                </p>
                {!hasProtectionForWeek(new Date()) && (
                  <button
                    type="button"
                    onClick={handleUseStreakProtection}
                    className="mt-3 inline-flex items-center justify-center bg-coral hover:bg-coral/85 transition-colors px-5 py-2.5 font-body text-caption uppercase tracking-widest text-paper"
                  >
                    Use my streak protection
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 50-day chip strip */}
        {tracker.startDate && (
          <div className="mb-10">
            <ChipStrip
              days={tracker.days}
              startDate={tracker.startDate}
              currentDay={tracker.currentDay}
            />
          </div>
        )}

        {/* Today's habit grid */}
        <Heading>Today.</Heading>
        <p className="font-body text-base text-ink/60 mt-2 mb-6">
          Tap each habit as you do it. Progress saves every tap.
        </p>

        <div className="grid grid-cols-3 md:grid-cols-9 gap-2 md:gap-3 mb-8">
          {habits.map((habit) => {
            const done = !!tracker.todayTaps[habit.id];
            return (
              <button
                key={habit.id}
                type="button"
                aria-pressed={done}
                onClick={() => handleToggle(habit.id)}
                className={`flex flex-col items-center p-3 md:p-4 border transition-colors ${
                  done
                    ? 'bg-coral/10 border-coral/40'
                    : 'bg-cream/20 border-ink/15 hover:border-ink/40'
                } ${pulsingHabit === habit.id ? 'animate-pulse' : ''}`}
              >
                <HabitIcon
                  name={habit.icon}
                  size={56}
                  className="md:!w-16 md:!h-auto mb-2"
                />
                <span className="font-body text-caption uppercase tracking-widest text-ink text-center leading-tight">
                  {habit.name}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <button
            type="button"
            onClick={() => setResetConfirmOpen(true)}
            className="font-body text-caption uppercase tracking-widest text-ink/40 hover:text-coral underline underline-offset-4 transition-colors"
          >
            Reset all progress
          </button>
          <p className="font-body text-xs text-ink/40">
            Saved on this device{user ? ' + your account' : ''}.
          </p>
        </div>
      </div>

      <CellConfetti key={confettiKey} show={confettiKey > 0} intensity={confettiIntensity} />

      <ConfirmDialog
        open={resetConfirmOpen}
        onClose={() => setResetConfirmOpen(false)}
        title="Reset all progress?"
        description="This wipes today's taps, every closed day in your archive, your water log, food log, and any streak-protection you've used. Your macro profile and food favourites stay where they are. There's no undo."
        confirmLabel="Yes, reset it all"
        destructive
        onConfirm={performReset}
      />
    </Section>
  );
}
