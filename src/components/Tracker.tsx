'use client';

import { useState, useEffect } from 'react';
import Section from './Section';
import Heading from './Heading';
import HabitIcon, { HabitIconName } from './HabitIcon';
import Marquee from './Marquee';
import BalloonBurst from './BalloonBurst';
import CellConfetti from './CellConfetti';
import { useAuth } from '@/contexts/AuthContext';
import { useSyncTracker } from '@/hooks/useSyncTracker';
import { useStreakProtection } from '@/hooks/useStreakProtection';
import { usePremium } from '@/hooks/usePremium';

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

function calculateStreak(
  completions: Record<string, Record<number, boolean>>,
  currentDay: number
): { streak: number; longest: number } {
  let longest = 0;
  let currentStreak = 0;

  for (let day = 1; day <= currentDay; day++) {
    let completedCount = 0;
    HABIT_IDS.forEach((habitId) => {
      if (completions[habitId]?.[day]) completedCount++;
    });

    if (completedCount >= 7) {
      currentStreak++;
    } else if (completedCount < 5) {
      longest = Math.max(longest, currentStreak);
      currentStreak = 0;
    }
  }

  longest = Math.max(longest, currentStreak);
  return { streak: currentStreak, longest };
}

export default function Tracker({ hideMarquee = false }: { hideMarquee?: boolean }) {
  const { user, loading: authLoading } = useAuth();
  const { isPremium } = usePremium();
  const { data, loaded, toggleHabit, advanceDay, reset } = useSyncTracker();
  const { getProtectedDays, hasProtectionForWeek, redeemProtection } = useStreakProtection();

  const protectedDays = getProtectedDays();

  const streak = calculateStreak(data.habitCompletions, data.currentDay);
  const today = data.currentDay;
  const todayCompleted = HABIT_IDS.filter((id) => data.habitCompletions[id]?.[today]).length;
  const progressPct = Math.round((todayCompleted / 9) * 100);
  const isCubeSolved = todayCompleted === 9;

  const [pulsingHabit, setPulsingHabit] = useState<string | null>(null);
  const [balloons, setBalloons] = useState(false);

  const handleToggle = (habitId: string, day: number) => {
    const wasDone = !!data.habitCompletions[habitId]?.[day];
    if (!wasDone) {
      setPulsingHabit(habitId);
      setTimeout(() => setPulsingHabit(null), 600);
    }
    toggleHabit(habitId, day);

    if (!wasDone) {
      // After toggling, will the day be complete?
      const newCompleted = HABIT_IDS.filter((id) => {
        if (id === habitId) return true;
        return !!data.habitCompletions[id]?.[day];
      }).length;
      if (newCompleted === 9) {
        setTimeout(() => {
          setBalloons(true);
          setTimeout(() => setBalloons(false), 2400);
        }, 300);
      }
    }
  };

  const handleAdvance = async () => {
    if (data.currentDay >= 50) return;
    advanceDay();
    if (isPremium) {
      const weekHad = hasProtectionForWeek(new Date());
      if (!weekHad) {
        await redeemProtection(today);
      }
    }
  };

  const handleUseBanana = async () => {
    if (!isPremium) return;
    if (hasProtectionForWeek(new Date())) return;
    await redeemProtection(today);
  };

  if (authLoading || !loaded) {
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

  return (
    <Section
      id="tracker"
      className={`relative ${hideMarquee ? 'pt-16 md:pt-24 pb-4 md:pb-6' : 'pt-40 md:pt-56 pb-section'} overflow-hidden`}
      contained
    >
      <h2 className="sr-only">Tracker</h2>

      {!hideMarquee && (
        <div className="absolute top-0 left-0 right-0 h-32 md:h-52 overflow-hidden pointer-events-none z-0 flex items-center">
          <Marquee
            text="CHECK THE BOX · BUILD THE STREAK · DAY BY DAY"
            separator="✦"
            speed={240}
            textClassName="text-coral/55"
          />
        </div>
      )}

      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-10 pb-section">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-12 md:mb-16">
          <div className="md:col-span-7">
            <Heading as="h2" size="h1">
              Check the box.<br />
              Build the streak.
            </Heading>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 bg-teal text-paper p-8 md:p-10 flex flex-col">
            <p className="font-body text-caption uppercase text-paper/70 mb-3">
              Current streak
            </p>
            <div className="flex items-baseline gap-3 mb-2">
              <span
                className="font-display leading-none"
                style={{ fontSize: 'clamp(6rem, 12vw, 9rem)', letterSpacing: '-0.04em', color: '#F2D9A2' }}
              >
                {streak.streak}
              </span>
              <span className="font-body text-paper/80 text-lg">days</span>
            </div>
            <p className="font-body text-sm text-paper/70 mb-8">
              in a row · best: {streak.longest} {streak.longest === 1 ? 'day' : 'days'}
            </p>

            {!isPremium && (
              <a
                href="/upgrade"
                className="block bg-paper/10 hover:bg-paper/15 transition-colors p-4 mb-4"
              >
                <p className="font-body text-caption uppercase text-paper/70 mb-1">
                  🍌 Streak protection
                </p>
                <p className="font-body text-sm text-paper/85">
                  Get 1 free pass a week. Miss a day, the streak holds.{' '}
                  <span className="text-coral">Unlock for £7.99 →</span>
                </p>
              </a>
            )}

            <div className="mt-auto space-y-3">
              <div className="flex items-center justify-between text-sm font-body mb-2">
                <span className="text-paper/80">Today&apos;s progress</span>
                <span className="text-paper">{todayCompleted} / 9</span>
              </div>
              <div className="h-1.5 bg-paper/15 overflow-hidden">
                <div
                  className="h-full bg-coral transition-all duration-500 ease-smooth"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <div className="grid grid-cols-2 gap-3 pt-4">
                <button
                  onClick={handleAdvance}
                  disabled={data.currentDay >= 50}
                  className="border border-paper/30 text-paper font-body text-xs px-4 py-3 uppercase tracking-wider hover:border-paper hover:bg-paper/10 transition-colors disabled:opacity-40"
                >
                  Next day
                </button>
                <button
                  onClick={reset}
                  className="font-body text-caption uppercase text-paper/70 hover:text-paper transition-colors"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-8 bg-white border border-rule p-6 md:p-10 relative">
            <div className="flex items-end justify-between mb-8 pb-6 border-b border-rule">
              <div>
                <p className="font-body text-caption uppercase text-ink/50 mb-1">
                  {isCubeSolved ? 'Cube solved for today' : 'Solve today\'s cube'}
                </p>
                <h3 className="font-display text-h2 text-ink">
                  {todayCompleted} of 9
                </h3>
              </div>
              <p className="font-body text-caption uppercase text-ink/50">
                Tap to toggle
              </p>
            </div>

            <div
              className={`grid grid-cols-3 gap-px bg-ink border border-ink transition-shadow duration-500 relative ${
                isCubeSolved ? 'shadow-[0_0_0_4px_rgba(232,139,90,0.35)]' : ''
              }`}
            >
              {habits.map((habit) => {
                const isDone = data.habitCompletions[habit.id]?.[today];
                const isPulsing = pulsingHabit === habit.id;
                return (
                  <button
                    key={habit.id}
                    onClick={() => handleToggle(habit.id, today)}
                    className={`relative aspect-square p-3 md:p-5 flex flex-col items-center justify-center gap-2 md:gap-3 transition-all duration-300 group ${
                      isDone
                        ? 'bg-coral text-paper'
                        : 'bg-white hover:bg-paper text-ink'
                    } ${isPulsing ? 'scale-110 ring-2 ring-coral' : 'scale-100'}`}
                    aria-pressed={isDone}
                    aria-label={`${habit.name}${isDone ? ' - complete' : ''}`}
                  >
                    <div className="flex w-full items-center justify-center p-1 transition-transform duration-300 group-hover:scale-105">
                      <HabitIcon
                        name={habit.icon}
                        size={128}
                      />
                    </div>
                    <span className="font-body text-caption uppercase text-center leading-tight">
                      {habit.name}
                    </span>
                    <CellConfetti show={isPulsing} />
                  </button>
                );
              })}
            </div>

            <div className="mt-10 pt-8 border-t border-rule">
              <div className="flex items-center justify-between mb-4">
                <p className="font-body text-caption uppercase text-ink/50">
                  The 50 days
                </p>
                <p className="font-body text-caption uppercase text-ink/50">
                  Day {today} highlighted
                </p>
              </div>
              <div className="grid grid-cols-10 gap-1.5">
                {Array.from({ length: 50 }, (_, i) => i + 1).map((day) => {
                  const completed = HABIT_IDS.filter((id) => data.habitCompletions[id]?.[day]).length;
                  const isCurrent = day === today;
                  const isProtected = protectedDays.includes(day);

                  let bg = 'bg-paper';
                  if (isProtected) {
                    bg = 'bg-amber-300';
                  } else if (completed >= 7) {
                    bg = 'bg-teal';
                  } else if (completed >= 5) {
                    bg = 'bg-coral';
                  } else if (completed > 0) {
                    bg = 'bg-cream';
                  }

                  return (
                    <div
                      key={day}
                      className={`aspect-square flex items-center justify-center text-[10px] font-body relative ${
                        isCurrent ? 'ring-2 ring-ink ring-offset-2 ring-offset-white' : ''
                      } ${bg} ${isCurrent ? 'text-ink' : 'text-ink/30'}`}
                      title={isProtected ? `Day ${day}: 🛡️ protected` : `Day ${day}: ${completed}/9`}
                    >
                      {day}
                      {isProtected && (
                        <span className="absolute -top-1 -right-1 text-[8px]">🍌</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            {balloons && <BalloonBurst />}
          </div>
        </div>

        {/* Reset + Banana row */}
        <div className="mt-10 flex flex-col items-center gap-3">
          {isPremium && (
            <button
              onClick={handleUseBanana}
              disabled={hasProtectionForWeek(new Date())}
              className="font-body text-caption uppercase text-ink hover:text-coral transition-colors disabled:opacity-40"
            >
              {hasProtectionForWeek(new Date()) ? '🍌 used this week' : '🍌 use a streak pass'}
            </button>
          )}
          <button
            onClick={reset}
            className="font-body text-caption uppercase text-ink/50 hover:text-ink transition-colors"
          >
            Reset all progress
          </button>
        </div>
      </div>
    </Section>
  );
}
