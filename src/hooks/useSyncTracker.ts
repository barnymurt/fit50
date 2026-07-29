'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase';

interface HabitCompletion {
  user_id: string;
  day: number;
  habit_id: string;
  completed: boolean;
  completed_at: string;
}

interface TrackerData {
  currentDay: number;
  habitCompletions: Record<string, Record<number, boolean>>;
  streakCount: number;
  longestStreak: number;
  lastUpdated: string;
  startDate: string;
}

const STORAGE_KEY = 'fit50_tracker';

const DEFAULT_DATA: TrackerData = {
  currentDay: 1,
  habitCompletions: {},
  streakCount: 0,
  longestStreak: 0,
  lastUpdated: new Date().toISOString(),
  startDate: new Date().toISOString(),
};

export function useSyncTracker() {
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<TrackerData>(DEFAULT_DATA);
  const [loaded, setLoaded] = useState(false);
  const supabase = createClient();

  const loadFromLocal = useCallback((): TrackerData => {
    if (typeof window === 'undefined') return DEFAULT_DATA;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_DATA;
    try {
      return JSON.parse(stored) as TrackerData;
    } catch {
      return DEFAULT_DATA;
    }
  }, []);

  const saveToLocal = useCallback((newData: TrackerData) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
  }, []);

  const completionsToHabitMap = (completions: HabitCompletion[]): Record<string, Record<number, boolean>> => {
    const map: Record<string, Record<number, boolean>> = {};
    completions.forEach((c) => {
      if (!c.completed) return;
      if (!map[c.habit_id]) map[c.habit_id] = {};
      map[c.habit_id][c.day] = true;
    });
    return map;
  };

  const habitMapToCompletions = (userId: string, habitMap: Record<string, Record<number, boolean>>): HabitCompletion[] => {
    const completions: HabitCompletion[] = [];
    Object.entries(habitMap).forEach(([habit_id, days]) => {
      Object.entries(days).forEach(([day, completed]) => {
        if (completed) {
          completions.push({
            user_id: userId,
            day: parseInt(day, 10),
            habit_id,
            completed: true,
            completed_at: new Date().toISOString(),
          });
        }
      });
    });
    return completions;
  };

  useEffect(() => {
    if (authLoading) return;

    const init = async () => {
      const local = loadFromLocal();

      if (user && supabase) {
        const { data: remote, error } = await supabase
          .from('tracker_progress')
          .select('day, habit_id, completed, completed_at')
          .eq('user_id', user.id);

        if (error) {
          console.error('Failed to fetch tracker:', error);
          setData(local);
          setLoaded(true);
          return;
        }

        const remoteMap = completionsToHabitMap((remote as HabitCompletion[]) || []);
        const localMap = local.habitCompletions || {};

        const merged: Record<string, Record<number, boolean>> = {};
        const allHabits = new Set([...Object.keys(remoteMap), ...Object.keys(localMap)]);
        allHabits.forEach((habitId) => {
          merged[habitId] = {};
          const allDays = new Set([
            ...Object.keys(remoteMap[habitId] || {}),
            ...Object.keys(localMap[habitId] || {}),
          ]);
          allDays.forEach((day) => {
            const dayNum = parseInt(day, 10);
            if (remoteMap[habitId]?.[dayNum] || localMap[habitId]?.[dayNum]) {
              merged[habitId][dayNum] = true;
            }
          });
        });

        const mergedData = {
          ...local,
          habitCompletions: merged,
          currentDay: Math.max(local.currentDay || 1, ...Object.values(merged).flatMap((d) => Object.keys(d).map(Number))),
        };

        setData(mergedData);
        saveToLocal(mergedData);

        const toUpload = habitMapToCompletions(user.id, localMap);
        if (toUpload.length > 0) {
          await supabase
            .from('tracker_progress')
            .upsert(toUpload, { onConflict: 'user_id,day,habit_id' });
        }
      } else {
        setData(local);
      }

      setLoaded(true);
    };

    init();
  }, [user, authLoading, loadFromLocal, saveToLocal, supabase]);

  const persist = useCallback(
    async (newData: TrackerData) => {
      saveToLocal(newData);

      if (user && supabase) {
        const completions = habitMapToCompletions(user.id, newData.habitCompletions);
        if (completions.length > 0) {
          await supabase
            .from('tracker_progress')
            .upsert(completions, { onConflict: 'user_id,day,habit_id' });
        }
      }
    },
    [user, saveToLocal, supabase]
  );

  const update = useCallback(
    (updater: (prev: TrackerData) => TrackerData) => {
      setData((prev) => {
        const next = updater(prev);
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const toggleHabit = useCallback(
    (habitId: string, day: number) => {
      update((prev) => {
        const completions = { ...prev.habitCompletions };
        if (!completions[habitId]) completions[habitId] = {};
        completions[habitId] = {
          ...completions[habitId],
          [day]: !completions[habitId][day],
        };
        return {
          ...prev,
          habitCompletions: completions,
          lastUpdated: new Date().toISOString(),
        };
      });
    },
    [update]
  );

  const advanceDay = useCallback(() => {
    update((prev) => {
      if (prev.currentDay >= 50) return prev;
      return {
        ...prev,
        currentDay: prev.currentDay + 1,
        lastUpdated: new Date().toISOString(),
      };
    });
  }, [update]);

  const reset = useCallback(() => {
    if (typeof window !== 'undefined' && !window.confirm('Reset all tracker progress? This cannot be undone.')) {
      return;
    }
    const fresh = { ...DEFAULT_DATA, startDate: new Date().toISOString(), lastUpdated: new Date().toISOString() };
    persist(fresh);
    setData(fresh);
  }, [persist]);

  return {
    data,
    loaded,
    toggleHabit,
    advanceDay,
    reset,
    user,
  };
}
