'use client';

import { useEffect, useMemo, useState } from 'react';
import { loadJson, saveJson } from '@/lib/storage';
import { calculateMacros } from './formulas';
import { COPY } from './copy';
import type { CalculatorState, MacroResults, Sex, Goal, Diet, Activity, HeightUnit, WeightUnit } from './types';
import FieldGroup from './FieldGroup';
import ChipGroup from './ChipGroup';
import UnitInput from './UnitInput';
import BodyFatDisclosure from './BodyFatDisclosure';
import ResultsBlock from './ResultsBlock';
import Button from '../Button';

const STORAGE_KEY = 'fit50-macros-v1';

const PERSISTED_KEYS = [
  'age', 'sex', 'height', 'weight', 'bodyFat', 'activity', 'goal', 'diet',
] as const;

const DEFAULT_STATE: CalculatorState = {
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

interface CalculatorPanelProps {
  results: MacroResults | null;
  setResults: (r: MacroResults | null) => void;
  onCalculated: () => void;
}

export default function CalculatorPanel({ results, setResults, onCalculated }: CalculatorPanelProps) {
  const [state, setState] = useState<CalculatorState>(DEFAULT_STATE);
  const [hydrated, setHydrated] = useState(false);
  const [bodyFatOpen, setBodyFatOpen] = useState(false);

  useEffect(() => {
    const saved = loadJson<Partial<CalculatorState>>(STORAGE_KEY, {});
    const merged: CalculatorState = { ...DEFAULT_STATE, ...saved };
    if (saved.height) merged.height = { ...DEFAULT_STATE.height, ...saved.height };
    if (saved.weight) merged.weight = { ...DEFAULT_STATE.weight, ...saved.weight };
    setState(merged);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const toSave: Record<string, unknown> = {};
    for (const k of PERSISTED_KEYS) {
      toSave[k] = (state as unknown as Record<string, unknown>)[k];
    }
    saveJson(STORAGE_KEY, toSave);
  }, [state, hydrated]);

  const set = <K extends keyof CalculatorState>(k: K, v: CalculatorState[K]) =>
    setState((s) => ({ ...s, [k]: v, errors: { ...s.errors, [k as string]: '' } }));

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (state.age === null || state.age < 15 || state.age > 80) errors.age = COPY.errors.age;
    if (!state.sex) errors.sex = COPY.errors.sex;
    if (
      state.height.unit === 'cm'
        ? state.height.value === null || state.height.value < 120 || state.height.value > 220
        : state.height.feet === null || state.height.inches === null || (state.height.feet ?? 0) < 3 || (state.height.feet ?? 0) > 7
    )
      errors.height = COPY.errors.height;
    if (
      state.weight.unit === 'kg'
        ? state.weight.value === null || state.weight.value < 35 || state.weight.value > 200
        : state.weight.value === null || state.weight.value < 80 || state.weight.value > 440
    )
      errors.weight = COPY.errors.weight;
    if (!state.activity) errors.activity = COPY.errors.activity;
    setState((s) => ({ ...s, errors }));
    return Object.keys(errors).length === 0;
  };

  const handleCalculate = () => {
    if (!validate()) return;
    try {
      const r = calculateMacros({
        age: state.age!,
        sex: state.sex!,
        height: state.height,
        weight: state.weight,
        bodyFat: state.bodyFat,
        activity: state.activity!,
        goal: state.goal,
        diet: state.diet,
      });
      setResults(r);
      onCalculated();
    } catch {
      // Validation should have caught this
    }
  };

  const ctaLabel = state.hasCalculated ? COPY.primaryCtaAfter : COPY.primaryCta;
  const ctaDisabled = useMemo(() => {
    if (state.age === null || state.age < 15 || state.age > 80) return true;
    if (!state.sex) return true;
    if (state.height.value === null && (state.height.feet === null || state.height.inches === null)) return true;
    if (state.weight.value === null) return true;
    if (!state.activity) return true;
    return false;
  }, [state]);

  return (
    <div className="bg-paper border border-ink/10 p-6 md:p-10">
      <p className="font-body text-caption uppercase tracking-widest text-ink/50 mb-6">
        {COPY.panelEyebrow}
      </p>

      <div className="space-y-6">
        <FieldGroup label={COPY.fields.age} error={state.errors.age}>
          <input
            type="number"
            value={state.age ?? ''}
            onChange={(e) => set('age', e.target.value ? Number(e.target.value) : null)}
            placeholder="e.g. 32"
            min={15}
            max={80}
            className="w-full px-4 py-3 bg-cream/30 border-2 border-ink/20 text-ink font-body focus:border-ink outline-none rounded-none"
          />
        </FieldGroup>

        <ChipGroup
          label={COPY.fields.sex}
          options={[
            { value: 'male', label: COPY.sexOptions.male },
            { value: 'female', label: COPY.sexOptions.female },
          ]}
          value={state.sex}
          onChange={(v) => set('sex', v as Sex)}
        />

        <UnitInput
          label={COPY.fields.height}
          value={state.height.value}
          unit={state.height.unit}
          unitOptions={[
            { value: 'cm', label: COPY.unitLabels.cm },
            { value: 'ftin', label: COPY.unitLabels.ftin },
          ]}
          onChange={(v) => set('height', { ...state.height, value: v, unit: state.height.unit })}
          onUnitChange={(u) => set('height', { ...state.height, unit: u as HeightUnit, value: u === 'cm' ? state.height.value : null, feet: u === 'ftin' ? state.height.feet : undefined, inches: u === 'ftin' ? state.height.inches : undefined })}
          range={state.height.unit === 'cm' ? { min: 120, max: 220, step: 1 } : { min: 0, max: 0 }}
          feet={state.height.feet ?? null}
          inches={state.height.inches ?? null}
          onFeetChange={(v) => set('height', { ...state.height, feet: v ?? undefined, inches: state.height.inches })}
          onInchesChange={(v) => set('height', { ...state.height, inches: v ?? undefined, feet: state.height.feet })}
          error={state.errors.height}
        />

        <UnitInput
          label={COPY.fields.weight}
          value={state.weight.value}
          unit={state.weight.unit}
          unitOptions={[
            { value: 'kg', label: COPY.unitLabels.kg },
            { value: 'lbs', label: COPY.unitLabels.lbs },
          ]}
          onChange={(v) => set('weight', { ...state.weight, value: v, unit: state.weight.unit })}
          onUnitChange={(u) => set('weight', { ...state.weight, unit: u as WeightUnit, value: u === 'kg' ? state.weight.value : null })}
          range={state.weight.unit === 'kg' ? { min: 35, max: 200, step: 0.1 } : { min: 80, max: 440, step: 0.1 }}
          error={state.errors.weight}
        />

        <BodyFatDisclosure
          open={bodyFatOpen}
          onToggle={() => setBodyFatOpen((o) => !o)}
          label={COPY.bodyFatToggle}
          help={!bodyFatOpen ? COPY.bodyFatHelp : undefined}
          error={state.errors.bodyFat}
        >
          <input
            type="number"
            value={state.bodyFat ?? ''}
            onChange={(e) => set('bodyFat', e.target.value ? Number(e.target.value) : null)}
            placeholder="e.g. 18"
            min={5}
            max={50}
            step={0.1}
            className="w-full px-4 py-3 bg-cream/30 border-2 border-ink/20 text-ink font-body focus:border-ink outline-none rounded-none"
          />
        </BodyFatDisclosure>

        <ChipGroup
          label={COPY.fields.activity}
          options={[
            { value: 'none', label: COPY.activityOptions.none, subLabel: COPY.activitySubLabels.none },
            { value: 'light', label: COPY.activityOptions.light, subLabel: COPY.activitySubLabels.light },
            { value: 'moderate', label: COPY.activityOptions.moderate, subLabel: COPY.activitySubLabels.moderate },
            { value: 'heavy', label: COPY.activityOptions.heavy, subLabel: COPY.activitySubLabels.heavy },
          ]}
          value={state.activity}
          onChange={(v) => set('activity', v as Activity)}
          help={COPY.activityHelp}
          layout="wrap"
        />

        <ChipGroup
          label={COPY.fields.goal}
          options={[
            { value: 'loss', label: COPY.goalOptions.loss },
            { value: 'recomp', label: COPY.goalOptions.recomp },
            { value: 'muscle', label: COPY.goalOptions.muscle },
          ]}
          value={state.goal}
          onChange={(v) => set('goal', v as Goal)}
          help={COPY.goalHelp[state.goal]}
        />

        <ChipGroup
          label={COPY.fields.diet}
          options={[
            { value: 'balanced', label: COPY.dietOptions.balanced },
            { value: 'lower', label: COPY.dietOptions.lower },
            { value: 'higher', label: COPY.dietOptions.higher },
          ]}
          value={state.diet}
          onChange={(v) => set('diet', v as Diet)}
          help={COPY.dietHelp[state.diet]}
        />
      </div>

      <div className="mt-8 flex justify-end">
        <Button
          onClick={handleCalculate}
          disabled={ctaDisabled}
          variant="primary"
          tone="light"
          shape="squared"
        >
          {ctaLabel}
        </Button>
      </div>

      {results && (
        <>
          <div className="border-t border-ink/10 mt-8 pt-8">
            <ResultsBlock results={results} />
          </div>
          <p className="font-body text-caption uppercase tracking-widest text-ink/40 mt-6 text-center">
            {COPY.disclaimer}
          </p>
        </>
      )}
    </div>
  );
}
