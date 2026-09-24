'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase';
import { dateKeyLocal, dayIndexFromStart, parseDateKey } from '@/lib/dates';
import { estimateExerciseKcal, adjustMetForLoad } from '@/components/macro-calculator/formulas';
import { workoutLines, kettlebellLines, bandLines, type Line } from '@/components/AccountWorkouts';
import type { FoodLogEntry } from '@/components/food-database/types';

const WORKOUT_EXERCISES_PER_LINE = 5;
const WORKOUT_SETS_PER_EXERCISE = 5;
const DEFAULT_FIBER_TARGET = 30;

type AllLines = typeof workoutLines | typeof kettlebellLines | typeof bandLines;

function buildMetLookup(
  weightKg: number,
  kbWeightKg: number | null
) {
  const map: Record<string, { met: number; reps: string }> = {};

  function addLine(lines: AllLines) {
    for (const lineData of Object.values(lines)) {
      for (const ex of lineData.exercises) {
        if (ex.met === undefined) continue;
        // For KB exercises, apply load adjustment based on user KB weight
        const isKb = ex.name.startsWith('KB ');
        const met = isKb
          ? adjustMetForLoad(ex.met, kbWeightKg)
          : ex.met;
        map[ex.name] = { met, reps: ex.reps };
      }
    }
  }

  addLine(workoutLines);
  addLine(kettlebellLines);
  addLine(bandLines);
  void weightKg; // available for future load-based adjustments
  return map;
}

export type AnalyticsRange =
  | '7d'
  | '30d'
  | 'all'
  | { custom: { start: string; end: string } };

export interface AnalyticsDay {
  day_key: string;
  dayNumber: number | null;
  hadLoggedFood: boolean;
  hadWorkout: boolean;
  kcalActual: number;
  kcalTarget: number;
  kcalUnderOver: number;
  proteinActual: number;
  proteinTarget: number;
  carbsActual: number;
  carbsTarget: number;
  fatActual: number;
  fatTarget: number;
  fiberActual: number;
  fiberTarget: number;
  workoutKcalEstimate: number;
  kcalUnderOverAdjusted: number;
}

/** A single weight reading entered by the user. */
export interface WeightReading {
  day_key: string;
  weight_kg: number;
  notes: string | null;
}

/** Per-day projection point — one row per day in range. The chart
 *  draws actual readings as solid dots over this dashed line. */
export interface WeightProjectionPoint {
  day_key: string;
  /** Predicted weight (kg) for this day from kcal balance. NaN if no
   *  baseline weight was set yet (no readings and no fallback). */
  projected: number | null;
  /** 7-day trailing average of `projected` to smooth single-day
   *  noise from how much the user ate. */
  projectedSmoothed: number | null;
  /** Actual reading if the user logged one this day, else null. */
  actual: number | null;
}

export interface AnalyticsTotals {
  daysInRange: number;
  daysLogged: number;
  daysUnderBudget: number;
  daysOverBudget: number;
  daysOnTarget: number;
  daysWorkedOut: number;
  avgKcalActual: number;
  avgKcalTarget: number;
  avgUnderOver: number;
  avgUnderOverAdjusted: number;
  /** Sum of all workout kcal across ALL workout days in range (not just food-logged days) */
  totalWorkoutKcal: number;
  /** Total kcal eaten across ALL food-logged days in range */
  totalKcalEaten: number;
  avgMacroSplit: { protein: number; carbs: number; fat: number };
  longestUnderStreak: number;
  longestOverStreak: number;
  rolling7UnderOver: Record<string, number>;
  /** All workout days in range, regardless of food logging */
  totalWorkoutDays: number;
  /** Total FIT50 rows completed across all workout days */
  totalWorkoutRows: number;
}

const empty: AnalyticsTotals = {
  daysInRange: 0,
  daysLogged: 0,
  daysUnderBudget: 0,
  daysOverBudget: 0,
  daysOnTarget: 0,
  daysWorkedOut: 0,
  avgKcalActual: 0,
  avgKcalTarget: 0,
  avgUnderOver: 0,
  avgUnderOverAdjusted: 0,
  totalWorkoutKcal: 0,
  totalKcalEaten: 0,
  avgMacroSplit: { protein: 0, carbs: 0, fat: 0 },
  longestUnderStreak: 0,
  longestOverStreak: 0,
  rolling7UnderOver: {},
  totalWorkoutDays: 0,
  totalWorkoutRows: 0,
};

