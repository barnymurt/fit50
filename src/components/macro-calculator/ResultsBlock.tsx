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

      <p className="font-display text-xl text-ink leading-snug mt-8 max-w-md">
        {COPY.callout}
      </p>
    </div>
  );
}
