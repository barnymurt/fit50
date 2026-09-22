// FIT50 Macro Calculator — locked formulas
// All math from Implementation Spec §9.
//
// IMPORTANT: the daily-activity burn (workout + 10K steps) is
// already baked into the TDEE via ACTIVITY_MULTIPLIER. The
// `workoutKcal` / `steps10kKcal` fields below are ESTIMATES of
// that baked-in activity for the user to see what their daily
// routine costs — they are NOT added on top of the calorie
// budget. Adding them would double-count.

import type {
  Activity,
  Diet,
  Goal,
  HeightValue,
  MacroResults,
  Sex,
  WeightValue,
} from './types';

const ACTIVITY_MULTIPLIER: Record<Activity, number> = {
  none: 1.55,
  light: 1.65,
  moderate: 1.75,
  heavy: 1.85,
};

const GOAL_MULTIPLIER: Record<Goal, number> = {
  loss: 0.82,
  recomp: 1.0,
  muscle: 1.08,
};

const DIET_CARB_PCT: Record<Diet, number> = {
  balanced: 0.5,
  lower: 0.3,
  higher: 0.7,
};

const DIET_FAT_PCT: Record<Diet, number> = {
  balanced: 0.5,
  lower: 0.7,
  higher: 0.3,
};

// ---------------------------------------------------------------------------
// Daily-activity burn estimates. These are NOT part of the calorie budget
// (the existing callout says don't eat back the burn) but the user wants
// to see how much each FIT50 piece costs so they can understand the
// numbers they're eating against. Estimates based on MET for body-weight
// resistance work and brisk walking.
//
// MET source: 2024 Compendium of Physical Activities.
//   Body-weight resistance, moderate effort: MET 5.0
//   Walking 3.0 mph, level surface:        MET 3.5
//
// kcal = MET * weight_kg * hours
// ---------------------------------------------------------------------------
const WORKOUT_MET = 5.0;          // body-weight resistance, moderate
const WORKOUT_MINUTES = 10;        // one FIT50 line is ~10 min
const STEPS_MET = 3.5;             // walking ~3 mph
const STEPS_KM_PER_10K = 7;        // avg stride: 10k steps ≈ 7 km
const STEPS_KM_PER_HOUR = 5;        // ~3 mph

function workoutKcal(weightKg: number): number {
  return WORKOUT_MET * weightKg * (WORKOUT_MINUTES / 60);
}

// Exported so the saved-profile hydration path in /account can
// fill these in from `macro_profile.weight_kg` without a full
// recalculation.
export function estimateWorkoutKcal(weightKg: number): number {
  return workoutKcal(weightKg);
}

function calculateBmrMifflinStJeor(
  age: number,
  sex: 'male' | 'female',
  heightCm: number,
  weightKg: number
): number {
  if (sex === 'male') {
    return 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  } else {
    return 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
  }
}

function parseRepsDuration(reps: string): number {
  const timeMatch = reps.match(/(\d+)\s*[×x]\s*(\d+)s/);
  if (timeMatch) {
    const sets = parseInt(timeMatch[1], 10);
    const seconds = parseInt(timeMatch[2], 10);
    return sets * seconds;
  }
  const match = reps.match(/(\d+)\s*[×x]\s*(\d+)/);
  if (!match) return 60;
  const sets = parseInt(match[1], 10);
  const repsPerSet = parseInt(match[2], 10);
  const isPerSide = reps.toLowerCase().includes('/side');
  const totalReps = isPerSide ? sets * repsPerSet * 2 : sets * repsPerSet;
  return Math.round(totalReps * 3);
}

export function estimateExerciseKcal(params: {
  age: number;
  sex: 'male' | 'female';
  heightCm: number;
  weightKg: number;
  met: number;
  reps: string;
}): number {
  const { age, sex, heightCm, weightKg, met, reps } = params;
  const bmr = calculateBmrMifflinStJeor(age, sex, heightCm, weightKg);
  const durationMin = parseRepsDuration(reps) / 60;
  return Math.round((bmr / 1440) * met * durationMin);
}

function steps10kKcal(weightKg: number): number {
  const hours = (STEPS_KM_PER_10K / STEPS_KM_PER_HOUR);
  return STEPS_MET * weightKg * hours;
}

export function estimateSteps10kKcal(weightKg: number): number {
  return steps10kKcal(weightKg);
}

function heightToCm(h: HeightValue): number | null {
  if (h.unit === 'cm') return h.value;
  const feet = h.feet ?? 0;
  const inches = h.inches ?? 0;
  const totalInches = feet * 12 + inches;
  return totalInches * 2.54;
}

function weightToKg(w: WeightValue): number | null {
  if (w.unit === 'kg') return w.value;
  return w.value ? w.value * 0.453592 : null;
}

