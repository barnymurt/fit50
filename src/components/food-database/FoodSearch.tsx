'use client';

import { useMemo, useState } from 'react';
import { Food } from './types';
import { useFoodData, searchFoods, getCategories, SortKey } from './search';

interface Props {
  favorites: Set<string>;
  onPickFood: (food: Food) => void;
  recentlyLoggedFoods: Food[];
}

export default function FoodSearch({ favorites, onPickFood, recentlyLoggedFoods }: Props) {
  const { foods, loaded } = useFoodData();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState<SortKey>('relevance');
  const [resultsOpen, setResultsOpen] = useState(true);

  const categories = useMemo(() => getCategories(foods), [foods]);

  const results = useMemo(() => {
    if (!loaded) return [] as Food[];
    return searchFoods(foods, {
      query,
      category,
      favorites,
      sort: query ? 'relevance' : sort,
    }).slice(0, 50);
  }, [foods, loaded, query, category, sort, favorites]);

  return (
    <div className="bg-paper border border-ink/15">
      <button
        type="button"
        onClick={() => setResultsOpen((v) => !v)}
        aria-expanded={resultsOpen}
        className="w-full px-6 py-4 border-b border-ink/10 flex items-baseline justify-between gap-3 hover:bg-cream/30 transition-colors"
      >
        <p className="font-body text-caption uppercase tracking-widest text-ink/50 text-left">
          Search
        </p>
        <span className="font-body text-caption uppercase tracking-widest text-ink/40 tabular-nums shrink-0">
          {resultsOpen ? '− Collapse' : '+ Expand'} ·{' '}
          {query
            ? `${results.length} results`
            : `${foods.length} foods`}
        </span>
      </button>

      <div className="px-6 py-4 border-b border-ink/10">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={loaded ? 'chicken, rice, banana…' : 'Loading database…'}
          disabled={!loaded}
          aria-label="Search foods"
          className="w-full px-3 py-3 bg-paper border-2 border-ink/20 font-body text-base focus:border-ink outline-none disabled:opacity-50"
        />
        <div className="flex gap-2 mt-3 flex-wrap">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            aria-label="Category"
            className="px-3 py-2 bg-paper border border-ink/20 font-body text-caption uppercase tracking-widest text-ink/70 focus:border-ink outline-none"
          >
            <option value="all">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          {!query && (
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              aria-label="Sort"
              className="px-3 py-2 bg-paper border border-ink/20 font-body text-caption uppercase tracking-widest text-ink/70 focus:border-ink outline-none"
            >
              <option value="relevance">Favourites first</option>
              <option value="name">A → Z</option>
              <option value="kcal">Calories ↑</option>
              <option value="protein">Protein ↑</option>
              <option value="carbs">Carbs ↑</option>
              <option value="fat">Fat ↑</option>
              <option value="fiber">Fiber ↑</option>
            </select>
          )}
        </div>
      </div>

      {!resultsOpen ? null : (
        <>
          {recentlyLoggedFoods.length > 0 && query === '' && (
            <div className="px-6 py-4 border-b border-ink/10">
              <p className="font-body text-caption uppercase tracking-widest text-ink/50 mb-2">
                Recently logged
              </p>
              <div className="flex gap-2 overflow-x-auto">
                {recentlyLoggedFoods.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => onPickFood(f)}
                    className="shrink-0 px-3 py-2 border border-ink/20 hover:border-coral hover:bg-coral/5 font-body text-caption uppercase tracking-widest text-ink/70 whitespace-nowrap"
                  >
                    {f.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="px-6 py-2 border-b border-ink/10 flex items-baseline justify-between">
              <p className="font-body text-caption uppercase tracking-widest text-ink/40">
                {query
                  ? `${results.length} results for "${query}"`
                  : `${foods.length} foods`}
              </p>
            </div>
            <ul>
              {!loaded ? (
                <li className="px-6 py-6 font-body text-caption uppercase text-ink/40">
                  Loading database…
                </li>
              ) : results.length === 0 ? (
                <li className="px-6 py-6 font-body text-caption uppercase text-ink/40">
                  No foods found. Try a different search term or remove a filter.
                </li>
              ) : (
                results.map((f) => (
                  <li key={f.id}>
                    <button
                      onClick={() => onPickFood(f)}
                      className="w-full px-6 py-3 border-b border-ink/10 hover:bg-coral/5 text-left flex items-baseline justify-between gap-4"
                    >
                      <span className="font-body text-sm text-ink">{f.name}</span>
                      <span className="font-body text-caption uppercase tracking-widest text-ink/40 tabular-nums shrink-0">
                        {Math.round(f.kcal)} kcal · {Math.round(f.protein)}g P
                        {favorites.has(f.id) ? ' · ★' : ''}
                      </span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
