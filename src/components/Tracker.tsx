'use client';

import { useState, useEffect } from 'react';
import Section from './Section';
import Heading from './Heading';
import Button from './Button';
import Icon, { IconName } from './Icon';
import EmailCaptureModal from './EmailCaptureModal';
import { useEmailCapture } from './EmailCaptureContext';

interface Habit {
  id: string;
  icon: IconName;
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
  { id: 'keep-walking', icon: 'keep-walking', name: 'Keep Walking' },
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

  return (
    <Section id="tracker" tone="paper" className="py-section" contained>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-12 md:mb-16">
        <div className="md:col-span-7">
          <p className="font-body text-caption uppercase text-ink/50 mb-4">
            Day {String(today).padStart(2, '0')} of 50
          </p>
          <Heading as="h2" size="display-2">
            Check the box.<br />
            Build the streak.
          </Heading>
        </div>
        <div className="md:col-span-5 md:col-start-8 flex items-end">
          <p className="font-body text-lg text-ink/70 max-w-md">
            Tap each habit as you complete it. Your streak calculates automatically. Local-first; no account needed to start.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 bg-ink text-paper p-8 md:p-10 flex flex-col">
          <p className="font-body text-caption uppercase text-paper/50 mb-3">
            Current streak
          </p>
          <div className="flex items-baseline gap-3 mb-2">
            <span
              className="font-display leading-none text-coral"
              style={{ fontSize: 'clamp(6rem, 12vw, 9rem)', letterSpacing: '-0.04em' }}
            >
              {trackerData.streakCount}
            </span>
            <span className="font-body text-paper/60 text-lg">days</span>
          </div>
          <p className="font-body text-sm text-paper/50 mb-8">
            in a row · best: {trackerData.longestStreak} {trackerData.longestStreak === 1 ? 'day' : 'days'}
          </p>

          <div className="mt-auto space-y-3">
            <div className="flex items-center justify-between text-sm font-body mb-2">
              <span className="text-paper/60">Today&apos;s progress</span>
              <span className="text-paper">{todayCompleted} / 9</span>
            </div>
            <div className="h-1 bg-paper/10 overflow-hidden">
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
                className="font-body text-caption uppercase text-paper/50 hover:text-paper transition-colors"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 bg-white border border-rule p-6 md:p-10">
          <div className="flex items-center justify-between mb-6 pb-6 border-b border-rule">
            <h3 className="font-display text-h2 text-ink">
              {habits.length} habits today
            </h3>
            <p className="font-body text-sm text-ink/50">
              {todayCompleted} complete
            </p>
          </div>

          <ul className="divide-y divide-rule">
            {habits.map((habit) => {
              const isDone = trackerData.habitCompletions[habit.id]?.[today];
              return (
                <li key={habit.id}>
                  <button
                    onClick={() => toggleHabit(habit.id, today)}
                    className="w-full flex items-center gap-4 py-4 text-left group"
                    aria-pressed={isDone}
                  >
                    <span
                      className={`flex-shrink-0 w-6 h-6 border ${
                        isDone
                          ? 'bg-teal border-teal'
                          : 'border-ink/30 group-hover:border-ink'
                      } flex items-center justify-center transition-colors duration-200`}
                      aria-hidden="true"
                    >
                      {isDone && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </span>
                    <Icon
                      name={habit.icon}
                      size={20}
                      className={`flex-shrink-0 transition-colors duration-200 ${
                        isDone ? 'text-teal' : 'text-ink'
                      }`}
                    />
                    <span
                      className={`font-body text-body flex-1 transition-colors duration-200 ${
                        isDone ? 'text-ink/40 line-through' : 'text-ink'
                      }`}
                    >
                      {habit.name}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

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
                else if (completed >= 5) bg = 'bg-coral/70';
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

      <EmailCaptureModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        title="Save Your Progress"
        message="Enter your email to save your tracker progress across devices and get daily reminders."
      />
    </Section>
  );
}