function getRangeStartKey(range: AnalyticsRange): { start: string | null; end: string | null } {
  const now = new Date();
  if (range === '7d') {
    const d = new Date(now);
    d.setDate(d.getDate() - 6);
    return { start: dateKeyLocal(d), end: dateKeyLocal(now) };
  }
  if (range === '30d') {
    const d = new Date(now);
    d.setDate(d.getDate() - 29);
    return { start: dateKeyLocal(d), end: dateKeyLocal(now) };
  }
  if (range === 'all') {
    return { start: null, end: null };
  }
  // custom range
  return { start: range.custom.start, end: range.custom.end };
}

function computeRolling7(
  days: AnalyticsDay[],
  rangeStartKey: string | null
): Record<string, number> {
  const sorted = [...days]
    .filter((d) => d.hadLoggedFood)
    .sort((a, b) => a.day_key.localeCompare(b.day_key));
  const result: Record<string, number> = {};
  for (let i = 0; i < sorted.length; i++) {
    const window = sorted.slice(Math.max(0, i - 6), i + 1);
    if (window.length < 2) continue;
    const avg = window.reduce((s, d) => s + d.kcalUnderOver, 0) / window.length;
    result[sorted[i].day_key] = avg;
  }
  return result;
}

function longestStreak(values: boolean[]): number {
  let max = 0;
  let cur = 0;
  for (const v of values) {
    if (v) { cur++; max = Math.max(max, cur); }
    else cur = 0;
  }
  return max;
}

