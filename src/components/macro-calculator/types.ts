// FIT50 Macro Calculator — type definitions
// Locked per FIT50 Macro Calculator Implementation Spec §8

export type Sex = 'male' | 'female';
export type HeightUnit = 'cm' | 'ftin';
export type WeightUnit = 'kg' | 'lbs';
export type Activity = 'none' | 'light' | 'moderate' | 'heavy';
export type Goal = 'loss' | 'recomp' | 'muscle';
export type Diet = 'balanced' | 'lower' | 'higher';

export interface HeightValue {
  value: number | null;
  unit: HeightUnit;
  feet?: number;
  inches?: number;
}

export interface WeightValue {
  value: number | null;
  unit: WeightUnit;
}

export interface CalculatorState {
  age: number | null;
  sex: Sex | null;
  height: HeightValue;
  weight: WeightValue;
  bodyFat: number | null;
  activity: Activity | null;
  goal: Goal;
  diet: Diet;
  hasCalculated: boolean;
  errors: Record<string, string>;
}

export interface MacroResults {
  bmr: number;
  tdee: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  waterL: number;
}

export const DEFAULT_STATE: CalculatorState = {
  age: null,
  sex: null,
  height: { value: null, unit: 'cm' },
  weight: { value: null, unit: 'kg' },
  bodyFat: null,
  activity: null,
  goal: 'loss',
  diet: 'balanced',
  hasCalculated: false,
  errors: {},
};