export function calculateMacros(input: {
  age: number;
  sex: Sex;
  height: HeightValue;
  weight: WeightValue;
  bodyFat: number | null;
  activity: Activity;
  goal: Goal;
  diet: Diet;
}): MacroResults {
  const heightCm = heightToCm(input.height);
  const weightKg = weightToKg(input.weight);
  if (heightCm === null || weightKg === null) {
    throw new Error('Invalid height or weight');
  }

  let bmr: number;
  let leanKg: number;
  if (input.bodyFat !== null && input.bodyFat > 0) {
    leanKg = weightKg * (1 - input.bodyFat / 100);
    bmr = 370 + 21.6 * leanKg;
  } else if (input.sex === 'male') {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * input.age + 5;
    leanKg = weightKg;
  } else {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * input.age - 161;
    leanKg = weightKg;
  }

  const tdee = bmr * ACTIVITY_MULTIPLIER[input.activity];
  const calories = tdee * GOAL_MULTIPLIER[input.goal];

  const proteinFromBodyFat = input.bodyFat !== null && input.bodyFat > 0;
  const proteinG = proteinFromBodyFat ? leanKg * 2.4 : weightKg * 2.0;
  const proteinKcal = proteinG * 4;

  const remaining = Math.max(0, calories - proteinKcal);
  const carbsKcal = remaining * DIET_CARB_PCT[input.diet as Diet];
  const fatKcal = remaining * DIET_FAT_PCT[input.diet as Diet];
  const carbsG = carbsKcal / 4;
  const fatG = fatKcal / 9;

  const waterL = Math.max(2.5, weightKg * 0.035);

  return {
    bmr: roundTo(bmr, 0),
    tdee: roundTo(tdee, 0),
    calories: roundTo(calories, 10),
    proteinG: roundTo(proteinG, 5),
    carbsG: roundTo(carbsG, 5),
    fatG: roundTo(fatG, 5),
    waterL: roundTo(waterL, 1),
    workoutKcal: roundTo(workoutKcal(weightKg), 0),
    steps10kKcal: roundTo(steps10kKcal(weightKg), 0),
  };
}

function roundTo(n: number, nearest: number): number {
  // Guard against divide-by-zero — without this, roundTo(x, 0)
  // returns NaN (Math.round(Infinity) * 0). A 0 nearest means "no
  // rounding" so just return n.
  if (!nearest) return n;
  return Math.round(n / nearest) * nearest;
}

export function cmToFtIn(cm: number): { feet: number; inches: number } {
  const totalInches = cm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches - feet * 12);
  return { feet, inches: inches === 12 ? 0 : inches };
}

const KB_WEIGHT_BASE_KG = 8; // standard reference weight for KB MET values
const KB_WEIGHT_MAX_MULT = 1.5; // cap the load multiplier

export function adjustMetForLoad(baseMet: number, kbWeightKg: number | null): number {
  if (kbWeightKg == null || kbWeightKg <= 0) return baseMet;
  const ratio = kbWeightKg / KB_WEIGHT_BASE_KG;
  const mult = Math.min(ratio, KB_WEIGHT_MAX_MULT);
  return baseMet * mult;
}

export const KB_EXERCISE_MET: Record<string, number> = {
  'KB Floor Press': 4.5,
  'KB Strict Press': 4.5,
  'KB Push Press': 5.0,
  'KB Z Press': 4.5,
  'KB Halo': 3.5,
  'KB Bent-Over Row': 5.0,
  'KB Single-Arm Row': 5.0,
  'KB High Pull': 6.0,
  'KB Gorilla Row': 6.0,
  'KB Goblet Squat Pulses': 5.5,
  'KB Goblet Squat': 5.0,
  'KB Romanian Deadlift': 5.5,
  'KB Reverse Lunge': 5.0,
  'KB Cossack Squat': 5.5,
  "KB Farmer's Carry": 5.0,
  'KB Clean and Press': 6.0,
  'KB Thruster': 5.5,
  'KB Snatch': 6.5,
  'KB Clean': 5.5,
  'KB Snatches': 6.5,
};

export const BAND_EXERCISE_MET: Record<string, number> = {
  'RB Chest Press': 4.0,
  'RB Overhead Press': 4.0,
  'RB Chest Fly': 3.5,
  'RB Lateral Raise': 3.5,
  'Banded High Knees': 6.0,
  'RB Seated Row': 4.5,
  'RB Bent-Over Row': 4.5,
  'RB Face Pull': 3.5,
  'RB Bicep Curl': 3.0,
  'Banded Jumping Jacks': 6.0,
  'RB Banded Squat': 4.5,
  'RB Banded Deadlift': 4.5,
  'RB Lateral Band Walk': 4.0,
  'RB Glute Kickback': 3.5,
  'Banded Skater Jumps': 6.5,
  'RB Thruster': 5.0,
  'RB Burpee': 8.0,
  'RB Clean and Press': 5.5,
  'RB Renegade Row': 5.0,
  'Banded Fast Punches': 5.5,
};
