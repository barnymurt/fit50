'use client';

import { useState, useEffect } from 'react';
import WatercolourSection from './WatercolourSection';
import EmailCaptureModal from './EmailCaptureModal';
import { useEmailCapture } from './EmailCaptureContext';

interface Habit {
  id: string;
  emoji: string;
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
  { id: 'chill-out', emoji: '🚿', name: 'Chill Out' },
  { id: 'fuel-right', emoji: '🥗', name: 'Fuel Right' },
  { id: 'crispy-clarity', emoji: '🍺', name: 'Crispy Clarity' },
  { id: 'fresh-lungs', emoji: '🚭', name: 'Fresh Lungs' },
  { id: 'open-mind', emoji: '🧘', name: 'Open Mind' },
  { id: 'move-body', emoji: '💪', name: 'Move Your Body' },
  { id: 'wet-lips', emoji: '💧', name: 'Wet The Lips' },
  { id: 'keep-walking', emoji: '👟', name: 'Keep Walking' },
  { id: 'feed-brain', emoji: '📚', name: 'Feed Your Brain' },
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

const calculateStreak = (completions: { [key: string]: { [key: number]: boolean } }, currentDay: number): { streak: number; longest: number } => {
  let streak = 0;
  let longest = 0;
  let currentStreak = 0;

  for (let day = 1; day <= currentDay; day++) {
    let completedCount = 0;
    habits.forEach(habit => {
      if (completions[habit.id]?.[day]) {
        completedCount++;
      }
    });

    if (completedCount >= 7) {
      currentStreak++;
    } else if (completedCount < 5) {
      longest = Math.max(longest, currentStreak);
      currentStreak = 0;
    }
  }

  longest = Math.max(longest, currentStreak);
  streak = currentStreak;

  return { streak, longest };
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
    
    setTrackerData(prev => {
      const newCompletions = { ...prev.habitCompletions };
      if (!newCompletions[habitId]) {
        newCompletions[habitId] = {};
      }
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
      setTrackerData(prev => ({
        ...prev,
        currentDay: prev.currentDay + 1,
        lastUpdated: new Date().toISOString(),
      }));
    }
  };

  const resetTracker = () => {
    const newData = getInitialData();
    setTrackerData(newData);
    localStorage.removeItem(STORAGE_KEY);
  };

  const getDayCompletion = (day: number) => {
    let completed = 0;
    habits.forEach(habit => {
      if (trackerData.habitCompletions[habit.id]?.[day]) {
        completed++;
      }
    });
    return completed;
  };

  if (!loaded) return null;

  return (
    <WatercolourSection color="#F2D9A2" className="py-24" seed={6}>
      <div className="max-w-7xl mx-auto px-8">
        <div className="flex flex-col md:flex-row gap-12">
          <div className="md:w-1/3">
            <h2 className="font-display text-4xl md:text-5xl text-[#2A2A2A]">
              TRACK<br />YOUR<br />PROGRESS
            </h2>
            <p className="font-body text-lg text-[#2A2A2A]/80 mt-6">
              Don&apos;t trust your memory. Write it down. Every check is a victory. 
              Every streak is proof of your commitment.
            </p>
            
            <div className="mt-8 p-6 bg-[#2A2A2A] rounded-lg">
              <div className="text-center">
                <p className="font-body text-[#FEFEFE]/60 text-sm uppercase tracking-wider">
                  Current Streak
                </p>
                <p className="font-display text-5xl text-[#E88B5A]">
                  {trackerData.streakCount}
                </p>
                <p className="font-body text-[#FEFEFE]/60 text-sm">
                  days in a row
                </p>
              </div>
              
              <div className="mt-4 pt-4 border-t border-[#FEFEFE]/20 text-center">
                <p className="font-body text-[#FEFEFE]/60 text-sm">
                  Best Streak: <span className="text-[#4A9B9B]">{trackerData.longestStreak} days</span>
                </p>
              </div>
            </div>

            <div className="mt-6 flex gap-4">
              <button
                onClick={advanceDay}
                disabled={trackerData.currentDay >= 50}
                className="flex-1 bg-[#4A9B9B] text-[#FEFEFE] font-display text-xs px-4 py-3 uppercase tracking-wider hover:bg-[#4A9B9B]/80 transition-colors disabled:opacity-50"
              >
                Next Day
              </button>
              <button
                onClick={resetTracker}
                className="flex-1 border-2 border-[#2A2A2A] text-[#2A2A2A] font-display text-xs px-4 py-3 uppercase tracking-wider hover:bg-[#2A2A2A]/10 transition-colors"
              >
                Reset
              </button>
            </div>
          </div>

          <div className="md:w-2/3">
            <div className="bg-[#FEFEFE] p-6 rounded-lg shadow-lg">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-display text-2xl text-[#2A2A2A]">
                  Day {trackerData.currentDay} of 50
                </h3>
                <span className="font-body text-sm text-[#2A2A2A]/60">
                  {getDayCompletion(trackerData.currentDay)}/9 complete
                </span>
              </div>

              <div className="space-y-3">
                {habits.map((habit) => (
                  <div
                    key={habit.id}
                    onClick={() => toggleHabit(habit.id, trackerData.currentDay)}
                    className={`flex items-center gap-4 p-4 rounded-lg cursor-pointer transition-all ${
                      trackerData.habitCompletions[habit.id]?.[trackerData.currentDay]
                        ? 'bg-[#4A9B9B] text-[#FEFEFE]'
                        : 'bg-[#F2D9A2]/30 hover:bg-[#F2D9A2]/50'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                      trackerData.habitCompletions[habit.id]?.[trackerData.currentDay]
                        ? 'bg-[#FEFEFE] border-[#FEFEFE]'
                        : 'border-[#2A2A2A]/40'
                    }`}>
                      {trackerData.habitCompletions[habit.id]?.[trackerData.currentDay] && (
                        <span className="text-[#4A9B9B]">✓</span>
                      )}
                    </div>
                    <span className="text-2xl">{habit.emoji}</span>
                    <span className="font-body font-medium">{habit.name}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-[#2A2A2A]/10">
                <p className="font-body text-sm text-[#2A2A2A]/60 mb-4">
                  Previous Days Progress
                </p>
                <div className="grid grid-cols-10 gap-1">
                  {Array.from({ length: 50 }, (_, i) => i + 1).map((day) => {
                    const completed = getDayCompletion(day);
                    const isCurrentDay = day === trackerData.currentDay;
                    const isPastDay = day < trackerData.currentDay;
                    
                    let bgClass = 'bg-[#F2D9A2]/30';
                    if (completed >= 7) bgClass = 'bg-[#4A9B9B]';
                    else if (completed >= 5) bgClass = 'bg-[#E88B5A]';
                    else if (completed > 0) bgClass = 'bg-[#D8B8D0]';
                    
                    return (
                      <div
                        key={day}
                        className={`aspect-square rounded text-center text-xs font-body ${
                          isCurrentDay ? 'ring-2 ring-[#2A2A2A]' : ''
                        } ${bgClass}`}
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
      </div>

      <EmailCaptureModal 
        isOpen={showEmailModal} 
        onClose={() => setShowEmailModal(false)}
        title="Save Your Progress"
        message="Enter your email to save your tracker progress across devices and get daily reminders."
      />
    </WatercolourSection>
  );
}
