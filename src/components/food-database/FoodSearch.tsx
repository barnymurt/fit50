'use client';

import { useEffect, useMemo, useState } from 'react';
import { Food, getStandardServing } from './types';
import {
  KNOWN_CATEGORIES,
  KNOWN_SUBCATEGORIES,
  SortKey,
  fetchFoodsByIds,
  searchFoodsRemote,
  useDebounced,
} from './search';

interface Props {
  favorites: Set<string>;
  onPickFood: (food: Food) => void;
  recentlyLoggedFoods: Food[];
}

const PAGE_SIZE = 50;

export default function FoodSearch({ favorites, onPickFood, recentlyLoggedFoods }: Props) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [subcategory, setSubcategory] = useState('all');
  const [sort, setSort] = useState<SortKey>('name');
  const [open, setOpen] = useState(true);
  const [results, setResults] = useState<Food[]>([]);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  // Reset subcategory when the category changes — a category may
  // not have subcategories at all, or the subcategory list might
  // not match.
  useEffect(() => {
    setSubcategory('all');
  }, [category]);

  // Subcategory options for the currently selected category (or empty).
  const subcategoryOptions = KNOWN_SUBCATEGORIES[category] ?? [];

  // Debounce the query so we don't fire one Supabase call per keystroke.
  const debouncedQuery = useDebounced(query, 250);
  const trimmed = debouncedQuery.trim();

  // Server-side search — the only path used. Memoising on the
  // debounced query + filters prevents the request firing when
  // transient keystrokes change.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setPage(0);
    searchFoodsRemote({
      query: debouncedQuery,
      category,
      subcategory,
      sort: trimmed ? 'relevance' : sort,
      limit: PAGE_SIZE,
      offset: 0,
    })
      .then(({ foods, count }) => {
        if (cancelled) return;
        setResults(foods);
        setTotalCount(count);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error(err);
        setError('Search failed. Try again.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, category, subcategory, sort, trimmed]);

  const loadMore = async () => {
    const nextPage = page + 1;
    setLoading(true);
    try {
      const { foods } = await searchFoodsRemote({
        query: debouncedQuery,
        category,
        subcategory,
        sort: trimmed ? 'relevance' : sort,
        limit: PAGE_SIZE,
        offset: nextPage * PAGE_SIZE,
      });
      setResults((prev) => [...prev, ...foods]);
      setPage(nextPage);
    } catch (err) {
      console.error(err);
      setError('Could not load more.');
    } finally {
      setLoading(false);
    }
  };

  const hasMore =
    totalCount === null ? results.length === PAGE_SIZE : results.length < totalCount;

  return (
    <div className="bg-paper border border-ink/15">
      {/* Accordion header */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="food-search-panel"
        className="w-full px-6 py-4 flex items-center justify-between gap-3 hover:bg-cream/30 transition-colors text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span
            aria-hidden="true"
            className={`font-body text-ink/40 transition-transform duration-200 ${
              open ? 'rotate-90' : ''
            }`}
          >
            ›
          </span>
          <p className="font-body text-caption uppercase tracking-widest text-ink/50 truncate">
            Search
          </p>
        </div>
        <span className="font-body text-caption uppercase tracking-widest text-ink/40 tabular-nums shrink-0">
          {loading && results.length === 0
            ? 'Searching…'
            : trimmed
              ? `${totalCount ?? results.length} result${
                  (totalCount ?? results.length) === 1 ? '' : 's'
                }`
              : 'Browse the database'}
        </span>
      </button>

      <div
        id="food-search-panel"
        role="region"
        aria-label="Food search filters"
        className="px-6 py-4 border-b border-ink/10"
      >
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="chicken, rice, banana…"
          aria-label="Search foods"
          className="w-full px-3 py-3 bg-paper border-2 border-ink/20 font-body focus:border-ink outline-none"
        />
        <div className="flex gap-2 mt-3 flex-wrap">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            aria-label="Category"
            className="px-3 py-2 bg-paper border border-ink/20 font-body text-caption uppercase tracking-widest text-ink/70 focus:border-ink outline-none"
          >
            <option value="all">All categories</option>
            {KNOWN_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          {subcategoryOptions.length > 0 && (
            <select
              value={subcategory}
              onChange={(e) => setSubcategory(e.target.value)}
              aria-label="Subcategory"
              className="px-3 py-2 bg-paper border border-ink/20 font-body text-caption uppercase tracking-widest text-ink/70 focus:border-ink outline-none"
            >
              <option value="all">All subcategories</option>
              {subcategoryOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          )}
          {!trimmed && (
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              aria-label="Sort"
              className="px-3 py-2 bg-paper border border-ink/20 font-body text-caption uppercase tracking-widest text-ink/70 focus:border-ink outline-none"
            >
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

      {!open ? null : (
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
                {trimmed
                  ? `${totalCount ?? results.length} result${
                      (totalCount ?? results.length) === 1 ? '' : 's'
                    } for "${trimmed}"`
                  : loading
                    ? 'Searching…'
                    : `Showing ${results.length}${totalCount ? ` of ${totalCount}` : ''}`}
              </p>
            </div>
            {error ? (
              <p className="px-6 py-6 font-body text-caption uppercase text-coral">
                {error}
              </p>
            ) : results.length > 0 ? (
              <div
                className="max-h-[420px] overflow-y-scroll"
                style={{ scrollbarWidth: 'none' }}
              >
                <style>{`
                  .food-search-scroll::-webkit-scrollbar { display: none; }
                  .food-search-scroll { scrollbar-width: none; -ms-overflow-style: none; }
                `}</style>
                <ul className="food-search-scroll">
                  {results.map((f) => {
                    const std = getStandardServing(f);
                    const m = std.grams / 100;
                    const stdKcal = Math.round(f.kcal * m);
                    const stdProtein = Math.round(f.protein * m);
                    return (
                      <li key={f.id}>
                        <button
                          onClick={() => onPickFood(f)}
                          className="w-full px-6 py-3 border-b border-ink/10 hover:bg-coral/5 text-left flex items-baseline justify-between gap-3"
                        >
                          <span className="min-w-0 flex-1">
                            <span className="font-body text-sm text-ink truncate block">
                              {f.name}
                            </span>
                            <span className="font-body text-caption uppercase tracking-widest text-ink/40 tabular-nums">
                              {std.label}
                            </span>
                          </span>
                          <span className="font-body text-caption uppercase tracking-widest text-ink/40 tabular-nums shrink-0">
                            {stdKcal} kcal · {stdProtein}g P
                            {favorites.has(f.id) ? ' · ★' : ''}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
                {hasMore && (
                  <div className="px-6 py-3 border-b border-ink/10">
                    <button
                      type="button"
                      onClick={loadMore}
                      disabled={loading}
                      className="font-body text-caption uppercase tracking-widest text-coral hover:text-coral/85 transition-colors disabled:opacity-50"
                    >
                      {loading ? 'Loading…' : 'Load more'}
                    </button>
                  </div>
                )}
              </div>
            ) : loading ? (
              <p className="px-6 py-6 font-body text-caption uppercase text-ink/40">
                Searching…
              </p>
            ) : (
              <p className="px-6 py-6 font-body text-caption uppercase text-ink/40">
                No foods found. Try a different search term or remove a filter.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}