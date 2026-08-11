// FIT50 Macro Calculator — locked formulas
// All math from Implementation Spec §9.

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
  };
}

function roundTo(n: number, nearest: number): number {
  return Math.round(n / nearest) * nearest;
}

export function cmToFtIn(cm: number): { feet: number; inches: number } {
  const totalInches = cm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches - feet * 12);
  return { feet, inches: inches === 12 ? 0 : inches };
}
