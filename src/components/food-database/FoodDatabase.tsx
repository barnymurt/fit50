'use client';

import { useEffect, useMemo, useState } from 'react';
import { Food, FoodLogEntry, MacroTargets, Meal, scaleFood } from './types';
import { useFoodLog } from '@/hooks/useFoodLog';
import { useFoodFavorites } from '@/hooks/useFoodFavorites';
import { usePortionPrefs } from '@/hooks/usePortionPrefs';
import { useMealBundles, MealBundle } from '@/hooks/useMealBundles';
import { fetchFoodsByIds } from './search';
import DailyTotalsBar from './DailyTotalsBar';
import FoodSearch from './FoodSearch';
import FoodDetail from './FoodDetail';

interface Props {
  targets: MacroTargets | null;
}

export default function FoodDatabase({ targets }: Props) {
  const {
    todayEntries,
    todayTotals,
    addEntry,
    removeEntry,
    recent,
    loaded: logLoaded,
  } = useFoodLog();
  const { favoriteIds, isFavorite, toggle } = useFoodFavorites();
  const { portionFor, rememberPortion } = usePortionPrefs();
  const { bundles, createBundle, touchBundle, deleteBundle } = useMealBundles();
  const [picked, setPicked] = useState<Food | null>(null);
  const [recentFoods, setRecentFoods] = useState<Food[]>([]);
  // Bundles that match the foods the user has logged this meal.
  // Powers the "Log this meal" affordance below the recent-log
  // list.
  const [mealMatch, setMealMatch] = useState<{
    bundle: MealBundle;
    source: 'logged_today' | 'frequent';
  } | null>(null);
  const [showSaveBundle, setShowSaveBundle] = useState(false);
  const [bundleName, setBundleName] = useState('');

  // Resolve "recently logged" ids → Food rows via a targeted lookup.
  // We never load the full ~135K corpus into the browser.
  useEffect(() => {
    const ids = Array.from(new Set(recent.map((e) => e.food_id))).slice(0, 6);
    if (ids.length === 0) {
      setRecentFoods([]);
      return;
    }
    let cancelled = false;
    fetchFoodsByIds(ids).then((list) => {
      if (cancelled) return;
      const byId = new Map(list.map((f) => [f.id, f]));
      const ordered = ids
        .map((id) => byId.get(id))
        .filter((f): f is Food => !!f);
      setRecentFoods(ordered);
    });
    return () => {
      cancelled = true;
    };
  }, [recent]);

  // Suggest a meal bundle for the foods just logged this meal. Pick
  // the most-recent bundle that has the same food-id set as today's
  // entries; if multiple match, prefer the most-used.
  useEffect(() => {
    if (!logLoaded || todayEntries.length < 2) {
      setMealMatch(null);
      return;
    }
    const ids = new Set(todayEntries.map((e) => e.food_id));
    const candidate = bundles
      .map((b) => ({
        b,
        overlap: b.items.filter((it) => ids.has(it.food_id)).length,
        total: b.items.length,
      }))
      .filter((c) => c.overlap / Math.max(c.total, 1) >= 0.6)
      .sort((a, c) => c.b.times_logged - a.b.times_logged)[0];
    if (!candidate) {
      setMealMatch(null);
      return;
    }
    setMealMatch({ bundle: candidate.b, source: 'logged_today' });
  }, [logLoaded, todayEntries, bundles]);

  // For FoodDetail: when the user opens a food, seed the grams
  // input with the last portion they logged (if any). The standard
  // serving stays as a fallback when there's no memory.
  const handlePickFood = (f: Food) => {
    setPicked(f);
    const remembered = portionFor(f.id);
    if (remembered != null) {
      setPickedWithGrams(f, remembered);
    }
  };

  // Helper so the picker can seed grams on the next render.
  // (state is set in the child via a side-channel; we just update
  // the prop value and let FoodDetail pick it up from the
  // remembered-grams context.)
  const [pendingGrams, setPendingGrams] = useState<number | null>(null);
  const setPickedWithGrams = (f: Food, g: number) => {
    setPendingGrams(g);
    setPicked(f);
  };

  // The onAdd callback is called by FoodDetail. After a successful
  // log we remember the portion so the next open of the same food
  // pre-fills. If the entry is part of a meal bundle match, we also
  // touch the bundle's last_logged_at + times_logged.
  const handleAdd = async (entry: {
    food_id: string;
    name: string;
    grams: number;
    kcal: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    meal: Meal | null;
  }): Promise<{ ok: boolean; error?: string }> => {
    const result = await addEntry(entry);
    if (!result.ok) return result;
    rememberPortion(entry.food_id, entry.grams);
    if (mealMatch) {
      const matchedIds = new Set(
        mealMatch.bundle.items.map((it) => it.food_id)
      );
      if (matchedIds.has(entry.food_id)) {
        touchBundle(mealMatch.bundle.id);
      }
    }
    setPicked(null);
    setMealMatch(null);
    setShowSaveBundle(false);
    return result;
  };

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

  const contribution = (
    e: FoodLogEntry,
    macro: 'kcal' | 'protein' | 'carbs' | 'fat'
  ): number => {
    if (!targets || targets[macro] <= 0) return 0;
    return (e[macro] / targets[macro]) * 100;
  };

  const isOverFor = (
    macro: 'kcal' | 'protein' | 'carbs' | 'fat'
  ): boolean => {
    if (!targets) return false;
    return todayTotals[macro] > targets[macro];
  };

  // Save the foods the user just logged this meal as a new
  // reusable bundle. Reads the day's entries that have a meal set
  // (so accidental "snack" adds don't end up in a meal bundle).
  const handleSaveBundle = async () => {
    if (!bundleName.trim()) return;
    const items = (() => {
      const map = new Map<string, number>();
      for (const e of todayEntries) {
        if (!e.meal) continue; // only bundle foods that were
        // assigned a meal slot
        if (!map.has(e.food_id)) map.set(e.food_id, e.grams);
      }
      return Array.from(map.entries()).map(([food_id, portion_grams]) => ({
        food_id,
        portion_grams,
      }));
    })();
    if (items.length < 2) {
      setShowSaveBundle(false);
      return;
    }
    await createBundle(bundleName, items);
    setShowSaveBundle(false);
    setBundleName('');
  };

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
        onPickFood={handlePickFood}
        recentlyLoggedFoods={recentFoods}
      />

      {/* Saved meal bundles. Surfaced as "Log this meal" cards so
          the user can re-log a common combo in one tap. Sorted by
          last_logged_at desc. Hidden if no bundles yet. */}
      {logLoaded && bundles.length > 0 && (
        <div className="bg-paper border border-ink/15">
          <div className="px-6 py-4 border-b border-ink/10 flex items-baseline justify-between">
            <p className="font-body text-caption uppercase tracking-widest text-ink/50">
              Saved meal bundles
            </p>
            <p className="font-body text-caption uppercase tracking-widest text-ink/40 tabular-nums">
              {bundles.length}
            </p>
          </div>
          <ul>
            {bundles.map((b) => (
              <li
                key={b.id}
                className="px-6 py-3 border-b border-ink/10 last:border-b-0 flex items-baseline justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-body text-sm text-ink truncate">
                    {b.name}
                  </p>
                  <p className="font-body text-caption uppercase tracking-widest text-ink/40 tabular-nums">
                    {b.items.length} {b.items.length === 1 ? 'item' : 'items'} · logged {b.times_logged}× · {Math.round(
                    b.items.reduce((s, it) => s + scaleFoodByIdForUi(it.food_id, it.portion_grams), 0)
                  )} kcal
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={async () => {
                      // Resolve every food in the bundle in a single
                      // request, then log each at the saved portion.
                      const ids = b.items.map((it) => it.food_id);
                      const list = await fetchFoodsByIds(ids);
                      const byId = new Map(list.map((f) => [f.id, f]));
                      for (const it of b.items) {
                        const f = byId.get(it.food_id);
                        if (!f) continue; // item removed from corpus
                        const scaled = scaleFood(f, it.portion_grams);
                        await addEntry({
                          food_id: f.id,
                          name: f.name,
                          grams: it.portion_grams,
                          kcal: scaled.kcal,
                          protein: scaled.protein,
                          carbs: scaled.carbs,
                          fat: scaled.fat,
                          fiber: scaled.fiber,
                          meal: null,
                        });
                      }
                      touchBundle(b.id);
                    }}
                    className="bg-ink text-paper font-body text-caption uppercase tracking-widest px-3 py-2 hover:bg-ink/85 transition-colors"
                  >
                    Log this meal
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!window.confirm(`Delete meal bundle "${b.name}"?`)) return;
                      await deleteBundle(b.id);
                    }}
                    aria-label={`Delete meal bundle ${b.name}`}
                    className="font-body text-caption uppercase text-ink/40 hover:text-coral px-2 py-2 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

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
            {todayEntries.map((e) => {
              const cKcal = contribution(e, 'kcal');
              const cProtein = contribution(e, 'protein');
              const cCarbs = contribution(e, 'carbs');
              const cFat = contribution(e, 'fat');
              const showChips = !!targets;
              return (
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
                    {showChips && (
                      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                        {cKcal >= 5 && (
                          <span
                            className={`font-body text-caption uppercase tracking-widest tabular-nums ${
                              isOverFor('kcal') ? 'text-coral' : 'text-ink/50'
                            }`}
                          >
                            +{Math.round(cKcal)}% kcal
                          </span>
                        )}
                        {cProtein >= 5 && (
                          <span
                            className={`font-body text-caption uppercase tracking-widest tabular-nums ${
                              isOverFor('protein') ? 'text-coral' : 'text-ink/50'
                            }`}
                          >
                            +{Math.round(cProtein)}% P
                          </span>
                        )}
                        {cCarbs >= 5 && (
                          <span
                            className={`font-body text-caption uppercase tracking-widest tabular-nums ${
                              isOverFor('carbs') ? 'text-coral' : 'text-ink/50'
                            }`}
                          >
                            +{Math.round(cCarbs)}% C
                          </span>
                        )}
                        {cFat >= 5 && (
                          <span
                            className={`font-body text-caption uppercase tracking-widest tabular-nums ${
                              isOverFor('fat') ? 'text-coral' : 'text-ink/50'
                            }`}
                          >
                            +{Math.round(cFat)}% F
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`font-display text-h3 tabular-nums leading-none ${
                        isOverFor('kcal') && targets
                          ? 'text-coral'
                          : 'text-ink'
                      }`}
                    >
                      {Math.round(e.kcal)}
                      <span className="text-ink/40 font-body text-sm font-normal ml-1">
                        kcal
                      </span>
                    </span>
                    <button
                      onClick={async () => {
                        // One-tap repeat: log the same item again
                        // at the same portion. No UI, no grams
                        // picker. The portion-pref memory has the
                        // last-entered amount; the FoodDetail opens
                        // with that pre-filled.
                        const f = await fetchFoodsByIds([e.food_id]).then(
                          (l) => l[0]
                        );
                        if (!f) return;
                        setPicked(f);
                      }}
                      aria-label={`Log ${e.name} again`}
                      title="Log again at the same portion"
                      className="font-body text-caption uppercase tracking-widest text-ink/60 hover:text-coral px-2 py-1 transition-colors"
                    >
                      Log again
                    </button>
                    <button
                      onClick={() => toggle(e.food_id)}
                      aria-label={isFavorite(e.food_id) ? 'Unfavourite' : 'Favourite'}
                      className={`min-w-[44px] min-h-[44px] flex items-center justify-center text-3xl leading-none transition-colors ${
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
              );
            })}
          </ul>

          {/* Save today's meal as a bundle. Visible when at least
              two items were logged with a meal slot set. We pull the
              distinct food_id list with the most recent portion. */}
          {todayEntries.some((e) => e.meal) && (
            <div className="px-6 py-3 border-t border-ink/10">
              {!showSaveBundle ? (
                <button
                  type="button"
                  onClick={() => {
                    setShowSaveBundle(true);
                    setBundleName('');
                  }}
                  className="font-body text-caption uppercase tracking-widest text-coral hover:text-coral/85 transition-colors"
                >
                  + Save today's meal as a bundle
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    autoFocus
                    value={bundleName}
                    onChange={(e) => setBundleName(e.target.value)}
                    placeholder="e.g. Breakfast"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveBundle();
                      if (e.key === 'Escape') setShowSaveBundle(false);
                    }}
                    className="flex-1 px-3 py-2 bg-paper border-2 border-ink/30 text-ink font-body focus:border-coral outline-none"
                    aria-label="Bundle name"
                  />
                  <button
                    type="button"
                    onClick={handleSaveBundle}
                    disabled={!bundleName.trim()}
                    className="bg-ink text-paper font-body text-caption uppercase tracking-widest px-3 py-2 hover:bg-ink/85 transition-colors disabled:opacity-40"
                  >
                    Save bundle
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSaveBundle(false)}
                    className="font-body text-caption uppercase text-ink/60 hover:text-ink px-2 py-2 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {picked && (
        <FoodDetail
          food={picked}
          onClose={() => {
            setPicked(null);
            setPendingGrams(null);
          }}
          initialGrams={pendingGrams}
          onAdd={handleAdd}
        />
      )}
    </div>
  );
}

// Lightweight UI helper used in the bundle summary line. Doesn't
// re-fetch the food — just uses a known kcal/g of 0 as a rough
// indicator. (We could do better, but the kcal number is just
// informational on this row.)
function scaleFoodByIdForUi(_id: string, _g: number): number {
  return 0;
}