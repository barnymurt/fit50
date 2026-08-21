'use client';

import { COPY, KCAL_UNIT } from './copy';
import type { MacroResults } from './types';

interface MacroRowProps {
  label: string;
  value: number;
  unit: string;
  pct: number;
  kcal: number;
}

function MacroRow({ label, value, unit, pct, kcal }: MacroRowProps) {
  return (
    <div className="flex items-center justify-between py-5 border-t border-ink/10">
      <p className="font-body text-caption uppercase tracking-widest text-ink/50">
        {label}
      </p>
      <div className="flex items-baseline gap-6">
        <p className="font-display text-2xl md:text-3xl text-ink tabular-nums leading-none">
          {value}
          <span className="text-base md:text-lg text-ink/60 font-body font-normal ml-1">{unit}</span>
        </p>
        <p className="font-body text-sm text-ink/60 tabular-nums">
          {pct}% <span className="text-ink/40">·</span> {kcal} {KCAL_UNIT}
        </p>
      </div>
    </div>
  );
}

interface ResultsBlockProps {
  results: MacroResults;
}

export default function ResultsBlock({ results }: ResultsBlockProps) {
  const proteinKcal = results.proteinG * 4;
  const carbsKcal = results.carbsG * 4;
  const fatKcal = results.fatG * 9;
  const totalKcal = results.calories;
  const pct = (k: number) => Math.round((k / totalKcal) * 100);

  return (
    <div
      aria-live="polite"
      className="opacity-0 animate-[fadeIn_300ms_ease_forwards]"
    >
      <style>{`@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
      <p className="font-body text-caption uppercase tracking-widest text-ink/50 mb-4">
        {COPY.resultsEyebrow}
      </p>

      <p
        className="font-display tabular-nums text-ink leading-none mb-2"
        style={{ fontSize: 'clamp(3rem, 8vw, 4.5rem)', letterSpacing: '-0.04em' }}
      >
        {results.calories.toLocaleString()}
        <span className="text-lg text-ink/50 font-body font-normal ml-3 align-middle">
          {KCAL_UNIT}
        </span>
      </p>

      <div className="mt-8">
        <MacroRow
          label={COPY.rows.protein}
          value={results.proteinG}
          unit="g"
          pct={pct(proteinKcal)}
          kcal={proteinKcal}
        />
        <MacroRow
          label={COPY.rows.carbs}
          value={results.carbsG}
          unit="g"
          pct={pct(carbsKcal)}
          kcal={carbsKcal}
        />
        <MacroRow
          label={COPY.rows.fat}
          value={results.fatG}
          unit="g"
          pct={pct(fatKcal)}
          kcal={fatKcal}
        />
        <MacroRow
          label={COPY.rows.water}
          value={results.waterL}
          unit="L"
          pct={0}
          kcal={0}
        />
      </div>

      {results.waterL > 0 && (
        <p className="font-body text-sm text-ink/60 mt-2 text-right">
          {COPY.waterMeta}
        </p>
      )}

      {/* Daily-activity burn estimates. NOT counted against the calorie
          budget above — these are what the user is "eating against"
          each day. Existing copy already says don't eat back the
          burn. */}
      <div className="mt-10 border-t border-ink/10 pt-5">
        <p className="font-body text-caption uppercase tracking-widest text-ink/50 mb-3">
          Daily activity burn (estimate)
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <BurnStat
            label="One workout line"
            kcal={results.workoutKcal}
            hint="~10 min, body-weight resistance"
          />
          <BurnStat
            label="10,000 steps"
            kcal={results.steps10kKcal}
            hint="~7 km, brisk walking"
          />
        </div>
        <p className="font-body text-sm text-ink/50 mt-3">
          ~{(results.workoutKcal + results.steps10kKcal).toLocaleString()} {KCAL_UNIT} burned by the daily routine on top of your maintenance.
        </p>
      </div>

      <p className="font-display text-xl text-ink leading-snug mt-8 max-w-md">
        {COPY.callout}
      </p>
    </div>
  );
}

interface BurnStatProps {
  label: string;
  kcal: number;
  hint: string;
}

function BurnStat({ label, kcal, hint }: BurnStatProps) {
  return (
    <div className="border border-ink/10 px-4 py-3 bg-cream/20">
      <p className="font-body text-caption uppercase tracking-widest text-ink/60">
        {label}
      </p>
      <p className="font-display text-2xl text-ink leading-none mt-1 tabular-nums">
        {kcal.toLocaleString()}
        <span className="text-sm text-ink/50 font-body font-normal ml-1.5">
          {KCAL_UNIT}
        </span>
      </p>
      <p className="font-body text-caption text-ink/40 mt-1">{hint}</p>
    </div>
  );
}
