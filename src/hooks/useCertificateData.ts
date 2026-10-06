'use client';

// useCertificateData
//
// Pulls together every signal the completion certificate needs:
// - useChallengeStats for tracker-side counts (habits, water,
//   workouts, books, streak, day-50 completion flag).
// - useFoodLog for the food side: total meals + total kcal, days
//   with any log, days that hit the user's macro protein/carb/fat
//   targets (using useMacroTargets).
// - useWaterLog for total water + days hitting the 2.5L goal.
// - useDailySteps for total steps across the 50 days + days
//   hitting the 10k step goal.
//
// The hook only resolves when every source has reported in. If
// the page mounts without a session it returns the empty shape so
// the certificate page falls back to its "sign in" branch.

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTrackerState } from './useTrackerState';
import { useFoodLog } from './useFoodLog';
import { useWaterLog } from './useWaterLog';
import { useDailySteps } from './useDailySteps';
import { useChallengeStats } from './useChallengeStats';
import { useMacroTargets } from './useMacroTargets';
import type { MacroTargets } from '@/components/food-database/types';

export interface CertificateData {
  loaded: boolean;

  // From useChallengeStats
  daysCompleted: number;
  // True if the user reached day 50 on the calendar (so they're
  // eligible to see the cert) but `daysCompleted` came back below
  // 50. Most likely cause: a tick was lost to the hydration race
  // (since fixed) so daily_totals is sparse. We surface this on
  // the cert so the user knows the numbers shown are real, just
  // incomplete.
  dataLooksIncomplete: boolean;
  daysWithoutAlcohol: number;
  daysWithoutNicotine: number;
  coldShowerDays: number;
  tenKStepDays: number;
  streakProtectionsUsed: number;
  workoutCompletions: number;
  longestStreak: number;
  // Workout inventory: which exercises the user actually did
  // and how many sets across the 50 days. Computed from
  // workout_log.sets which already records per-exercise
  // completion count. We surface the top entries on the
  // certificate so it's personalised, not a generic
  // "you did some workouts" line.
  topExercises: { name: string; totalSets: number; dayCount: number }[];
  totalSetsAcrossAllExercises: number;
  uniqueExercisesDone: number;
  books: { title: string; format: 'read' | 'listen' }[];

  // From useFoodLog
  mealsLogged: number;
  totalKcalLogged: number;
  daysWithFood: number;
  macroProteinHits: number;
  macroCarbHits: number;
  macroFatHits: number;
  macroTargets: MacroTargets | null;

  // From useWaterLog
  waterTotalMl: number;
  waterGoalHits: number;

  // From useDailySteps
  stepsTotal: number;
  stepsGoalHits: number;
}

const empty: CertificateData = {
  loaded: false,
  daysCompleted: 0,
  dataLooksIncomplete: false,
  daysWithoutAlcohol: 0,
  daysWithoutNicotine: 0,
  coldShowerDays: 0,
  tenKStepDays: 0,
  streakProtectionsUsed: 0,
  workoutCompletions: 0,
  longestStreak: 0,
  topExercises: [],
  totalSetsAcrossAllExercises: 0,
  uniqueExercisesDone: 0,
  books: [],
  mealsLogged: 0,
  totalKcalLogged: 0,
  daysWithFood: 0,
  macroProteinHits: 0,
  macroCarbHits: 0,
  macroFatHits: 0,
  macroTargets: null,
  waterTotalMl: 0,
  waterGoalHits: 0,
  stepsTotal: 0,
  stepsGoalHits: 0,
};

