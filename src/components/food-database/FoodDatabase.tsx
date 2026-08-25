'use client';

import { useEffect, useMemo, useState } from 'react';
import { Food, FoodLogEntry, MacroTargets, Meal, scaleFood } from './types';
import { useFoodLog } from '@/hooks/useFoodLog';
import { useFoodFavorites } from '@/hooks/useFoodFavorites';
import { usePortionPrefs } from '@/hooks/usePortionPrefs';
import { useMealBundles, MealBundle, MealBundleItem } from '@/hooks/useMealBundles';
import { fetchFoodsByIds } from './search';
import DailyTotalsBar from './DailyTotalsBar';
import FoodSearch from './FoodSearch';
import FoodDetail from './FoodDetail';

interface Props {
  targets: MacroTargets | null;
}

const MEAL_OPTIONS: { value: Meal; label: string }[] = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snack', label: 'Snack' },
];

export default function FoodDatabase({ targets }: Props) {
  const {
    todayEntries,
    todayTotals,
    addEntry,
    removeEntry,
    updateEntry,
    recent,
    loaded: logLoaded,
  } = useFoodLog();
  const { favoriteIds, isFavorite, toggle } = useFoodFavorites();
  const { portionFor, rememberPortion } = usePortionPrefs();
  const {
    bundles,
    createBundle,
    updateBundle,
    touchBundle,
    deleteBundle,
  } = useMealBundles();
  const [picked, setPicked] = useState<Food | null>(null);
  const [pendingGrams, setPendingGrams] = useState<number | null>(null);
  const [recentFoods, setRecentFoods] = useState<Food[]>([]);

  // "Build a meal" mode. When the user clicks the CTA we reveal
  // checkboxes next to every log-today row. They pick which items
  // go into the bundle, then name + save. The selected-set lives
  // here so the UI can show a live count + a Save button.
  const [buildMode, setBuildMode] = useState(false);
  const [pickedIds, setPickedIds] = useState<Set<string>>(new Set());
  const [buildName, setBuildName] = useState('');
  const [buildSaving, setBuildSaving] = useState(false);
  const [buildError, setBuildError] = useState<string | null>(null);

  // Bundle editor. Lets the user rename + re-pick items on an
  // existing bundle. Opened by "Edit" or "Duplicate" on a row.
  const [editing, setEditing] = useState<{
    id: string;
    name: string;
    isDuplicate: boolean;
    originalName: string;
  } | null>(null);
  const [editItems, setEditItems] = useState<{ food_id: string; portion_grams: number }[]>([]);
  const [editName, setEditName] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Bundle search. Free-text filter over bundle names + items.
  // Cheap on a list that's small (dozens of bundles per user).
  const [bundleQuery, setBundleQuery] = useState('');
  const visibleBundles = useMemo(() => {
    if (!bundleQuery.trim()) return bundles;
    const q = bundleQuery.toLowerCase();
    return bundles.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.items.some((it) => it.food_id.toLowerCase().includes(q))
    );
  }, [bundles, bundleQuery]);

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

  // Suggest a meal bundle for the foods just logged this meal.
  // Picks the most-recent bundle that has the same food-id set as
  // today's entries; if multiple match, prefer the most-used.
  const [mealMatch, setMealMatch] = useState<{
    bundle: MealBundle;
    source: 'logged_today' | 'frequent';
  } | null>(null);
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

  // Open the picker with the last-portion memory pre-filled.
  const handlePickFood = (f: Food) => {
    setPicked(f);
    const remembered = portionFor(f.id);
    if (remembered != null) setPendingGrams(remembered);
  };

  // Build-meal helpers.
  const togglePick = (id: string) => {
    setPickedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const clearBuild = () => {
    setBuildMode(false);
    setPickedIds(new Set());
    setBuildName('');
    setBuildError(null);
  };
  const handleSaveBundle = async () => {
    if (buildSaving) return;
    if (!buildName.trim()) {
      setBuildError('Give the meal a name.');
      return;
    }
    const items = todayEntries
      .filter((e) => pickedIds.has(e.id))
      .filter((e) => e.meal) // must be assigned a meal slot
      .map((e) => ({ food_id: e.food_id, portion_grams: e.grams }));
    if (items.length < 2) {
      setBuildError(
        'Pick at least two items, each with a meal slot (breakfast / lunch / dinner / snack).'
      );
      return;
    }
    setBuildSaving(true);
    setBuildError(null);
    const id = await createBundle(buildName, items);
    setBuildSaving(false);
    if (!id) {
      setBuildError('Could not save the bundle. Try again.');
      return;
    }
    clearBuild();
  };

  // Bundle editor helpers.
  const startEditing = (b: MealBundle) => {
    setEditing({
      id: b.id,
      name: b.name,
      isDuplicate: false,
      originalName: b.name,
    });
    setEditName(b.name);
    setEditItems(
      b.items.map((it) => ({ food_id: it.food_id, portion_grams: it.portion_grams }))
    );
    setEditError(null);
  };
  const startDuplicating = (b: MealBundle) => {
    setEditing({
      id: b.id,
      name: `Copy of ${b.name}`,
      isDuplicate: true,
      originalName: b.name,
    });
    setEditName(`Copy of ${b.name}`);
    setEditItems(
      b.items.map((it) => ({ food_id: it.food_id, portion_grams: it.portion_grams }))
    );
    setEditError(null);
  };
  const cancelEdit = () => {
    setEditing(null);
    setEditItems([]);
    setEditName('');
    setEditError(null);
  };
  const toggleEditItem = (food_id: string) => {
    setEditItems((prev) => {
      if (prev.find((it) => it.food_id === food_id)) {
        return prev.filter((it) => it.food_id !== food_id);
      }
      return [...prev, { food_id, portion_grams: 100 }];
    });
  };
  const setEditPortion = (food_id: string, portion_grams: number) => {
    setEditItems((prev) =>
      prev.map((it) => (it.food_id === food_id ? { ...it, portion_grams } : it))
    );
  };
  const removeEditItem = (food_id: string) => {
    setEditItems((prev) => prev.filter((it) => it.food_id !== food_id));
  };
  const saveEdit = async () => {
    if (editSaving) return;
    if (!editing) return;
    if (!editName.trim()) {
      setEditError('Give the meal a name.');
      return;
    }
    if (editItems.length === 0) {
      setEditError('Pick at least one item.');
      return;
    }
    setEditSaving(true);
    setEditError(null);
    if (editing.isDuplicate) {
      // Duplicate: create a fresh bundle under the new name.
      const newId = await createBundle(editName, editItems);
      setEditSaving(false);
      if (!newId) {
        setEditError('Could not save the new bundle. Try again.');
        return;
      }
      cancelEdit();
      return;
    }
    // Edit: update in place.
    const res = await updateBundle(editing.id, editName, editItems);
    setEditSaving(false);
    if (!res.ok) {
      setEditError(res.error || 'Could not save. Try again.');
      return;
    }
    cancelEdit();
  };

  // Compute the kcal summary for the bundle list. Resolves the
  // food rows for each bundle's items on demand, caches the result
  // per (bundle_id, day) for the session so the list doesn't
  // refetch on every render.
  const [bundleKcal, setBundleKcal] = useState<Record<string, number | null>>({});
  useEffect(() => {
    if (visibleBundles.length === 0) return;
    let cancelled = false;
    const updates: Record<string, number | null> = {};
    const needFetch: string[] = [];
    for (const b of visibleBundles) {
      if (b.id in bundleKcal) continue;
      needFetch.push(b.id);
    }
    if (needFetch.length === 0) return;
    (async () => {
      const allFoodIds = new Set<string>();
      const bundleFoods = new Map<string, string[]>();
      for (const b of visibleBundles) {
        if (!needFetch.includes(b.id)) continue;
        const ids = b.items.map((it) => it.food_id);
        bundleFoods.set(b.id, ids);
        for (const id of ids) allFoodIds.add(id);
      }
      const list = await fetchFoodsByIds(Array.from(allFoodIds));
      if (cancelled) return;
      const byId = new Map(list.map((f) => [f.id, f] as const));
      for (const b of visibleBundles) {
        if (!needFetch.includes(b.id)) continue;
        const ids = bundleFoods.get(b.id) ?? [];
        let total = 0;
        let known = true;
        for (const id of ids) {
          const f = byId.get(id);
          if (!f) {
            known = false;
            break;
          }
          total += scaleFood(f, 100).kcal * (b.items.find((it) => it.food_id === id)!.portion_grams / 100);
        }
        updates[b.id] = known ? Math.round(total) : null;
      }
      if (cancelled) return;
      setBundleKcal((prev) => ({ ...prev, ...updates }));
    })();
    return () => {
      cancelled = true;
    };
  }, [visibleBundles, bundleKcal]);

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

  // On-add path: remember portion + bump bundle times_logged if it
  // matches a tracked bundle. Close the modal on success.
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
      const matchedIds = new Set(mealMatch.bundle.items.map((it) => it.food_id));
      if (matchedIds.has(entry.food_id)) {
        touchBundle(mealMatch.bundle.id);
      }
    }
    setPicked(null);
    setMealMatch(null);
    return result;
  };

  // All logged-today food_ids the user has any data for — used for
  // the bundle editor's "add item" picker. We don't fetch all ~135K
  // rows; the picker takes a free-text query against the search API.
  const bundleEditorFoodIds = useMemo(
    () => Array.from(new Set(visibleBundles.flatMap((b) => b.items.map((it) => it.food_id)))),
    [visibleBundles]
  );

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
                className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1"
              >
                <span className="font-body text-sm text-ink min-w-0 break-words">
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

      {/* Saved meal bundles. Each row is one tap to re-log the
          whole combo at the saved portions. */}
      {logLoaded && bundles.length > 0 && (
        <div className="bg-paper border border-ink/15">
          <div className="px-6 py-4 border-b border-ink/10 flex flex-wrap items-baseline justify-between gap-3">
            <div>
              <p className="font-body text-caption uppercase tracking-widest text-ink/50">
                Saved meal bundles
              </p>
              <p className="font-body text-caption text-ink/40 mt-1">
                One tap to log a combo. Edit / duplicate to adjust.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                value={bundleQuery}
                onChange={(e) => setBundleQuery(e.target.value)}
                placeholder="Filter by name or food…"
                aria-label="Filter meal bundles"
                className="px-3 py-2 bg-paper border-2 border-ink/20 text-ink font-body focus:border-coral outline-none text-sm w-56"
              />
              <span className="font-body text-caption uppercase tracking-widest text-ink/40 tabular-nums">
                {visibleBundles.length}/{bundles.length}
              </span>
            </div>
          </div>
          <ul>
            {visibleBundles.map((b) => {
              const kcal = bundleKcal[b.id];
              return (
                <li
                  key={b.id}
                  className="px-4 sm:px-6 py-3 border-b border-ink/10 last:border-b-0 flex flex-wrap items-center sm:items-baseline justify-between gap-x-3 gap-y-2"
                >
                  <div className="min-w-0 flex-1 basis-full sm:basis-auto">
                    <p className="font-body text-sm text-ink break-words">
                      {b.name}
                    </p>
                    <p className="font-body text-caption uppercase tracking-widest text-ink/40 tabular-nums">
                      {b.items.length} {b.items.length === 1 ? 'item' : 'items'}
                      {kcal != null ? ` · ${kcal} kcal` : ''}
                      {' · logged '}{b.times_logged}×
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        const ids = b.items.map((it) => it.food_id);
                        const list = await fetchFoodsByIds(ids);
                        const byId = new Map(list.map((f) => [f.id, f] as const));
                        for (const it of b.items) {
                          const f = byId.get(it.food_id);
                          if (!f) continue;
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
                          rememberPortion(f.id, it.portion_grams);
                        }
                        touchBundle(b.id);
                      }}
                      className="bg-ink text-paper font-body text-caption uppercase tracking-widest px-3 py-2 hover:bg-ink/85 transition-colors"
                    >
                      Log this meal
                    </button>
                    <button
                      type="button"
                      onClick={() => startEditing(b)}
                      className="font-body text-caption uppercase tracking-widest text-ink/60 hover:text-ink border border-ink/20 px-2 py-2 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => startDuplicating(b)}
                      className="font-body text-caption uppercase tracking-widest text-ink/60 hover:text-ink border border-ink/20 px-2 py-2 transition-colors"
                    >
                      Duplicate
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
              );
            })}
          </ul>
        </div>
      )}

      {/* Logged today. Each row: meal-slot picker, favorite, log
          again, remove. Build-meal mode below shows checkboxes + a
          save form so the user picks which items go into the bundle
          (instead of all-of-today which was too greedy). */}
      {logLoaded && todayEntries.length > 0 && (
        <div className="bg-paper border border-ink/15">
          <div className="px-6 py-4 border-b border-ink/10 flex flex-wrap items-baseline justify-between gap-3">
            <div>
              <p className="font-body text-caption uppercase tracking-widest text-ink/50">
                Logged today
              </p>
              <p className="font-body text-caption text-ink/40 mt-1">
                Tap the meal slot to re-categorize. Pick items below to
                build a bundle.
              </p>
            </div>
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
              const isPickedForBuild = buildMode && e.meal && pickedIds.has(e.id);
              return (
                <li
                  key={e.id}
                  className={`px-4 sm:px-6 py-3 border-b border-ink/10 last:border-b-0 flex flex-wrap items-center sm:items-baseline justify-between gap-x-4 gap-y-2 ${
                    isPickedForBuild ? 'bg-coral/5' : ''
                  }`}
                >
                  <div className="min-w-0 flex-1 basis-full sm:basis-auto">
                    <p className="font-body text-sm text-ink break-words">
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
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Per-row meal-slot picker. Lets the user re-categorize
                        an entry that was logged without a slot. Click
                        cycles: none → breakfast → lunch → dinner → snack → none. */}
                    <select
                      value={e.meal ?? ''}
                      onChange={(ev) => {
                        const v = ev.target.value;
                        updateEntry(e.id, {
                          meal: v === '' ? null : (v as Meal),
                        });
                      }}
                      aria-label={`Meal slot for ${e.name}`}
                      className="font-body text-caption uppercase tracking-widest px-2 py-1 bg-paper border border-ink/20 text-ink/70 focus:border-coral outline-none"
                    >
                      <option value="">—</option>
                      {MEAL_OPTIONS.map((m) => (
                        <option key={m.value} value={m.value}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                    {/* "Include in bundle" checkbox (only visible while
                        buildMode is on). Bundles only accept items that
                        have a meal slot, so a row with no slot is
                        still picked but the save will skip it. */}
                    {buildMode && (
                      <label className="flex items-center gap-1 text-ink/60">
                        <input
                          type="checkbox"
                          checked={pickedIds.has(e.id)}
                          onChange={() => togglePick(e.id)}
                          className="w-4 h-4"
                        />
                      </label>
                    )}
                    <button
                      onClick={async () => {
                        const f = await fetchFoodsByIds([e.food_id]).then(
                          (l) => l[0]
                        );
                        if (!f) return;
                        setPicked(f);
                        const remembered = portionFor(f.id);
                        if (remembered != null) setPendingGrams(remembered);
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

          {/* Build-meal CTA + form. Appears once the user has at
              least 2 items today. In build mode the form sits below
              the list and exposes the selected count + name input. */}
          {todayEntries.length >= 2 && !buildMode && (
            <div className="px-6 py-3 border-t border-ink/10 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setBuildMode(true);
                  setPickedIds(new Set());
                  setBuildName('');
                  setBuildError(null);
                }}
                className="font-body text-caption uppercase tracking-widest text-coral hover:text-coral/85 transition-colors"
              >
                + Build a meal bundle from today's items
              </button>
              {mealMatch && (
                <span className="font-body text-caption uppercase tracking-widest text-ink/40">
                  Suggested: "{mealMatch.bundle.name}" · click "Log this
                  meal" above
                </span>
              )}
            </div>
          )}

          {buildMode && (
            <div className="px-6 py-3 border-t border-ink/10 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="font-body text-caption uppercase tracking-widest text-ink/50">
                  Pick items with a meal slot
                </p>
                <span className="font-body text-caption uppercase tracking-widest text-ink/40 tabular-nums">
                  {pickedIds.size} selected
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  value={buildName}
                  onChange={(e) => setBuildName(e.target.value)}
                  placeholder="e.g. Breakfast"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveBundle();
                    if (e.key === 'Escape') clearBuild();
                  }}
                  className="flex-1 px-3 py-2 bg-paper border-2 border-ink/30 text-ink font-body focus:border-coral outline-none"
                  aria-label="Bundle name"
                />
                <button
                  type="button"
                  onClick={handleSaveBundle}
                  disabled={buildSaving}
                  className="bg-ink text-paper font-body text-caption uppercase tracking-widest px-3 py-2 hover:bg-ink/85 transition-colors disabled:opacity-40"
                >
                  {buildSaving ? 'Saving…' : 'Save bundle'}
                </button>
                <button
                  type="button"
                  onClick={clearBuild}
                  className="font-body text-caption uppercase text-ink/60 hover:text-ink px-2 py-2 transition-colors"
                >
                  Cancel
                </button>
              </div>
              {buildError && (
                <p className="font-body text-caption text-coral">{buildError}</p>
              )}
              <p className="font-body text-caption text-ink/40">
                Items without a meal slot are skipped automatically —
                pick breakfast / lunch / dinner / snack on the rows
                you want included.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Bundle editor / duplicator. Opened by Edit or Duplicate
          on a saved bundle. Shows the items with their portions and
          a list of candidate foods to add. Inline edit so the user
          can change portions or swap items without leaving the
          Foods panel. */}
      {editing && (
        <div className="bg-paper border border-ink/15">
          <div className="px-6 py-4 border-b border-ink/10">
            <p className="font-body text-caption uppercase tracking-widest text-ink/50">
              {editing.isDuplicate ? `Duplicate "${editing.originalName}"` : `Edit "${editing.originalName}"`}
            </p>
            <p className="font-body text-caption text-ink/40 mt-1">
              {editing.isDuplicate
                ? 'Pick the items + portions for the new copy and save under a fresh name.'
                : 'Change the items + portions in place. The new values take effect immediately.'}
            </p>
          </div>
          <div className="px-6 py-4 space-y-3">
            <div className="flex items-center gap-2">
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                aria-label="Bundle name"
                className="flex-1 px-3 py-2 bg-paper border-2 border-ink/30 text-ink font-body focus:border-coral outline-none"
              />
              <button
                type="button"
                onClick={saveEdit}
                disabled={editSaving}
                className="bg-ink text-paper font-body text-caption uppercase tracking-widest px-3 py-2 hover:bg-ink/85 transition-colors disabled:opacity-40"
              >
                {editSaving ? 'Saving…' : editing.isDuplicate ? 'Save as new bundle' : 'Save changes'}
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                className="font-body text-caption uppercase text-ink/60 hover:text-ink px-2 py-2 transition-colors"
              >
                Cancel
              </button>
            </div>
            {editError && (
              <p className="font-body text-caption text-coral">{editError}</p>
            )}
            <div>
              <p className="font-body text-caption uppercase tracking-widest text-ink/50 mb-2">
                Items
              </p>
              {editItems.length === 0 && (
                <p className="font-body text-caption text-ink/40 mb-2">
                  No items — add some below.
                </p>
              )}
              <ul className="space-y-2">
                {editItems.map((it) => (
                  <BundleItemRow
                    key={it.food_id}
                    food_id={it.food_id}
                    portion_grams={it.portion_grams}
                    onPortionChange={(g) => setEditPortion(it.food_id, g)}
                    onRemove={() => removeEditItem(it.food_id)}
                  />
                ))}
              </ul>
            </div>
            <BundleItemPicker
              existingIds={new Set(editItems.map((it) => it.food_id))}
              onPick={(food) => {
                setEditItems((prev) => [
                  ...prev,
                  { food_id: food.id, portion_grams: 100 },
                ]);
              }}
            />
          </div>
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

// Resolves a food_id to a name + shows the row in the bundle editor.
// Keeps the row body thin so the parent component stays scannable.
function BundleItemRow({
  food_id,
  portion_grams,
  onPortionChange,
  onRemove,
}: {
  food_id: string;
  portion_grams: number;
  onPortionChange: (g: number) => void;
  onRemove: () => void;
}) {
  const [name, setName] = useState<string>(food_id);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    fetchFoodsByIds([food_id]).then((list) => {
      if (cancelled) return;
      if (list[0]) setName(list[0].name);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [food_id]);
  return (
    <li className="flex flex-wrap items-center gap-2 border border-ink/10 px-3 py-2">
      <span className="font-body text-sm text-ink flex-1 min-w-[120px]">
        {loading ? '…' : name}{' '}
        <span className="text-ink/40 text-caption">{food_id}</span>
      </span>
      <input
        type="number"
        min={1}
        value={portion_grams}
        onChange={(e) => {
          const n = parseInt(e.target.value, 10);
          if (Number.isFinite(n) && n > 0) onPortionChange(n);
        }}
        aria-label="Grams"
        className="w-20 px-2 py-1 bg-paper border border-ink/20 font-body text-sm focus:border-ink outline-none"
      />
      <span className="text-ink/40 font-body text-caption">g</span>
      <button
        type="button"
        onClick={onRemove}
        aria-label="Remove"
        className="font-body text-caption uppercase text-ink/40 hover:text-coral px-2 py-1"
      >
        ✕
      </button>
    </li>
  );
}

// Quick "add an item" picker. Small free-text search against the
// OFF-corpus RPC-backed food search. Picks a recent / popular set
// first to keep the typical flow snappy without a network round-trip
// per keystroke.
function BundleItemPicker({
  existingIds,
  onPick,
}: {
  existingIds: Set<string>;
  onPick: (food: Food) => void;
}) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Food[]>([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    const trimmed = q.trim();
    if (trimmed.length < 2) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    import('@/components/food-database/search').then(({ searchFoodsRemote }) => {
      if (cancelled) return;
      searchFoodsRemote({
        query: trimmed,
        limit: 8,
      })
        .then(({ foods }) => {
          if (cancelled) return;
          setResults(foods);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    });
    return () => {
      cancelled = true;
    };
  }, [q]);
  return (
    <div>
      <p className="font-body text-caption uppercase tracking-widest text-ink/50 mb-2">
        Add an item
      </p>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search a food…"
        aria-label="Add a food to the bundle"
        className="w-full px-3 py-2 bg-paper border-2 border-ink/20 font-body text-sm focus:border-coral outline-none mb-2"
      />
      {loading && q.trim().length >= 2 && (
        <p className="font-body text-caption text-ink/40">Searching…</p>
      )}
      {q.trim().length >= 2 && results.length > 0 && (
        <ul className="border border-ink/10">
          {results.map((f) => (
<li
                key={f.id}
                className="px-3 py-2 border-b border-ink/10 last:border-b-0 flex flex-wrap items-center justify-between gap-x-3 gap-y-1"
              >
                <span className="font-body text-sm text-ink break-words min-w-0 flex-1">
                  {f.name}{' '}
                  <span className="text-ink/40 text-caption">{f.id}</span>
                </span>
              {existingIds.has(f.id) ? (
                <span className="font-body text-caption uppercase tracking-widest text-ink/40">
                  added
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => onPick(f)}
                  className="font-body text-caption uppercase tracking-widest text-coral hover:text-coral/85"
                >
                  Add
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}