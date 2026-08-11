'use client';

import { useState } from 'react';
import { Food, Meal, scaleFood } from './types';

interface Props {
  food: Food;
  onAdd: (entry: {
    food_id: string;
    name: string;
    grams: number;
    kcal: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    meal: Meal | null;
  }) => Promise<{ ok: boolean; error?: string }>;
  onClose: () => void;
}

const PRESETS: { label: string; grams: number }[] = [
  { label: '50 g', grams: 50 },
  { label: '100 g', grams: 100 },
  { label: '150 g', grams: 150 },
  { label: '200 g', grams: 200 },
];

const MEALS: { value: Meal; label: string }[] = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snack', label: 'Snack' },
];

export default function FoodDetail({ food, onAdd, onClose }: Props) {
  const [grams, setGrams] = useState(100);
  const [meal, setMeal] = useState<Meal | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scaled = scaleFood(food, grams);

  const handleAdd = async () => {
    setBusy(true);
    setError(null);
    const result = await onAdd({
      food_id: food.id,
      name: food.name,
      grams,
      kcal: scaled.kcal,
      protein: scaled.protein,
      carbs: scaled.carbs,
      fat: scaled.fat,
      fiber: scaled.fiber,
      meal,
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error || 'Could not save. Try again.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-ink/40 flex items-end md:items-center justify-center p-0 md:p-4"
      onClick={onClose}
    >
      <div
        className="bg-paper w-full md:max-w-lg border border-ink/15 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-ink/10 flex items-start justify-between gap-4">
          <div>
            <p className="font-body text-caption uppercase tracking-widest text-ink/50">
              {food.category}
              {food.preparation ? ` · ${food.preparation}` : ''}
            </p>
            <h3 className="font-display text-h2 text-ink leading-tight mt-1">
              {food.name}
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="font-body text-caption uppercase text-ink/60 hover:text-ink transition-colors px-2 py-1"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="border border-ink/10">
            <div className="px-4 py-2 border-b border-ink/10 flex items-baseline justify-between">
              <span className="font-body text-caption uppercase tracking-widest text-ink/50">
                Per 100 g
              </span>
            </div>
            <div className="grid grid-cols-4 divide-x divide-ink/10 font-display tabular-nums text-center">
              <Cell label="kcal" value={food.kcal} />
              <Cell label="protein" value={food.protein} />
              <Cell label="carbs" value={food.carbs} />
              <Cell label="fat" value={food.fat} />
            </div>
          </div>

          <div>
            <p className="font-body text-caption uppercase tracking-widest text-ink/50 mb-2">
              Portion
            </p>
            <div className="grid grid-cols-4 gap-2 mb-3">
              {PRESETS.map((p) => (
                <button
                  key={p.grams}
                  onClick={() => setGrams(p.grams)}
                  className={`px-3 py-2 border font-body text-caption uppercase tracking-widest transition-colors ${
                    grams === p.grams
                      ? 'border-coral bg-coral/10 text-coral'
                      : 'border-ink/20 text-ink/70 hover:border-ink/40'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <input
              type="number"
              min={1}
              value={grams}
              onChange={(e) => setGrams(Math.max(1, parseInt(e.target.value) || 0))}
              className="w-full px-3 py-2 bg-paper border-2 border-ink/20 font-body focus:border-ink outline-none"
              aria-label="Grams"
            />
          </div>

          <div>
            <p className="font-body text-caption uppercase tracking-widest text-ink/50 mb-2">
              Meal (optional)
            </p>
            <div className="grid grid-cols-4 gap-2">
              {MEALS.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setMeal(meal === m.value ? null : m.value)}
                  className={`px-3 py-2 border font-body text-caption uppercase tracking-widest transition-colors ${
                    meal === m.value
                      ? 'border-coral bg-coral/10 text-coral'
                      : 'border-ink/20 text-ink/70 hover:border-ink/40'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div className="border border-ink/15 p-4">
            <div className="flex items-baseline justify-between mb-3">
              <p className="font-body text-caption uppercase tracking-widest text-ink/50">
                This portion
              </p>
              <p className="font-body text-caption uppercase text-ink/40 tabular-nums">
                {grams} g
              </p>
            </div>
            <div className="grid grid-cols-4 divide-x divide-ink/10 font-display tabular-nums text-center">
              <Cell label="kcal" value={scaled.kcal} highlight />
              <Cell label="protein" value={scaled.protein} highlight />
              <Cell label="carbs" value={scaled.carbs} highlight />
              <Cell label="fat" value={scaled.fat} highlight />
            </div>
          </div>

          {error && (
            <div className="border border-coral/40 bg-coral/5 p-3">
              <p className="font-body text-caption uppercase tracking-widest text-coral mb-1">
                Could not save
              </p>
              <p className="font-body text-sm text-ink/80">{error}</p>
            </div>
          )}

          <button
            onClick={handleAdd}
            disabled={busy || grams <= 0}
            className="w-full bg-ink text-paper font-body text-sm px-6 py-4 uppercase tracking-wider hover:bg-ink/85 transition-colors disabled:opacity-50"
          >
            {busy ? 'Adding…' : `Add ${Math.round(scaled.kcal)} kcal to today`}
          </button>
        </div>
      </div>
    </div>
  );
}

function Cell({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div className={`px-2 py-3 ${highlight ? '' : ''}`}>
      <p className="font-display text-h3 leading-none tabular-nums text-ink">
        {Math.round(value)}
      </p>
      <p className="font-body text-caption uppercase tracking-widest text-ink/40 mt-1">
        {label}
      </p>
    </div>
  );
}
