'use client';

import { useEffect, useMemo, useState } from 'react';
import { Food, Region, REGION_LABELS, getStandardServing } from './types';
import {
  KNOWN_CATEGORIES,
  KNOWN_SUBCATEGORIES,
  SortKey,
  fetchFoodsByIds,
  searchFoodsRanked,
  searchFoodsSuggestions,
  useDebounced,
  RankedFood,
} from './search';
import { useStaples } from '@/hooks/useStaples';
import {
  useLocalFoods,
  filterLocalFoods,
  mergeFoodResults,
} from '@/hooks/useLocalFoods';
import { useAuth } from '@/contexts/AuthContext';
import { useCustomFoods } from '@/hooks/useCustomFoods';
import AddCustomFoodModal from './AddCustomFoodModal';

interface Props {
  favorites: Set<string>;
  onPickFood: (food: Food) => void;
  recentlyLoggedFoods: Food[];
}

const PAGE_SIZE = 30;
const REGION_KEY = 'fit50-food-region';
const BRANDED_KEY = 'fit50-food-show-branded';

export default function FoodSearch({ favorites, onPickFood, recentlyLoggedFoods }: Props) {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [subcategory, setSubcategory] = useState('all');
  // Region defaults to UK & Ireland on first load. Persists to
  // localStorage so the user only picks once. "All regions" is
  // available too — same as "Worldwide" but the clearer label.
  const [region, setRegion] = useState<Region>(() => {
    if (typeof window === 'undefined') return 'uk-ie';
    const stored = window.localStorage.getItem(REGION_KEY);
    if (stored && (stored as Region) in REGION_LABELS) {
      return stored as Region;
    }
    return 'uk-ie';
  });
  // "Show branded products" — defaults off. Tier-3 (barcode OFF
  // data) is hidden unless this is on, so the default search is
  // curated-only.
  const [showBranded, setShowBranded] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(BRANDED_KEY) === '1';
  });
  const { staples, loaded: staplesLoaded } = useStaples(region);
  // Tracks which alias variants the last server query expanded to.
  // When non-empty, the UI shows "Also searched: yoghurt, yogourt"
  // under the input so the user understands why the results differ
  // from what they typed.
  const [expandedAliases, setExpandedAliases] = useState<string[]>([]);
  // "Did you mean" suggestions when the ranked query returns 0 rows.
  const [suggestions, setSuggestions] = useState<RankedFood[]>([]);

  useEffect(() => {
    try {
      window.localStorage.setItem(REGION_KEY, region);
    } catch {
      // ignore
    }
  }, [region]);

  useEffect(() => {
    try {
      window.localStorage.setItem(BRANDED_KEY, showBranded ? '1' : '0');
    } catch {
      // ignore
    }
  }, [showBranded]);
  const [sort, setSort] = useState<SortKey>('favourites');
  const [open, setOpen] = useState(true);
  const [results, setResults] = useState<RankedFood[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  // Per-user custom foods. Shared with MyCustomFoodsPanel via the
  // useCustomFoods hook — that panel can edit/delete while this one
  // just reads `foods` to merge into the search results.
  const { foods: customFoods, create: createCustomFood } = useCustomFoods();
  const [customOpen, setCustomOpen] = useState(false);

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

// Client-side re-sort: when 'favourites' is selected, pin the
// user's favourites to the top of the results, keep the rest in
// the same order the server returned them. The SQL ORDER BY falls
// back to 'name' (see search.ts), so this just partitions the
// existing results.
function applyFavouritesSort(foods: Food[], favourites: Set<string>): Food[] {
  if (favourites.size === 0) return foods;
  const favs: Food[] = [];
  const rest: Food[] = [];
  for (const f of foods) {
    (favourites.has(f.id) ? favs : rest).push(f);
  }
  return [...favs, ...rest];
}

  // Server-side search — the only path used. Memoising on the
  // debounced query + filters prevents the request firing when
  // transient keystrokes change.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setPage(0);
    setSuggestions([]);
    searchFoodsRanked({
      query: debouncedQuery,
      userId: user?.id ?? null,
      region,
      category: category === 'all' ? null : category,
      subcategory: subcategory === 'all' ? null : subcategory,
      limit: PAGE_SIZE,
      showBranded,
    })
      .then(({ foods: ranked, aliases: aliasHint }) => {
        if (cancelled) return;
        setResults(ranked);
        setExpandedAliases(aliasHint ?? []);
        // If ranked returns 0 and the user typed something, run a
        // "did you mean" pass to surface trigram-similar items.
        if (ranked.length === 0 && debouncedQuery.trim().length > 0) {
          searchFoodsSuggestions(debouncedQuery.trim(), 5).then((s) => {
            if (!cancelled) setSuggestions(s);
          });
        }
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
  }, [
    debouncedQuery,
    category,
    subcategory,
    trimmed,
    favorites,
    region,
    showBranded,
    user?.id,
  ]);

  const loadMore = async () => {
    const nextPage = page + 1;
    setLoading(true);
    try {
      const { foods: ranked } = await searchFoodsRanked({
        query: debouncedQuery,
        userId: user?.id ?? null,
        region,
        category: category === 'all' ? null : category,
        subcategory: subcategory === 'all' ? null : subcategory,
        limit: PAGE_SIZE * (nextPage + 1),
        showBranded,
      });
      setResults(ranked);
      setPage(nextPage);
    } catch (err) {
      console.error(err);
      setError('Could not load more.');
    } finally {
      setLoading(false);
    }
  };

  const hasMore = false; // RPC returns up to PAGE_SIZE; pagination not wired yet.

  // Filter the user's custom foods by the current query — match on
  // name or aliases (case-insensitive substring). Empty query shows
  // everything. Then promote them to RankedFood with a tier of 1 so
  // they sort at the top of favourites-first results, and a small
  // synthetic score so the server-side ranking considers them.
  const matchedCustom = useMemo(() => {
    const q = trimmed.toLowerCase();
    const filtered = q
      ? customFoods.filter((f) => {
          if (f.name.toLowerCase().includes(q)) return true;
          if (f.aliases?.some((a) => a.toLowerCase().includes(q))) return true;
          return false;
        })
      : customFoods;
    return filtered.slice(0, 10).map(customFoodToRanked);
  }, [customFoods, trimmed]);

  // Final results = ranked public foods + user's custom foods.
  // Dedupes by id (public foods take precedence — custom foods are
  // only added if the id isn't already in the ranked list).
  const finalResults = useMemo<RankedFood[]>(() => {
    const seen = new Set(results.map((r) => r.id));
    const extras = matchedCustom.filter((c) => !seen.has(c.id));
    if (extras.length === 0) return results;
    return [...extras, ...results];
  }, [results, matchedCustom]);

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
          {loading && finalResults.length === 0
            ? 'Searching…'
            : trimmed
              ? `${finalResults.length} result${
                  finalResults.length === 1 ? '' : 's'
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
        {user && (
          <button
            type="button"
            onClick={() => setCustomOpen(true)}
            className="mt-2 w-full px-3 py-2 border border-coral/40 text-coral font-body text-caption uppercase tracking-widest hover:bg-coral/5 transition-colors"
          >
            + Add custom food
          </button>
        )}
        {expandedAliases.length > 0 && (
          <p
            className="font-body text-caption text-ink/60 mt-2"
            aria-live="polite"
          >
            Also searched: {expandedAliases.join(', ')}
          </p>
        )}
        <div className="flex gap-2 mt-3 flex-wrap">
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value as Region)}
            aria-label="Region"
            className="px-3 py-2 bg-paper border border-ink/20 font-body text-caption uppercase tracking-widest text-ink/70 focus:border-ink outline-none"
          >
            {(Object.keys(REGION_LABELS) as Region[]).map((r) => (
              <option key={r} value={r}>
                {REGION_LABELS[r]}
              </option>
            ))}
          </select>
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
              <option value="favourites">Favourites first</option>
              <option value="name">A → Z</option>
              <option value="kcal">Calories ↑</option>
              <option value="protein">Protein ↑</option>
              <option value="carbs">Carbs ↑</option>
              <option value="fat">Fat ↑</option>
              <option value="fiber">Fiber ↑</option>
            </select>
          )}
          <button
            type="button"
            onClick={() => setShowBranded((v) => !v)}
            aria-pressed={showBranded}
            aria-label="Show branded products"
            className={`px-3 py-2 border font-body text-caption uppercase tracking-widest transition-colors ${
              showBranded
                ? 'bg-ink text-paper border-ink'
                : 'bg-paper text-ink/70 border-ink/20 hover:border-ink/40'
            }`}
          >
            Branded {showBranded ? 'on' : 'off'}
          </button>
        </div>
      </div>

      {!open ? null : (
        <>
          {/* Common foods (curated staples). Always shows at the
              top before any query so the user has instant hits.
              Filtered by the selected region via the foods_staples
              table's `regions` column. */}
          {staplesLoaded && staples.length > 0 && (
            <div className="px-6 py-4 border-b border-ink/10">
              <p className="font-body text-caption uppercase tracking-widest text-ink/50 mb-2">
                Common foods
              </p>
              <div className="flex gap-2 overflow-x-auto">
                {staples.map((s) => (
                  <button
                    key={s.id}
                    onClick={() =>
                      onPickFood({
                        id: s.id,
                        name: s.name,
                        category: s.category,
                        type: 'ingredient',
                        kcal: s.kcal,
                        protein: s.protein,
                        carbs: s.carbs,
                        fat: s.fat,
                        fiber: s.fiber,
                        servingBasis: s.servingBasis,
                        standardServingLabel: s.standardServingLabel,
                        aliases: s.aliases,
                      })
                    }
                    className="shrink-0 px-3 py-2 border border-ink/20 hover:border-coral hover:bg-coral/5 font-body text-caption uppercase tracking-widest text-ink/70 whitespace-nowrap"
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>
          )}

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
                  ? `${finalResults.length} result${
                      finalResults.length === 1 ? '' : 's'
                    } for "${trimmed}"`
                  : loading
                    ? 'Searching…'
                    : `Showing ${finalResults.length}`}
              </p>
            </div>
            {error ? (
              <p className="px-6 py-6 font-body text-caption uppercase text-coral">
                {error}
              </p>
            ) : finalResults.length > 0 ? (
              <div
                className="max-h-[420px] overflow-y-scroll"
                style={{ scrollbarWidth: 'none' }}
              >
                <style>{`
                  .food-search-scroll::-webkit-scrollbar { display: none; }
                  .food-search-scroll { scrollbar-width: none; -ms-overflow-style: none; }
                `}</style>
                <ul className="food-search-scroll">
                  {finalResults.map((f, i) => {
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
                              {f.brand && (
                                <span className="text-ink/50">
                                  {' · '}
                                  {f.brand}
                                </span>
                              )}
                              {f.isCustom && (
                                <span className="ml-2 inline-block px-1.5 py-0.5 text-[10px] uppercase tracking-widest bg-coral/15 text-coral border border-coral/40 align-middle">
                                  My food
                                </span>
                              )}
                            </span>
                            <span className="font-body text-caption uppercase tracking-widest text-ink/40 tabular-nums">
                              {std.label}
                            </span>
                          </span>
                          <span className="font-body text-caption uppercase tracking-widest text-ink/40 tabular-nums shrink-0">
                            {i === 0 && finalResults.length > 1 && f.score > 0 ? (
                              <span className="text-coral mr-2">Top match</span>
                            ) : null}
                            {stdKcal} kcal · {stdProtein}g P
                            {favorites.has(f.id) ? ' · ★' : ''}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : loading ? (
              <p className="px-6 py-6 font-body text-caption uppercase text-ink/40">
                Searching…
              </p>
            ) : finalResults.length === 0 && suggestions.length > 0 ? (
              <div className="px-6 py-5">
                <p className="font-body text-caption uppercase tracking-widest text-ink/50 mb-3">
                  Did you mean
                </p>
                <ul>
                  {suggestions.map((s) => {
                    const std = getStandardServing(s);
                    const m = std.grams / 100;
                    return (
                      <li key={s.id}>
                        <button
                          onClick={() => onPickFood(s)}
                          className="w-full px-4 py-2.5 text-left border-b border-ink/10 hover:bg-coral/5 flex items-baseline justify-between gap-3"
                        >
                          <span className="font-body text-sm text-ink truncate flex-1">
                            {s.name}
                            {s.brand && (
                              <span className="text-ink/50">{' · '}{s.brand}</span>
                            )}
                          </span>
                          <span className="font-body text-caption uppercase tracking-widest text-ink/40 tabular-nums shrink-0">
                            {Math.round(s.kcal * m)} kcal
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : (
              <p className="px-6 py-6 font-body text-caption uppercase text-ink/40">
                No foods found. Try a different search term or remove a filter.
              </p>
            )}
          </div>
        </>
      )}

      <AddCustomFoodModal
        open={customOpen}
        onClose={() => setCustomOpen(false)}
        onCreate={async (input) => {
          // The hook inserts into its own state on success and
          // returns the row. The modal projects the row to the
          // shared Food shape via onCreated; we close on resolve.
          const row = await createCustomFood(input);
          if (!row) throw new Error('Create returned no row.');
          return {
            id: row.id,
            name: row.name,
            brand: row.brand ?? null,
            category: row.category ?? 'Other',
            subcategory: row.subcategory ?? undefined,
            type: row.type ?? 'ingredient',
            kcal: Number(row.kcal ?? 0),
            protein: Number(row.protein ?? 0),
            carbs: Number(row.carbs ?? 0),
            fat: Number(row.fat ?? 0),
            fiber: Number(row.fiber ?? 0),
            servingBasis: '100g',
            standardServingGrams:
              row.standard_serving_grams != null
                ? Number(row.standard_serving_grams)
                : undefined,
            standardServingLabel: row.standard_serving_label ?? undefined,
            aliases: Array.isArray(row.aliases) ? row.aliases : [],
            isCustom: true,
            customSubmissionStatus: row.submission_status,
          };
        }}
        onCreated={() => {
          // Hook already updated state. No further action needed —
          // the search panel re-derives on the next render.
        }}
      />
    </div>
  );
}

// Promote a custom Food to RankedFood so it sits in the same list
// as the public search results. Custom foods skip tier filtering
// (always visible to the owner) and rank above public foods so the
// user's own entries are easy to find.
function customFoodToRanked(food: Food): RankedFood {
  return {
    ...food,
    brand: food.brand ?? null,
    regions: null,
    language: null,
    tier: 1,
    score: Number.MAX_SAFE_INTEGER, // pin to top of results
  };
}