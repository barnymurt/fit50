'use client';

import { useState } from 'react';
import type { Sex, Activity, Goal, Diet, HeightUnit, WeightUnit } from './types';

interface CalculatorFormProps {
  age: string;
  setAge: (v: string) => void;
  sex: Sex | null;
  setSex: (v: Sex) => void;
  heightVal: string;
  setHeightVal: (v: string) => void;
  heightUnit: HeightUnit;
  setHeightUnit: (v: HeightUnit) => void;
  weightVal: string;
  setWeightVal: (v: string) => void;
  weightUnit: WeightUnit;
  setWeightUnit: (v: WeightUnit) => void;
  bodyFat: string;
  setBodyFat: (v: string) => void;
  activity: Activity | null;
  setActivity: (v: Activity) => void;
  goal: Goal;
  setGoal: (v: Goal) => void;
  diet: Diet;
  setDiet: (v: Diet) => void;
}

export default function CalculatorForm({
  age,
  setAge,
  sex,
  setSex,
  heightVal,
  setHeightVal,
  heightUnit,
  setHeightUnit,
  weightVal,
  setWeightVal,
  weightUnit,
  setWeightUnit,
  bodyFat,
  setBodyFat,
  activity,
  setActivity,
  goal,
  setGoal,
  diet,
  setDiet,
}: CalculatorFormProps) {
  const [bodyFatOpen, setBodyFatOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Age + Sex */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block font-body text-caption uppercase tracking-widest text-ink/50 mb-3">
            Age
          </label>
          <input
            type="number"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            placeholder="e.g. 32"
            min={15}
            max={80}
            className="w-full px-4 py-3 bg-cream/30 border-2 border-ink/20 text-ink font-body focus:border-ink outline-none rounded-none"
          />
        </div>
        <div>
          <label className="block font-body text-caption uppercase tracking-widest text-ink/50 mb-3">
            Sex
          </label>
          <div role="radiogroup" aria-label="Sex" className="flex gap-2">
            {(['male', 'female'] as Sex[]).map((s) => (
              <button
                key={s}
                type="button"
                role="radio"
                aria-checked={sex === s}
                onClick={() => setSex(s)}
                className={`flex-1 px-4 py-3 border text-sm font-body font-medium uppercase tracking-wider transition-colors duration-200 ease-smooth ${
                  sex === s
                    ? 'bg-ink text-paper border-ink'
                    : 'bg-transparent text-ink/70 border-ink/20 hover:border-ink hover:bg-ink/5'
                }`}
              >
                {s === 'male' ? 'Male' : 'Female'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Height + Weight */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <UnitInput
          label="Height"
          value={heightVal}
          setValue={setHeightVal}
          unit={heightUnit}
          setUnit={setHeightUnit}
          options={[
            { value: 'cm', label: 'cm' },
            { value: 'ftin', label: 'ft / in' },
          ]}
        />
        <UnitInput
          label="Weight"
          value={weightVal}
          setValue={setWeightVal}
          unit={weightUnit}
          setUnit={setWeightUnit}
          options={[
            { value: 'kg', label: 'kg' },
            { value: 'lbs', label: 'lbs' },
          ]}
        />
      </div>

      {/* Body fat (collapsible) */}
      <div>
        <button
          type="button"
          onClick={() => setBodyFatOpen(!bodyFatOpen)}
          className="flex items-center gap-3 text-ink/70 hover:text-ink transition-colors"
        >
          <span
            className={`flex-shrink-0 w-8 h-8 border border-ink/30 flex items-center justify-center transition-transform duration-300 ease-smooth ${
              bodyFatOpen ? 'rotate-45' : ''
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-ink/70">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </span>
          <span className="font-body text-caption uppercase tracking-widest">Know your body fat %?</span>
        </button>
        {bodyFatOpen && (
          <div className="mt-4 ml-11">
            <label className="block font-body text-caption uppercase tracking-widest text-ink/50 mb-3">
              Body fat %
            </label>
            <input
              type="number"
              value={bodyFat}
              onChange={(e) => setBodyFat(e.target.value)}
              placeholder="e.g. 18"
              min={5}
              max={50}
              step={0.1}
              className="w-full px-4 py-3 bg-cream/30 border-2 border-ink/20 text-ink font-body focus:border-ink outline-none rounded-none"
            />
            <p className="font-body text-sm text-ink/50 mt-2">
              Skip if unsure — we'll use a solid estimate.
            </p>
          </div>
        )}
      </div>

      {/* Activity */}
      <ChipGroupField
        label="Activity beyond FIT50"
        value={activity}
        onChange={setActivity}
        options={[
          { value: 'none', label: 'None', sub: 'Just FIT50' },
          { value: 'light', label: 'Light', sub: '1–2 extra/wk' },
          { value: 'moderate', label: 'Moderate', sub: '3–4 extra/wk' },
          { value: 'heavy', label: 'Heavy', sub: '5+ or active job' },
        ]}
        layout="wrap"
      />

      {/* Goal */}
      <ChipGroupField
        label="Goal"
        value={goal}
        onChange={setGoal}
        options={[
          { value: 'loss', label: 'Fat loss' },
          { value: 'recomp', label: 'Recomp' },
          { value: 'muscle', label: 'Muscle' },
        ]}
      />

      {/* Diet */}
      <ChipGroupField
        label="Diet"
        value={diet}
        onChange={setDiet}
        options={[
          { value: 'balanced', label: 'Balanced' },
          { value: 'lower', label: 'Lower carb' },
          { value: 'higher', label: 'Higher carb' },
        ]}
      />
    </div>
  );
}

interface UnitInputProps {
  label: string;
  value: string;
  setValue: (v: string) => void;
  unit: string;
  setUnit: (v: any) => void;
  options: { value: string; label: string }[];
}

function UnitInput({ label, value, setValue, unit, setUnit, options }: UnitInputProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <label className="font-body text-caption uppercase tracking-widest text-ink/50">
          {label}
        </label>
        <div role="tablist" aria-label={`${label} unit`} className="flex gap-1">
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              role="tab"
              aria-selected={unit === o.value}
              onClick={() => setUnit(o.value)}
              className={`font-body text-xs uppercase tracking-widest px-3 py-1 transition-colors ${
                unit === o.value
                  ? 'bg-ink text-paper'
                  : 'bg-paper text-ink/60 hover:bg-ink/5'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>
      <input
        type="number"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={`e.g. ${unit === 'cm' ? '178' : '80'}`}
        step={unit === 'cm' ? 1 : 0.1}
        className="w-full px-4 py-3 bg-cream/30 border-2 border-ink/20 text-ink font-body focus:border-ink outline-none rounded-none"
      />
    </div>
  );
}

interface ChipGroupFieldProps<T extends string> {
  label: string;
  value: T | null;
  onChange: (v: T) => void;
  options: { value: T; label: string; sub?: string }[];
  layout?: 'inline' | 'wrap';
}

function ChipGroupField<T extends string>({ label, value, onChange, options, layout = 'inline' }: ChipGroupFieldProps<T>) {
  return (
    <fieldset>
      <legend className="font-body text-caption uppercase tracking-widest text-ink/50 mb-3">
        {label}
      </legend>
      <div
        role="radiogroup"
        aria-label={label}
        className={`flex gap-2 ${layout === 'wrap' ? 'flex-wrap' : 'flex-col sm:flex-row'}`}
      >
        {options.map((opt) => (
          <div key={opt.value} className={layout === 'wrap' ? '' : 'flex-1'}>
            <button
              type="button"
              role="radio"
              aria-checked={value === opt.value}
              onClick={() => onChange(opt.value)}
              className={`w-full px-4 py-3 border text-sm font-body font-medium uppercase tracking-wider transition-colors duration-200 ease-smooth ${
                value === opt.value
                  ? 'bg-ink text-paper border-ink'
                  : 'bg-transparent text-ink/70 border-ink/20 hover:border-ink hover:bg-ink/5'
              }`}
            >
              <span className="block">{opt.label}</span>
              {opt.sub && (
                <span
                  className={`block text-[10px] font-normal normal-case tracking-normal mt-0.5 ${
                    value === opt.value ? 'text-paper/70' : 'text-ink/50'
                  }`}
                >
                  {opt.sub}
                </span>
              )}
            </button>
          </div>
        ))}
      </div>
    </fieldset>
  );
}
