'use client';

import { useMemo, useState } from 'react';
import { Food, FoodLogEntry, MacroTargets } from './types';
import { useFoodLog } from '@/hooks/useFoodLog';
import { useFoodFavorites } from '@/hooks/useFoodFavorites';
import { useFoodData } from './search';
import DailyTotalsBar from './DailyTotalsBar';
import FoodSearch from './FoodSearch';
import FoodDetail from './FoodDetail';

interface Props {
  targets: MacroTargets | null;
}

export default function FoodDatabase({ targets }: Props) {
  const { foods, loaded: dataLoaded } = useFoodData();
  const { todayEntries, todayTotals, addEntry, removeEntry, recent, loaded: logLoaded } =
    useFoodLog();
  const { favoriteIds, isFavorite, toggle } = useFoodFavorites();
  const [picked, setPicked] = useState<Food | null>(null);

  const recentFoods: Food[] = useMemo(() => {
    if (!dataLoaded) return [];
    const byId = new Map(foods.map((f) => [f.id, f]));
    return recent
      .map((e) => byId.get(e.food_id))
      .filter((f): f is Food => !!f)
      .slice(0, 6);
  }, [recent, foods, dataLoaded]);

  const isOverBudget =
    !!targets &&
    (todayTotals.kcal > targets.kcal ||
      todayTotals.protein > targets.protein ||
      todayTotals.carbs > targets.carbs ||
      todayTotals.fat > targets.fat);

  const topContributors: Array<{
    entry: FoodLogEntry;
    overKcal: number;
  }> = useMemo(() => {
    if (!targets) return [];
    const sorted = [...todayEntries]
      .sort((a, b) => b.kcal - a.kcal)
      .slice(0, 3);
    return sorted.map((e) => ({ entry: e, overKcal: e.kcal }));
  }, [todayEntries, targets]);

  return (
    <div className="space-y-6">
      <DailyTotalsBar totals={todayTotals} targets={targets} />

      {!targets && (
        <div className="border border-ink/15 bg-cream/30 p-4">
          <p className="font-body text-caption uppercase tracking-widest text-ink/60 mb-1">
            No targets yet
          </p>
          <p className="font-body text-sm text-ink/70">
            Run the macro calculator above to set your daily targets. They drive the totals bar.
          </p>
        </div>
      )}

      {isOverBudget && topContributors.length > 0 && (
        <div className="border border-coral/40 bg-coral/5 p-4">
          <p className="font-body text-caption uppercase tracking-widest text-coral mb-2">
            Over budget · top contributors
          </p>
          <ul className="space-y-1">
            {topContributors.map(({ entry }) => (
              <li
                key={entry.id}
                className="flex items-baseline justify-between gap-3"
              >
                <span className="font-body text-sm text-ink truncate">
                  {entry.name}
                </span>
                <span className="font-body text-caption uppercase tracking-widest text-coral tabular-nums shrink-0">
                  {Math.round(entry.kcal)} kcal
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <FoodSearch
        favorites={favoriteIds}
        onPickFood={(f) => setPicked(f)}
        recentlyLoggedFoods={recentFoods}
      />

      {logLoaded && todayEntries.length > 0 && (
        <div className="bg-paper border border-ink/15">
          <div className="px-6 py-4 border-b border-ink/10 flex items-baseline justify-between">
            <p className="font-body text-caption uppercase tracking-widest text-ink/50">
              Logged today
            </p>
            <p className="font-body text-caption uppercase tracking-widest text-ink/40 tabular-nums">
              {todayEntries.length} {todayEntries.length === 1 ? 'item' : 'items'}
            </p>
          </div>
          <ul>
            {todayEntries.map((e) => (
              <li
                key={e.id}
                className="px-6 py-3 border-b border-ink/10 last:border-b-0 flex items-baseline justify-between gap-4"
              >
                <div className="min-w-0">
                  <p className="font-body text-sm text-ink truncate">
                    {e.name}
                  </p>
                  <p className="font-body text-caption uppercase tracking-widest text-ink/40 tabular-nums">
                    {Math.round(e.grams)} g
                    {e.meal ? ` · ${e.meal}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-display text-h3 tabular-nums text-ink leading-none">
                    {Math.round(e.kcal)}
                    <span className="text-ink/40 font-body text-sm font-normal ml-1">
                      kcal
                    </span>
                  </span>
                  <button
                    onClick={() => toggle(e.food_id)}
                    aria-label={isFavorite(e.food_id) ? 'Unfavourite' : 'Favourite'}
                    className={`text-2xl leading-none px-2 py-1 transition-colors ${
                      isFavorite(e.food_id)
                        ? 'text-coral'
                        : 'text-ink/30 hover:text-coral'
                    }`}
                  >
                    {isFavorite(e.food_id) ? '★' : '☆'}
                  </button>
                  <button
                    onClick={() => removeEntry(e.id)}
                    aria-label="Remove"
                    className="font-body text-caption uppercase text-ink/40 hover:text-coral px-2 py-1 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {picked && (
        <FoodDetail
          food={picked}
          onClose={() => setPicked(null)}
          onAdd={async (entry) => {
            const result = await addEntry(entry);
            if (result.ok) setPicked(null);
            return result;
          }}
        />
      )}
    </div>
  );
}