export function useFoodAnalytics(
  range: AnalyticsRange,
  startDate: string | null
): {
  loaded: boolean;
  days: AnalyticsDay[];
  totals: AnalyticsTotals;
  weightReadings: WeightReading[];
  weightProjection: WeightProjectionPoint[];
  weightBaseline: number | null;
  /** Average net surplus per day in the loaded range (kcal). Negative
   *  means average deficit (weight loss trend); positive means
   *  average surplus (weight gain trend). Used by the weight chart's
   *  forward projection ("at this rate, you'll weigh X kg by Y"). */
  avgDailyNetKcal: number;
} {
  const { user } = useAuth();
  const supabase = createClient();
  const [days, setDays] = useState<AnalyticsDay[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [weightReadings, setWeightReadings] = useState<WeightReading[]>([]);
  const [weightProjection, setWeightProjection] = useState<
    WeightProjectionPoint[]
  >([]);
  const [weightBaseline, setWeightBaseline] = useState<number | null>(null);
  const [avgDailyNetKcal, setAvgDailyNetKcal] = useState<number>(0);
  const [totals, setTotals] = useState<AnalyticsTotals>(empty);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!user || !supabase) {
        setDays([]);
        setTotals(empty);
        setWeightReadings([]);
        setWeightProjection([]);
        setWeightBaseline(null);
        setAvgDailyNetKcal(0);
        setLoaded(false);
        return;
      }

      const rangeStart = getRangeStartKey(range);

      const [foodRes, workoutsRes, profileRes, weightRes] = await Promise.all([
        (supabase.from('food_log') as any)
          .select('day_key, kcal, protein, carbs, fat, fiber')
          .eq('user_id', user.id)
          .order('day_key', { ascending: true }),
        (supabase.from('workout_log') as any)
          .select('date_key, line, sets, grouping')
          .eq('user_id', user.id),
        (supabase.from('macro_profile') as any)
          .select('results_kcal, results_protein, results_carbs, results_fat, weight_kg, age, sex, height_cm, kettlebell_weight_kg')
          .eq('user_id', user.id)
          .maybeSingle(),
        // Pull all the user's weight readings (small list, bounded by
        // their actual weigh-in cadence). The chart filters by range
        // client-side using the day_key. We fetch all rather than only
        // the visible range so the baseline can come from earlier days
        // if the user weighed in before the range started.
        (supabase.from('weight_log') as any)
          .select('day_key, weight_kg, notes')
          .eq('user_id', user.id)
          .order('day_key', { ascending: true }),
      ]);

      if (cancelled) return;

      const kcalTarget = Number(profileRes.data?.results_kcal) || 2000;
      const proteinTarget = Number(profileRes.data?.results_protein) || 150;
      const carbsTarget = Number(profileRes.data?.results_carbs) || 200;
      const fatTarget = Number(profileRes.data?.results_fat) || 70;
      const weightKg = Number(profileRes.data?.weight_kg) || 80;
      const age = Number(profileRes.data?.age) || 30;
      const sex = (profileRes.data?.sex === 'male' || profileRes.data?.sex === 'female')
        ? profileRes.data.sex
        : 'male';
      const heightCm = Number(profileRes.data?.height_cm) || 170;
      const kbWeightKg = profileRes.data?.kettlebell_weight_kg != null
        ? Number(profileRes.data.kettlebell_weight_kg)
        : null;

      const MET_LOOKUP = buildMetLookup(weightKg, kbWeightKg);

      // Group food by day_key
      const foodByDay: Record<string, FoodLogEntry[]> = {};
      for (const row of foodRes.data || []) {
        if (!foodByDay[row.day_key]) foodByDay[row.day_key] = [];
        foodByDay[row.day_key].push(row as FoodLogEntry);
      }

      // Group workouts by date_key
      const workoutByDay: Record<string, { line: string; grouping: string; sets: Record<string, number> }[]> = {};
      for (const row of workoutsRes.data || []) {
        if (!workoutByDay[row.date_key]) workoutByDay[row.date_key] = [];
        workoutByDay[row.date_key].push({
          line: row.line,
          grouping: row.grouping || 'bodyweight',
          sets: row.sets || {},
        });
      }

      const { start: rangeStartKey, end: rangeEndKey } = rangeStart;

      function inRange(k: string) {
        if (rangeStartKey && k < rangeStartKey) return false;
        if (rangeEndKey && k > rangeEndKey) return false;
        return true;
      }

      // Build day list from BOTH food-logged days AND workout days in range
      const allDayKeys = [...new Set([
        ...Object.keys(foodByDay),
        ...Object.keys(workoutByDay),
      ])].filter(inRange).sort();

      const builtDays: AnalyticsDay[] = allDayKeys.map((day_key) => {
        const entries = foodByDay[day_key] || [];
        const hadLoggedFood = entries.length > 0;
        const workouts = workoutByDay[day_key] || [];
        const hadWorkout = workouts.some((w) => {
          const sets = w.sets || {};
          return (
            Object.keys(sets).length >= WORKOUT_EXERCISES_PER_LINE &&
            Object.values(sets).every(
              (n) => Number(n) >= WORKOUT_SETS_PER_EXERCISE
            )
          );
        });

        const kcalActual = entries.reduce((s, e) => s + Number(e.kcal), 0);
        const proteinActual = entries.reduce((s, e) => s + Number(e.protein), 0);
        const carbsActual = entries.reduce((s, e) => s + Number(e.carbs), 0);
        const fatActual = entries.reduce((s, e) => s + Number(e.fat), 0);
        const fiberActual = entries.reduce((s, e) => s + Number(e.fiber), 0);

        // Count completed exercise slots for this day
        const completedSlots = workouts.filter((w) => {
          const sets = w.sets || {};
          return (
            Object.keys(sets).length >= WORKOUT_EXERCISES_PER_LINE &&
            Object.values(sets).every(
              (n) => Number(n) >= WORKOUT_SETS_PER_EXERCISE
            )
          );
        }).length;

        // Sum per-exercise kcal using BMR-adjusted MET formula
        let workoutKcalEstimate = 0;
        for (const w of workouts) {
          const sets = w.sets || {};
          const linesByGroup: Record<string, AllLines> = {
            bodyweight: workoutLines,
            kettlebell: kettlebellLines,
            band: bandLines,
          };
          const lines = linesByGroup[w.grouping] ?? workoutLines;
          const lineData = lines[w.line as Line];
          if (!lineData) continue;
          for (const exercise of lineData.exercises) {
            const setsDone = Number(sets[exercise.name] ?? 0);
            if (setsDone === 0) continue;
            const met = MET_LOOKUP[exercise.name]?.met;
            if (met === undefined) continue;
            const exKcal = estimateExerciseKcal({
              age,
              sex: sex as 'male' | 'female',
              heightCm,
              weightKg,
              met,
              reps: exercise.reps,
            });
            workoutKcalEstimate += exKcal * setsDone;
          }
        }
        const kcalUnderOver = kcalTarget - kcalActual;
        const kcalUnderOverAdjusted = kcalUnderOver + workoutKcalEstimate;

        return {
          day_key,
          dayNumber: startDate
            ? dayIndexFromStart(startDate, parseDateKey(day_key))
            : null,
          hadLoggedFood,
          hadWorkout,
          kcalActual,
          kcalTarget,
          kcalUnderOver,
          proteinActual,
          proteinTarget,
          carbsActual,
          carbsTarget,
          fatActual,
          fatTarget,
          fiberActual,
          fiberTarget: DEFAULT_FIBER_TARGET,
          workoutKcalEstimate,
          kcalUnderOverAdjusted,
        };
      });

      // Compute rolling 7-day average (only for days with food logged)
      const rolling7 = computeRolling7(builtDays, rangeStart?.start ?? null);

      // Compute totals (only for days with food logged)
      const loggedDays = builtDays.filter((d) => d.hadLoggedFood);
      const onTargetBand = 0.05; // 95-105%
      const daysUnderBudget = loggedDays.filter(
        (d) => d.kcalUnderOver > kcalTarget * onTargetBand
      ).length;
      const daysOverBudget = loggedDays.filter(
        (d) => d.kcalUnderOver < -kcalTarget * onTargetBand
      ).length;
      const daysOnTarget = loggedDays.length - daysUnderBudget - daysOverBudget;
      const daysWorkedOut = loggedDays.filter((d) => d.hadWorkout).length;

      // All workout days in the range (not filtered by food log)
      const allWorkoutDays = builtDays.filter((d) => d.hadWorkout);
      const totalWorkoutDays = allWorkoutDays.length;

      // Count total completed FIT50 rows across all workout days in range
      let totalWorkoutRows = 0;
      for (const [dayKey, dayWorkouts] of Object.entries(workoutByDay)) {
        if (!inRange(dayKey)) continue;
        for (const w of dayWorkouts) {
          const sets = w.sets || {};
          const isComplete =
            Object.keys(sets).length >= WORKOUT_EXERCISES_PER_LINE &&
            Object.values(sets).every((n) => Number(n) >= WORKOUT_SETS_PER_EXERCISE);
          if (isComplete) totalWorkoutRows++;
        }
      }

      const avgKcalActual =
        loggedDays.length > 0
          ? loggedDays.reduce((s, d) => s + d.kcalActual, 0) / loggedDays.length
          : 0;
      const avgKcalTarget =
        loggedDays.length > 0
          ? loggedDays.reduce((s, d) => s + d.kcalTarget, 0) / loggedDays.length
          : 0;
      const avgUnderOver = avgKcalTarget - avgKcalActual;
      const avgUnderOverAdjusted =
        avgUnderOver +
        (loggedDays.length > 0
          ? loggedDays.reduce((s, d) => s + d.workoutKcalEstimate, 0) /
            loggedDays.length
          : 0);
      // Sum workout kcal across ALL workout days in range (not just food-logged days)
      const totalWorkoutKcal = builtDays.reduce(
        (s, d) => s + d.workoutKcalEstimate,
        0
      );
      // Sum kcal eaten across all food-logged days in range
      const totalKcalEaten = loggedDays.reduce(
        (s, d) => s + d.kcalActual,
        0
      );

      // Avg macro split (P/C/F as % of total kcal from macros)
      const avgProteinG =
        loggedDays.length > 0
          ? loggedDays.reduce((s, d) => s + d.proteinActual, 0) /
            loggedDays.length
          : 0;
      const avgCarbsG =
        loggedDays.length > 0
          ? loggedDays.reduce((s, d) => s + d.carbsActual, 0) /
            loggedDays.length
          : 0;
      const avgFatG =
        loggedDays.length > 0
          ? loggedDays.reduce((s, d) => s + d.fatActual, 0) / loggedDays.length
          : 0;
      const proteinKcal = avgProteinG * 4;
      const carbsKcal = avgCarbsG * 4;
      const fatKcal = avgFatG * 9;
      const totalMacroKcal = proteinKcal + carbsKcal + fatKcal;
      const avgMacroSplit =
        totalMacroKcal > 0
          ? {
              protein: Math.round((proteinKcal / totalMacroKcal) * 100),
              carbs: Math.round((carbsKcal / totalMacroKcal) * 100),
              fat: Math.round((fatKcal / totalMacroKcal) * 100),
            }
          : { protein: 33, carbs: 40, fat: 27 };

      // Streak computation
      const underValues = loggedDays.map((d) => d.kcalUnderOver > 0);
      const longestUnderStreak = longestStreak(underValues);
      const overValues = loggedDays.map((d) => d.kcalUnderOver <= 0);
      const longestOverStreak = longestStreak(overValues);

      if (cancelled) return;

      // -------- Weight projection ----------
      // Pull the user's weight readings. We have all of them above
      // (no range filter on the query), so `weightReadings` covers
      // every weigh-in the user has logged. The "baseline" is the
      // most recent reading on or before the range start — that's
      // the weight we project forward from. If none exists in range
      // we fall back to the latest reading anywhere; if still none,
      // we fall back to the macro_profile.weight_kg so the chart has
      // a sensible starting point even with zero weigh-ins.
      const allReadings: WeightReading[] = (((weightRes as any)?.data ??
        []) as Array<Record<string, unknown>>).map((r) => ({
        day_key: r.day_key as string,
        weight_kg: Number(r.weight_kg),
        notes: (r.notes as string | null) ?? null,
      }));

      // Pick baseline: latest reading on or before range start, else
      // latest reading anywhere, else the macro profile snapshot.
      const readingsBeforeStart = allReadings.filter(
        (r) =>
          !rangeStartKey ||
          r.day_key <= rangeStartKey
      );
      const fallbackLatest = allReadings[allReadings.length - 1];
      const baselineReading =
        readingsBeforeStart[readingsBeforeStart.length - 1] ??
        fallbackLatest ??
        null;
      const baselineKg = baselineReading
        ? baselineReading.weight_kg
        : weightKg > 0
          ? weightKg
          : null;

      // Build per-day projection. For each day in `builtDays` we
      // calculate the cumulative weight change since baseline by
      // summing each day's NET SURPLUS / 7700 kcal per kg of body
      // fat. Net surplus = (actual + workout - target). Positive
      // means surplus → weight gain; negative means deficit →
      // weight loss.
      //
      // We also sum net surplus across the whole range to expose
      // an "average per day" rate that powers the forward-
      // projection forecast ("at this pace, you'll weigh X kg by
      // the end of the 30-day window").
      const CAL_PER_KG = 7700;
      let totalNetKcal = 0;
      const projection: WeightProjectionPoint[] = [];
      let cumulative = 0;
      for (const d of builtDays) {
        const netSurplusKcal =
          (d.kcalActual ?? 0) +
          (d.workoutKcalEstimate ?? 0) -
          (d.kcalTarget ?? 0);
        totalNetKcal += netSurplusKcal;
        cumulative += netSurplusKcal / CAL_PER_KG;
        const projectedKg = baselineKg != null ? baselineKg + cumulative : null;
        const actualReading = allReadings.find(
          (r) => r.day_key === d.day_key
        );
        projection.push({
          day_key: d.day_key,
          projected: projectedKg,
          projectedSmoothed: null, // filled below
          actual: actualReading?.weight_kg ?? null,
        });
      }
      // 7-day trailing average of `projected`. For the first 6 days
      // the window is shorter (days from start..i). Smoothed value is
      // null if projection was null.
      for (let i = 0; i < projection.length; i++) {
        const start = Math.max(0, i - 6);
        const window = projection.slice(start, i + 1);
        const validValues = window
          .map((p) => p.projected)
          .filter((v): v is number => v != null);
        if (validValues.length === 0) {
          projection[i].projectedSmoothed = null;
        } else {
          projection[i].projectedSmoothed =
            validValues.reduce((s, v) => s + v, 0) / validValues.length;
        }
      }

      // Filter weightReadings to the visible range so the UI doesn't
      // render 2-year-old readings on the 30d chart. Keep at least
      // the baseline reading so the projection line has a visible
      // anchor even if it's outside the chart range.
      const visibleReadings = allReadings.filter(
        (r) => inRange(r.day_key)
      );
      if (
        baselineReading &&
        !visibleReadings.some((r) => r.day_key === baselineReading.day_key)
      ) {
        visibleReadings.unshift(baselineReading);
      }

      setDays(builtDays);
      setTotals({
        daysInRange: builtDays.length,
        daysLogged: loggedDays.length,
        daysUnderBudget,
        daysOverBudget,
        daysOnTarget: Math.max(0, daysOnTarget),
        daysWorkedOut,
        avgKcalActual,
        avgKcalTarget,
        avgUnderOver,
        avgUnderOverAdjusted,
        totalWorkoutKcal,
        totalKcalEaten,
        avgMacroSplit,
        longestUnderStreak,
        longestOverStreak,
        rolling7UnderOver: rolling7,
        totalWorkoutDays,
        totalWorkoutRows,
      });
      setWeightReadings(visibleReadings);
      setWeightProjection(projection);
      setWeightBaseline(baselineKg);
      setAvgDailyNetKcal(
        builtDays.length > 0 ? totalNetKcal / builtDays.length : 0
      );
      setLoaded(true);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [user, supabase, range, startDate]);

  return {
    loaded,
    days,
    totals,
    weightReadings,
    weightProjection,
    weightBaseline,
    avgDailyNetKcal,
  };
}
