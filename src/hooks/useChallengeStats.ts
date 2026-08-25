'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase';
import { useBookLog } from './useBookLog';
import { dateKeyLocal, dayIndexFromStart, dayKeyFromStart, CHALLENGE_DAYS } from '@/lib/dates';
import { TRACKER_RESET_EVENT } from './useTrackerState';
import { HABIT_COUNT } from '@/lib/habits';

const WORKOUT_EXERCISES_PER_LINE = 5;
const WORKOUT_SETS_PER_EXERCISE = 5;

export interface WorkoutLineSummary {
  line: 'A' | 'B' | 'C' | 'D';
  date: string;
  dayNumber: number | null;
  completed: boolean;
  sets: Record<string, number>;
}

export interface ChallengeStats {
  loaded: boolean;
  totalDays: number;
  daysCompleted: number;
  daysWithoutAlcohol: number;
  daysWithoutNicotine: number;
  coldShowerDays: number;
  tenKStepDays: number;
  streakProtectionsUsed: number;
  waterTotalMl: number;
  waterGoalHits: number;
  workoutLines: WorkoutLineSummary[];
  workoutCompletions: number;
  books: { title: string; format: 'read' | 'listen' }[];
}

const empty: ChallengeStats = {
  loaded: false,
  totalDays: 0,
  daysCompleted: 0,
  daysWithoutAlcohol: 0,
  daysWithoutNicotine: 0,
  coldShowerDays: 0,
  tenKStepDays: 0,
  streakProtectionsUsed: 0,
  waterTotalMl: 0,
  waterGoalHits: 0,
  workoutLines: [],
  workoutCompletions: 0,
  books: [],
};

/**
 * Aggregates every metric needed by the completion certificate:
 *   - days without alcohol / nicotine, cold showers, 10K step days
 *     (all derived from daily_totals habit taps)
 *   - streak protections used (streak_protections)
 *   - water total + days hitting 2.5L goal (water_log)
 *   - workout line completed per day (workout_log; "completed" =
 *     all 5 exercises at ≥5 sets)
 *   - distinct book titles (book_log via useBookLog)
 *
 * Anon users get an empty stats object — the certificate is premium
 * so non-auth/anon callers shouldn't normally reach this hook.
 */
export function useChallengeStats(startDate: string | null): ChallengeStats {
  const { user: auth } = useAuth();
  const supabase = createClient();
  const { booksByTitle } = useBookLog();
  const [stats, setStats] = useState<ChallengeStats>(empty);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!auth || !supabase || !startDate) {
        setStats(empty);
        return;
      }

      const [
        totalsRes,
        waterRes,
        streaksRes,
        workoutsRes,
      ] = await Promise.all([
        (supabase.from('daily_totals') as any)
          .select('day_number, habit_id, completed')
          .eq('user_id', auth.id),
        (supabase.from('water_log') as any)
          .select('date_key, amount_ml')
          .eq('user_id', auth.id),
        (supabase.from('streak_protections') as any)
          .select('id')
          .eq('user_id', auth.id),
        (supabase.from('workout_log') as any)
          .select('date_key, line, sets')
          .eq('user_id', auth.id),
      ]);

      if (cancelled) return;

      const dayToHabits: Record<number, Record<string, boolean>> = {};
      for (const row of totalsRes.data || []) {
        if (!dayToHabits[row.day_number]) dayToHabits[row.day_number] = {};
        dayToHabits[row.day_number][row.habit_id] = row.completed === true;
      }

      const countHabit = (habitId: string) =>
        Object.values(dayToHabits).reduce(
          (n, taps) => n + (taps[habitId] ? 1 : 0),
          0
        );

      const daysWithoutAlcohol = countHabit('crispy-clarity');
      const daysWithoutNicotine = countHabit('fresh-lungs');
      const coldShowerDays = countHabit('chill-out');
      const tenKStepDays = countHabit('step-it-up');
      const daysCompleted = Object.values(dayToHabits).filter(
        (taps) => Object.values(taps).filter(Boolean).length >= HABIT_COUNT
      ).length;

      let waterTotalMl = 0;
      let waterGoalHits = 0;
      for (const row of waterRes.data || []) {
        const ml = Number(row.amount_ml) || 0;
        waterTotalMl += ml;
        if (ml >= 2500) waterGoalHits += 1;
      }

      const workoutLines: WorkoutLineSummary[] = (workoutsRes.data || []).map(
        (row: { date_key: string; line: 'A' | 'B' | 'C' | 'D'; sets: Record<string, number> }) => {
          const sets = row.sets || {};
          const completed =
            Object.keys(sets).length >= WORKOUT_EXERCISES_PER_LINE &&
            Object.values(sets).every(
              (n) => Number(n) >= WORKOUT_SETS_PER_EXERCISE
            );
          return {
            line: row.line,
            date: row.date_key,
            dayNumber: (() => {
              try {
                return dayIndexFromStart(
                  startDate,
                  new Date(`${row.date_key}T00:00:00`)
                );
              } catch {
                return null;
              }
            })(),
            completed,
            sets,
          };
        }
      );

      const workoutCompletions = workoutLines.filter((w) => w.completed).length;
      const streakProtectionsUsed = (streaksRes.data || []).length;

      const todayKey = dateKeyLocal(new Date());
      const totalDays = Math.min(
        CHALLENGE_DAYS,
        Math.max(0, dayIndexFromStart(startDate, new Date()))
      );

      setStats({
        loaded: true,
        totalDays,
        daysCompleted,
        daysWithoutAlcohol,
        daysWithoutNicotine,
        coldShowerDays,
        tenKStepDays,
        streakProtectionsUsed,
        waterTotalMl,
        waterGoalHits,
        workoutLines,
        workoutCompletions,
        books: booksByTitle.map((b) => ({ title: b.title, format: b.format })),
      });
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [auth, supabase, startDate, booksByTitle]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onReset = () => setStats(empty);
    window.addEventListener(TRACKER_RESET_EVENT, onReset);
    return () => window.removeEventListener(TRACKER_RESET_EVENT, onReset);
  }, []);

  return stats;
}

export function dayKeyForDate(startDate: string | null, dayNumber: number): string {
  if (!startDate) return '';
  return dayKeyFromStart(startDate, dayNumber);
}