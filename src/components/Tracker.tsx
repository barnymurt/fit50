'use client';

import { useState, useEffect } from 'react';
import Section from './Section';
import Button from './Button';
import Icon from './Icon';
import HabitIcon, { HabitIconName } from './HabitIcon';
import Marquee from './Marquee';
import EmailCaptureModal from './EmailCaptureModal';
import { useEmailCapture } from './EmailCaptureContext';

interface Habit {
  id: string;
  icon: HabitIconName;
  name: string;
}

interface TrackerData {
  currentDay: number;
  habitCompletions: Record<string, Record<number, boolean>>;
  streakCount: number;
  longestStreak: number;
  lastUpdated: string;
  startDate: string;
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

const STORAGE_KEY = 'fit50_tracker';

const getInitialData = (): TrackerData => ({
  currentDay: 1,
  habitCompletions: habits.reduce((acc, habit) => {
    acc[habit.id] = {};
    return acc;
  }, {} as { [key: string]: { [key: number]: boolean } }),
  streakCount: 0,
  longestStreak: 0,
  lastUpdated: new Date().toISOString(),
  startDate: new Date().toISOString(),
});

const calculateStreak = (
  completions: { [key: string]: { [key: number]: boolean } },
  currentDay: number
): { streak: number; longest: number } => {
  let longest = 0;
  let currentStreak = 0;

  for (let day = 1; day <= currentDay; day++) {
    let completedCount = 0;
    habits.forEach((habit) => {
      if (completions[habit.id]?.[day]) completedCount++;
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
};

export default function Tracker() {
  const [trackerData, setTrackerData] = useState<TrackerData>(getInitialData);
  const [loaded, setLoaded] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const { isCaptured } = useEmailCapture();

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setTrackerData(parsed);
      } catch (e) {
        console.error('Failed to parse tracker data', e);
      }
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trackerData));
    }
  }, [trackerData, loaded]);

  const toggleHabit = (habitId: string, day: number) => {
    if (!hasInteracted && !isCaptured) {
      setHasInteracted(true);
      setShowEmailModal(true);
      return;
    }

    setTrackerData((prev) => {
      const newCompletions = { ...prev.habitCompletions };
      if (!newCompletions[habitId]) newCompletions[habitId] = {};
      newCompletions[habitId] = {
        ...newCompletions[habitId],
        [day]: !newCompletions[habitId][day],
      };

      const { streak, longest } = calculateStreak(newCompletions, prev.currentDay);

      return {
        ...prev,
        habitCompletions: newCompletions,
        streakCount: streak,
        longestStreak: longest,
        lastUpdated: new Date().toISOString(),
      };
    });
  };

  const advanceDay = () => {
    if (trackerData.currentDay < 50) {
      setTrackerData((prev) => ({
        ...prev,
        currentDay: prev.currentDay + 1,
        lastUpdated: new Date().toISOString(),
      }));
    }
  };

  const resetTracker = () => {
    if (typeof window !== 'undefined' && !window.confirm('Reset all tracker progress? This cannot be undone.')) {
      return;
    }
    const newData = getInitialData();
    setTrackerData(newData);
    localStorage.removeItem(STORAGE_KEY);
  };

  const getDayCompletion = (day: number) => {
    let completed = 0;
    habits.forEach((habit) => {
      if (trackerData.habitCompletions[habit.id]?.[day]) completed++;
    });
    return completed;
  };

  if (!loaded) return null;

  const today = trackerData.currentDay;
  const todayCompleted = getDayCompletion(today);
  const progressPct = Math.round((todayCompleted / 9) * 100);
  const isCubeSolved = todayCompleted === 9;

  return (
    <Section
      id="tracker"
      tone="paper"
      className="relative bg-paper text-ink overflow-hidden pt-40 md:pt-56"
    >
      <h2 className="sr-only">Check the box, build the streak</h2>

      <div className="absolute top-0 left-0 right-0 h-32 md:h-52 overflow-hidden pointer-events-none z-0 flex items-center">
        <Marquee
          text="CHECK THE BOX · BUILD THE STREAK · DAY BY DAY"
          separator="✦"
          speed={240}
          textClassName="text-coral/55"
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-10 pb-section">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-12 md:mb-16">
          <div className="md:col-span-7">
            <p className="font-display text-3xl md:text-5xl text-ink/85 max-w-2xl leading-tight">
              Watch your streak grow with every grid completed.
            </p>
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
                {trackerData.streakCount}
              </span>
              <span className="font-body text-paper/80 text-lg">days</span>
            </div>
            <p className="font-body text-sm text-paper/70 mb-8">
              in a row · best: {trackerData.longestStreak} {trackerData.longestStreak === 1 ? 'day' : 'days'}
            </p>

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
                <Button
                  onClick={advanceDay}
                  disabled={trackerData.currentDay >= 50}
                  variant="secondary"
                  tone="dark"
                  className="!rounded-none !px-4 !py-3 !text-xs"
                >
                  Next day
                </Button>
                <button
                  onClick={resetTracker}
                  className="font-body text-caption uppercase text-paper/70 hover:text-paper transition-colors"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-8 bg-white border border-rule p-6 md:p-10">
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
              className={`grid grid-cols-3 gap-px bg-ink border border-ink transition-shadow duration-500 ${
                isCubeSolved ? 'shadow-[0_0_0_4px_rgba(232,139,90,0.35)]' : ''
              }`}
            >
              {habits.map((habit) => {
                const isDone = trackerData.habitCompletions[habit.id]?.[today];
                return (
                  <button
                    key={habit.id}
                    onClick={() => toggleHabit(habit.id, today)}
                    className={`aspect-square p-3 md:p-5 flex flex-col items-center justify-center gap-2 md:gap-3 transition-colors duration-300 group ${
                      isDone
                        ? 'bg-coral text-paper'
                        : 'bg-white hover:bg-paper text-ink'
                    }`}
                    aria-pressed={isDone}
                    aria-label={`${habit.name}${isDone ? ' - complete' : ''}`}
                  >
                    <div
                      className={`inline-flex p-1.5 transition-transform duration-300 group-hover:scale-105`}
                    >
                      <HabitIcon
                        name={habit.icon}
                        size={48}
                      />
                    </div>
                    <span className="font-body text-caption uppercase text-center leading-tight">
                      {habit.name}
                    </span>
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
                  const completed = getDayCompletion(day);
                  const isCurrent = day === today;
                  const isPast = day < today;
                  const isFuture = day > today;

                  let bg = 'bg-paper';
                  if (completed >= 7) bg = 'bg-teal';
                  else if (completed >= 5) bg = 'bg-coral';
                  else if (completed > 0) bg = 'bg-cream';

                  return (
                    <div
                      key={day}
                      className={`aspect-square flex items-center justify-center text-[10px] font-body ${
                        isCurrent
                          ? 'ring-2 ring-ink ring-offset-2 ring-offset-white'
                          : ''
                      } ${bg} ${
                        isFuture ? 'text-ink/30' : isPast ? 'text-ink' : 'text-ink'
                      }`}
                      title={`Day ${day}: ${completed}/9`}
                    >
                      {day}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <EmailCaptureModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        title="Save Your Progress"
        message="Enter your email to save your tracker progress across devices and get daily reminders."
      />
    </Section>
  );
}