export function useCertificateData(startDate: string | null): CertificateData {
  const { user } = useAuth();
  // We need the user's tracker for two reasons on the certificate
  // page: (1) to anchor the end of the date range to the user's
  // actual progress (their last fully-complete day, not today),
  // and (2) to flag the "data may be incomplete" callout when
  // currentDay >= 50 but daysCompleted is suspiciously low (a
  // symptom of the old hydration race losing ticks).
  const tracker = useTrackerState();
  const stats = useChallengeStats(startDate);
  const foodLog = useFoodLog();
  const water = useWaterLog();
  const dailySteps = useDailySteps(startDate, null);
  const macroTargets = useMacroTargets();

  // We're aggregating across many sources. Gate "loaded" on every
  // source having reported in. Each source has its own readiness
  // flag so this works without races.
  const allLoaded =
    stats.loaded &&
    foodLog.loaded &&
    water.hydrated &&
    dailySteps.hydrated &&
    macroTargets.loaded;

  // Per-day aggregation of food_log entries. We use this to count
  // meals + days with food + macro target hits.
  const perDayAggregates = useMemo(() => {
    if (!allLoaded) return null;
    const entries = foodLog.entries;
    const targets = macroTargets.targets;
    const byDay = new Map<
      string,
      { kcal: number; protein: number; carbs: number; fat: number }
    >();
    for (const e of entries) {
      const cur = byDay.get(e.day_key) ?? { kcal: 0, protein: 0, carbs: 0, fat: 0 };
      cur.kcal += e.kcal;
      cur.protein += e.protein;
      cur.carbs += e.carbs;
      cur.fat += e.fat;
      byDay.set(e.day_key, cur);
    }
    let totalKcal = 0;
    let daysWithFood = 0;
    let proteinHits = 0;
    let carbHits = 0;
    let fatHits = 0;
    for (const [, day] of byDay) {
      daysWithFood += 1;
      totalKcal += day.kcal;
      if (targets) {
        // "Hit" = within 5% of target (rounding tolerance).
        const tol = 0.95;
        if (targets.protein > 0 && day.protein >= targets.protein * tol) proteinHits += 1;
        if (targets.carbs > 0 && day.carbs >= targets.carbs * tol) carbHits += 1;
        if (targets.fat > 0 && day.fat >= targets.fat * tol) fatHits += 1;
      }
    }
    return { totalKcal, daysWithFood, proteinHits, carbHits, fatHits };
  }, [allLoaded, foodLog.entries, macroTargets.targets]);

  // Water totals across the 50 days. useWaterLog returns a
  // history array of { date, amount_ml } rows, not an object map.
  const waterTotals = useMemo(() => {
    let totalMl = 0;
    let goalHits = 0;
    for (const h of water.history || []) {
      const amount = Number(h.amount) || 0;
      totalMl += amount;
      if (amount >= 2500) goalHits += 1;
    }
    return { totalMl, goalHits };
  }, [water.history]);

  // Steps totals across the 50 days. dailySteps.history is
  // newest-first; we sum everything.
  const stepsTotals = useMemo(() => {
    let total = 0;
    let goalHits = 0;
    for (const h of dailySteps.history || []) {
      total += h.steps || 0;
      if ((h.steps || 0) >= 10000) goalHits += 1;
    }
    return { total, goalHits };
  }, [dailySteps.history]);

  // Workout inventory. Each workout_log row has a `sets` object
  // keyed by exercise name. Sum total sets per exercise across
  // all 50 days and rank by volume so the certificate shows
  // the user's real activity, not a generic "you worked out"
  // line. Anything below 5 sets per exercise across the whole
  // challenge gets dropped (noise).
  const workoutInventory = useMemo(() => {
    const perExercise = new Map<
      string,
      { totalSets: number; dayCount: number }
    >();
    for (const w of stats.workoutLines || []) {
      if (!w.sets) continue;
      for (const [name, count] of Object.entries(w.sets)) {
        if (!count || count < 1) continue;
        const entry = perExercise.get(name) ?? { totalSets: 0, dayCount: 0 };
        entry.totalSets += count;
        // Count the days they actually did the exercise at all
        // (any positive count). Multi-set days count as one.
        entry.dayCount += 1;
        perExercise.set(name, entry);
      }
    }
    const all = Array.from(perExercise.entries()).map(
      ([name, v]) => ({ name, ...v })
    );
    // Top 5 by total sets; break ties by name asc for stability.
    all.sort((a, b) =>
      b.totalSets - a.totalSets || a.name.localeCompare(b.name)
    );
    const top = all.slice(0, 5);
    const total = all.reduce((s, e) => s + e.totalSets, 0);
    return { topExercises: top, totalSets: total, unique: all.length };
  }, [stats.workoutLines]);

  const [composite, setComposite] = useState<CertificateData>(empty);

  useEffect(() => {
    if (!user) {
      setComposite(empty);
      return;
    }
    if (!allLoaded || !perDayAggregates || !waterTotals || !stepsTotals) return;
    setComposite({
      loaded: true,
      daysCompleted: stats.daysCompleted,
      // The cert is shown to anyone who reached day 50 on the
      // calendar. If their `daysCompleted` count is well below
      // 50, that's a strong signal that some ticks were lost to
      // the hydration race (now fixed). Surface a flag so the
      // cert can show a "data may be incomplete" note.
      dataLooksIncomplete:
        tracker.loaded &&
        tracker.currentDay >= 50 &&
        stats.daysCompleted < 45,
      daysWithoutAlcohol: stats.daysWithoutAlcohol,
      daysWithoutNicotine: stats.daysWithoutNicotine,
      coldShowerDays: stats.coldShowerDays,
      tenKStepDays: stats.tenKStepDays,
      streakProtectionsUsed: stats.streakProtectionsUsed,
      workoutCompletions: stats.workoutCompletions,
      longestStreak: stats.longestStreak,
      topExercises: workoutInventory.topExercises,
      totalSetsAcrossAllExercises: workoutInventory.totalSets,
      uniqueExercisesDone: workoutInventory.unique,
      books: stats.books,
      mealsLogged: foodLog.entries.length,
      totalKcalLogged: perDayAggregates.totalKcal,
      daysWithFood: perDayAggregates.daysWithFood,
      macroProteinHits: perDayAggregates.proteinHits,
      macroCarbHits: perDayAggregates.carbHits,
      macroFatHits: perDayAggregates.fatHits,
      macroTargets: macroTargets.targets,
      waterTotalMl: waterTotals.totalMl,
      waterGoalHits: waterTotals.goalHits,
      stepsTotal: stepsTotals.total,
      stepsGoalHits: stepsTotals.goalHits,
    });
  }, [
    user,
    allLoaded,
    perDayAggregates,
    waterTotals,
    stepsTotals,
    stats,
    foodLog.entries.length,
    macroTargets.targets,
    tracker,
  ]);

  return composite;
}
