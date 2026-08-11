// FIT50 Macro Calculator — locked copy
// All strings from Implementation Spec §13. Do not paraphrase.

export const COPY = {
  eyebrow: '05 · Macro Calculator',
  statementLine: 'Nine habits demand fuel — this is yours.',
  panelEyebrow: 'Your numbers',
  fields: {
    age: 'Age',
    sex: 'Sex',
    height: 'Height',
    weight: 'Weight',
    bodyFat: 'Body fat %',
    activity: 'Activity beyond FIT50',
    goal: 'Goal',
    diet: 'Diet',
  },
  bodyFatToggle: 'Know your body fat %?',
  bodyFatHelp: "Skip if unsure — we'll use a solid estimate.",
  activityHelp: 'Your daily workout and 10K steps are already counted. This is anything on top.',
  goalHelp: {
    loss: 'Eat 18% below maintenance.',
    recomp: 'Eat at maintenance.',
    muscle: 'Eat 8% above maintenance.',
  },
  dietHelp: {
    balanced: '50 / 50 carbs & fat',
    lower: '30 / 70 carbs & fat',
    higher: '70 / 30 carbs & fat',
  },
  primaryCta: 'Calculate my macros',
  primaryCtaAfter: 'Recalculate',
  resultsEyebrow: 'Daily calories',
  rows: {
    protein: 'Protein',
    carbs: 'Carbs',
    fat: 'Fat',
    water: 'Water',
  },
  waterMeta: 'FIT50 min: 2.5 L',
  callout: 'Your FIT50 workout and 10,000 steps are already baked in. Don\u2019t eat back the burn.',
  disclaimer: 'Estimates only. Not medical advice.',
  closingLine: 'Ready to track it?',
  closingCta: 'Start tracking',
  marqueeText: 'FUEL THE FIFTY · MACROS · HIT YOUR NUMBERS ✦',
  activitySubLabels: {
    none: 'Just FIT50',
    light: '1\u20132 extra/wk',
    moderate: '3\u20134 extra/wk',
    heavy: '5+ or active job',
  } as Record<'none' | 'light' | 'moderate' | 'heavy', string>,
  sexOptions: { male: 'Male', female: 'Female' } as Record<'male' | 'female', string>,
  activityOptions: {
    none: 'None',
    light: 'Light',
    moderate: 'Moderate',
    heavy: 'Heavy',
  } as Record<'none' | 'light' | 'moderate' | 'heavy', string>,
  goalOptions: {
    loss: 'Fat loss',
    recomp: 'Recomp',
    muscle: 'Muscle',
  } as Record<'loss' | 'recomp' | 'muscle', string>,
  dietOptions: {
    balanced: 'Balanced',
    lower: 'Lower carb',
    higher: 'Higher carb',
  } as Record<'balanced' | 'lower' | 'higher', string>,
  unitLabels: {
    cm: 'cm',
    ftin: 'ft / in',
    kg: 'kg',
    lbs: 'lbs',
  } as Record<string, string>,
  errors: {
    age: 'Enter an age between 15 and 80.',
    sex: 'Choose male or female.',
    height: 'Enter a valid height.',
    weight: 'Enter a valid weight.',
    bodyFat: 'Enter a body fat percentage between 5 and 50.',
    activity: 'Choose an activity level.',
  } as Record<string, string>,
} as const;

export const KCAL_UNIT = 'kcal';
