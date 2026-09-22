'use client';

import { useEffect, useState } from 'react';
import { useFoodFavorites } from '@/hooks/useFoodFavorites';
import { Food } from './types';
import { fetchFoodsByIds } from './search';

interface Props {
  onPickFood?: (food: Food) => void;
}

export default function FavoritesPanel({ onPickFood }: Props) {
  const { favoriteIds, loaded: favsLoaded } = useFoodFavorites();
  const [foods, setFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!favsLoaded || favoriteIds.size === 0) {
      setFoods([]);
      return;
    }
    setLoading(true);
    fetchFoodsByIds([...favoriteIds])
      .then(setFoods)
      .finally(() => setLoading(false));
  }, [favsLoaded, favoriteIds]);

  if (favsLoaded && favoriteIds.size === 0) {
    return (
      <div className="bg-paper border border-ink/15 px-6 py-10 text-center">
        <p className="font-body text-base text-ink/70">
          No favourites yet.
        </p>
        <p className="font-body text-sm text-ink/40 mt-2">
          Hit the heart icon on any food to save it here for quick access.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-paper border border-ink/15">
      <div className="px-6 py-4 border-b border-ink/10 flex items-baseline justify-between gap-3 flex-wrap">
        <div>
          <p className="font-body text-caption uppercase tracking-widest text-ink/50">
            Favourites
          </p>
          <p className="font-body text-sm text-ink/60 mt-1">
            Foods you have saved for quick access.
          </p>
        </div>
        <span className="font-body text-caption uppercase tracking-widest text-ink/40 tabular-nums">
          {favoriteIds.size} {favoriteIds.size === 1 ? 'item' : 'items'}
        </span>
      </div>

      {loading && (
        <p className="px-6 py-4 font-body text-caption text-ink/50">Loading…</p>
      )}

      {!loading && foods.length === 0 && favsLoaded && favoriteIds.size > 0 && (
        <p className="px-6 py-4 font-body text-caption text-ink/50">
          Could not load foods.
        </p>
      )}

      {foods.length > 0 && (
        <ul>
          {foods.map((food) => (
            <li
              key={food.id}
              className="px-6 py-4 border-b border-ink/10 last:border-b-0 flex items-start gap-4 flex-wrap"
            >
              <div className="min-w-0 flex-1">
                <p className="font-display text-h3 text-ink leading-tight">
                  {food.name}
                </p>
                <p className="font-body text-caption uppercase tracking-widest text-ink/40 tabular-nums mt-1">
                  {food.brand ? `${food.brand} · ·` : ''}
                  {Math.round(food.kcal)} kcal ·
                  {' '}{Number(food.protein).toFixed(1)}g P ·
                  {' '}{Number(food.carbs).toFixed(1)}g C ·
                  {' '}{Number(food.fat).toFixed(1)}g F
                  {' '}· per {food.standardServingLabel ?? '100g'}
                </p>
              </div>
              {onPickFood && (
                <button
                  type="button"
                  onClick={() => onPickFood(food)}
                  className="px-3 py-2 border border-ink/20 font-body text-caption uppercase tracking-widest text-ink/70 hover:border-ink hover:text-ink transition-colors shrink-0"
                >
                  Log
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
