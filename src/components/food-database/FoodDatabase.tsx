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
import MyCustomFoodsPanel from './MyCustomFoodsPanel';
import Modal from '@/components/Modal';

type FoodTab = 'logged' | 'search' | 'myfoods';

interface Props {
  targets: MacroTargets | null;
}

// Meal bundles render as a 4x4 (2 cols on mobile, 4 on desktop) tile
// grid. 12 tiles per page — beyond that we paginate. Each tile is a
// tap-to-log shortcut for the bundle; the user can also reorder to
// surface their current week's go-to bundles to the top.
const BUNDLE_TILES_PER_PAGE = 12;

// A single tile in the saved-meal-bundles grid. Square aspect, brand
// consistent (paper background, ink border). The tile wears the
// colour of its meal slot — cream for breakfast, coral for lunch,
// lavender for dinner, teal for snack — via a 6px stripe across
// the top and a subtle tint of the same colour in the body. Top =
// name + meal caption, middle = nutrition summary (kcal / items),
// bottom row = drag handle (⠿), edit (✎), duplicate (⎘), delete
// (✕). Tap on the tile body logs the bundle; the drag handle
// reorders.
type MealKey = 'breakfast' | 'lunch' | 'dinner' | 'snack';
const TILE_STYLE: Record<
  MealKey,
  { stripe: string; tint: string; label: string }
> = {
  breakfast: { stripe: 'bg-cream', tint: 'bg-cream/40', label: 'Breakfast' },
  lunch: { stripe: 'bg-coral', tint: 'bg-coral/15', label: 'Lunch' },
  dinner: { stripe: 'bg-lavender', tint: 'bg-lavender/40', label: 'Dinner' },
  snack: { stripe: 'bg-teal', tint: 'bg-teal/15', label: 'Snack' },
};
const NEUTRAL_TINT = 'bg-paper';
const NEUTRAL_STRIPE = 'bg-ink/20';

function getTileStyle(meal: string | null): {
  stripe: string;
  tint: string;
  label: string | null;
} {
  if (meal && meal in TILE_STYLE) {
    return { ...TILE_STYLE[meal as MealKey], label: TILE_STYLE[meal as MealKey].label };
  }
  return { stripe: NEUTRAL_STRIPE, tint: NEUTRAL_TINT, label: null };
}

function BundleTile({
  bundle,
  kcal,
  foodNames,
  isDragging,
  isDropTarget,
  onLog,
  onEdit,
  onDuplicate,
  onDelete,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
}: {
  bundle: MealBundle;
  kcal: number | null;
  /** Resolved food names for this bundle's items — bundle_id →
   *  food_id → name. Missing keys fall back to the raw food_id
   *  so the tile never renders an empty list. */
  foodNames: Record<string, string>;
  isDragging: boolean;
  isDropTarget: boolean;
  onLog: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onDragEnd: () => void;
}) {
  const [logging, setLogging] = useState(false);
  const { stripe, tint, label: mealLabel } = getTileStyle(bundle.meal);
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={`aspect-square border ${tint} transition-colors flex flex-col cursor-grab active:cursor-grabbing ${
        isDragging
          ? 'opacity-40 border-dashed border-ink/40'
          : isDropTarget
            ? 'border-coral border-2'
            : 'border-ink/15 hover:border-coral'
      }`}
    >
      <div className={`h-1.5 shrink-0 ${stripe}`} aria-hidden />
      <button
        type="button"
        onClick={async () => {
          if (logging) return;
          setLogging(true);
          try {
            await onLog();
          } finally {
            setLogging(false);
          }
        }}
        aria-label={`Log meal bundle ${bundle.name}`}
        className="flex-1 min-h-0 p-2 text-left flex flex-col gap-1 disabled:opacity-50 cursor-pointer"
        disabled={logging}
      >
        <p className="font-body text-sm text-ink leading-tight line-clamp-2">
          {bundle.name}
        </p>
        {/* Meal caption: truncate so a long meal name ('Breakfast')
            can't bleed past the tile on a narrow 2-col mobile grid. */}
        {mealLabel && (
          <p className="font-body text-[9px] sm:text-[10px] uppercase tracking-widest text-ink/50 leading-none truncate">
            {mealLabel}
          </p>
        )}
        {/* Item list — desktop only. Mobile keeps the count + kcal
            line below so the cramped 2-col grid doesn't try to
            cram 3-5 food names into a ~140 px square tile. */}
        {bundle.items.length > 0 && (
          <ul className="space-y-0.5 text-left w-full">
            {bundle.items.map((it) => (
              <li
                key={it.food_id}
                className="font-body text-[11px] text-ink/60 leading-tight truncate"
              >
                · {foodNames[it.food_id] ?? it.food_id}
              </li>
            ))}
          </ul>
        )}
        {/* Items + kcal on one line. mt-auto pushes it to the
            bottom of the button so multi-line names + the meal
            caption stay vertically aligned across tiles. On
            desktop the items list above already gives detail; we
            keep this summary line so mobile still gets the kcal +
            count in a single glance. */}
        <p className="font-body text-[10px] sm:text-caption uppercase tracking-widest text-ink/40 tabular-nums leading-none truncate mt-auto">
          {bundle.items.length}{' '}
          {bundle.items.length === 1 ? 'item' : 'items'}
          {' · '}
          {kcal != null ? `${kcal} kcal` : '—'}
        </p>
      </button>
      <div className="px-2 py-1 border-t border-ink/15 flex items-center gap-1 text-ink/60">
        <span
          aria-hidden
          className="px-1 py-0.5 select-none"
          title="Drag to reorder"
        >
          ⠿
        </span>
        <span className="flex-1" />
        <button
          type="button"
          disabled={logging}
          onClick={onEdit}
          aria-label={`Edit ${bundle.name}`}
          className="px-1 py-0.5 hover:text-ink disabled:opacity-30 cursor-pointer"
          title="Edit"
        >
          ✎
        </button>
        <button
          type="button"
          disabled={logging}
          onClick={onDuplicate}
          aria-label={`Duplicate ${bundle.name}`}
          className="px-1 py-0.5 hover:text-ink disabled:opacity-30 cursor-pointer"
          title="Duplicate"
        >
          ⎘
        </button>
        <button
          type="button"
          disabled={logging}
          onClick={onDelete}
          aria-label={`Delete ${bundle.name}`}
          className="px-1 py-0.5 hover:text-coral disabled:opacity-30 cursor-pointer"
          title="Delete"
        >
          ✕
        </button>
      </div>
    </div>
  );
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
    loaded: logLoaded,
  } = useFoodLog();
  const { favoriteIds, isFavorite, toggle } = useFoodFavorites();
  const { portionFor, rememberPortion } = usePortionPrefs();
  const {
    bundles,
    hydrated: bundlesLoaded,
    createBundle,
    updateBundle,
    touchBundle,
    moveBundleTo,
    deleteBundle,
  } = useMealBundles();
  const [picked, setPicked] = useState<Food | null>(null);
  const [pendingGrams, setPendingGrams] = useState<number | null>(null);
  // Tab in the food panel — public search vs the user's own custom
  // foods. Persists per session so a quick switch to "my foods"
  // doesn't bounce back to the search.
  const [tab, setTab] = useState<FoodTab>('logged');

  // "Build a meal" mode. When the user clicks the CTA we reveal
  // checkboxes next to every log-today row. They pick which items
  // go into the bundle, then name + save. The selected-set lives
  // here so the UI can show a live count + a Save button.
  const [buildMode, setBuildMode] = useState(false);
  const [pickedIds, setPickedIds] = useState<Set<string>>(new Set());
  const [buildName, setBuildName] = useState('');
  // Inferred at the moment build mode opens (the most common meal
  // among today's logged items with a slot). The user can override
  // it before saving; '' means "no meal slot" (the tile renders
  // with the neutral accent).
  const [buildMeal, setBuildMeal] = useState<Meal | ''>('');
  const [buildSaving, setBuildSaving] = useState(false);
  const [buildError, setBuildError] = useState<string | null>(null);

  // Bundle editor. Lets the user rename + re-pick items + change
  // the meal slot on an existing bundle. Opened by "Edit" or
  // "Duplicate" on a tile.
  const [editing, setEditing] = useState<{
    id: string;
    name: string;
    meal: Meal | null;
    isDuplicate: boolean;
    originalName: string;
  } | null>(null);
  const [editItems, setEditItems] = useState<{ food_id: string; portion_grams: number }[]>([]);
  const [editName, setEditName] = useState('');
  // '' = leave the meal slot unset; otherwise one of the four
  // meal keys.
  const [editMeal, setEditMeal] = useState<Meal | ''>('');
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Drag-and-drop reorder state. `draggingId` is the bundle being
  // dragged (set on dragstart, cleared on dragend). `dropTargetId`
  // is the tile the cursor is currently over — paints a coral border
  // to show where the dragged tile will land.
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

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

  // Pagination for the bundle tile grid. Resets to page 0 when the
  // filter shrinks the list below the current page's range.
  const [bundlePage, setBundlePage] = useState(0);
  const totalBundlePages = Math.max(
    1,
    Math.ceil(visibleBundles.length / BUNDLE_TILES_PER_PAGE)
  );
  // Clamp the current page when the filtered set shrinks.
  useEffect(() => {
    if (bundlePage > totalBundlePages - 1) {
      setBundlePage(Math.max(0, totalBundlePages - 1));
    }
  }, [bundlePage, totalBundlePages]);
  const paginatedBundles = useMemo(
    () =>
      visibleBundles.slice(
        bundlePage * BUNDLE_TILES_PER_PAGE,
        (bundlePage + 1) * BUNDLE_TILES_PER_PAGE
      ),
    [visibleBundles, bundlePage]
  );

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

  // Drag-and-drop handlers. The dragged tile id travels in the
  // dataTransfer payload so the drop site can read it without us
  // having to thread props through every tile.
  const handleDragStart = (
    e: React.DragEvent,
    bundleId: string
  ) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', bundleId);
    setDraggingId(bundleId);
  };
  const handleDragOver = (
    e: React.DragEvent,
    bundleId: string
  ) => {
    if (!draggingId || bundleId === draggingId) return;
    e.preventDefault(); // signals "this is a drop target"
    e.dataTransfer.dropEffect = 'move';
    setDropTargetId(bundleId);
  };
  const handleDragLeave = (bundleId: string) => {
    setDropTargetId((prev) => (prev === bundleId ? null : prev));
  };
  const handleDrop = (
    e: React.DragEvent,
    targetId: string
  ) => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData('text/plain') || draggingId;
    if (sourceId && sourceId !== targetId) {
      void moveBundleTo(sourceId, targetId);
    }
    setDraggingId(null);
    setDropTargetId(null);
  };
  const handleDragEnd = () => {
    setDraggingId(null);
    setDropTargetId(null);
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
    setBuildMeal('');
    setBuildError(null);
  };
  const handleSaveBundle = async () => {
    if (buildSaving) return;
    if (!buildName.trim()) {
      setBuildError('Give the meal a name.');
      return;
    }
    const pickedEntries = todayEntries
      .filter((e) => pickedIds.has(e.id))
      .filter((e) => e.meal); // must be assigned a meal slot
    const items = pickedEntries.map((e) => ({
      food_id: e.food_id,
      portion_grams: e.grams,
    }));
    if (items.length < 2) {
      setBuildError(
        'Pick at least two items, each with a meal slot (breakfast / lunch / dinner / snack).'
      );
      return;
    }
    // The user can override the meal slot in the form before
    // saving. Empty string means "no meal type set" — the tile
    // renders with the neutral accent.
    const mealValue = buildMeal === '' ? null : buildMeal;
    setBuildSaving(true);
    setBuildError(null);
    const id = await createBundle(buildName, items, mealValue);
    setBuildSaving(false);
    if (!id) {
      setBuildError('Could not save the bundle. Try again.');
      return;
    }
    clearBuild();
  };

  // Bundle editor helpers.
  const startEditing = (b: MealBundle) => {
    const meal = (b.meal as Meal | null) ?? null;
    setEditing({
      id: b.id,
      name: b.name,
      meal,
      isDuplicate: false,
      originalName: b.name,
    });
    setEditName(b.name);
    setEditMeal(meal ?? '');
    setEditItems(
      b.items.map((it) => ({ food_id: it.food_id, portion_grams: it.portion_grams }))
    );
    setEditError(null);
  };
  const startDuplicating = (b: MealBundle) => {
    const meal = (b.meal as Meal | null) ?? null;
    setEditing({
      id: b.id,
      name: `Copy of ${b.name}`,
      meal,
      isDuplicate: true,
      originalName: b.name,
    });
    setEditName(`Copy of ${b.name}`);
    setEditMeal(meal ?? '');
    setEditItems(
      b.items.map((it) => ({ food_id: it.food_id, portion_grams: it.portion_grams }))
    );
    setEditError(null);
  };
  const cancelEdit = () => {
    setEditing(null);
    setEditItems([]);
    setEditName('');
    setEditMeal('');
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
    // Normalise the meal slot — '' becomes null (no meal type).
    const mealValue = editMeal === '' ? null : editMeal;
    if (editing.isDuplicate) {
      // Duplicate: create a fresh bundle under the new name with
      // the (possibly edited) meal slot.
      const newId = await createBundle(editName, editItems, mealValue);
      setEditSaving(false);
      if (!newId) {
        setEditError('Could not save the new bundle. Try again.');
        return;
      }
      cancelEdit();
      return;
    }
    // Edit: update in place. The meal slot always gets pushed so
    // the editor can clear it back to null with the "—" option.
    const res = await updateBundle(
      editing.id,
      editName,
      editItems,
      mealValue
    );
    setEditSaving(false);
    if (!res.ok) {
      setEditError(res.error || 'Could not save. Try again.');
      return;
    }
    cancelEdit();
  };

  // Compute the kcal summary + per-item food names for the bundle
  // list. Resolves the food rows for each bundle's items on demand,
  // caches the result per (bundle_id, day) for the session so the
  // list doesn't refetch on every render. bundleFoodNames holds the
  // resolved names so the desktop tile can list each item under
  // the bundle name without going back to Supabase.
  const [bundleKcal, setBundleKcal] = useState<Record<string, number | null>>({});
  const [bundleFoodNames, setBundleFoodNames] = useState<
    Record<string, Record<string, string>>
  >({});
  useEffect(() => {
    if (visibleBundles.length === 0) return;
    let cancelled = false;
    const kcalUpdates: Record<string, number | null> = {};
    const nameUpdates: Record<string, Record<string, string>> = {};
    const needFetch: string[] = [];
    for (const b of visibleBundles) {
      if (b.id in bundleKcal && b.id in bundleFoodNames) continue;
      needFetch.push(b.id);
    }
    if (needFetch.length === 0) return;
    (async () => {
      const allFoodIds = new Set<string>();
      const bundleFoodIds = new Map<string, string[]>();
      for (const b of visibleBundles) {
        if (!needFetch.includes(b.id)) continue;
        const ids = b.items.map((it) => it.food_id);
        bundleFoodIds.set(b.id, ids);
        for (const id of ids) allFoodIds.add(id);
      }
      const list = await fetchFoodsByIds(Array.from(allFoodIds));
      if (cancelled) return;
      const byId = new Map(list.map((f) => [f.id, f] as const));
      for (const b of visibleBundles) {
        if (!needFetch.includes(b.id)) continue;
        const ids = bundleFoodIds.get(b.id) ?? [];
        // kcal
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
        kcalUpdates[b.id] = known ? Math.round(total) : null;
        // names — one lookup per item, missing names fall back to
        // the raw food_id so the tile is never empty.
        const names: Record<string, string> = {};
        for (const id of ids) {
          const f = byId.get(id);
          names[id] = f?.name ?? id;
        }
        nameUpdates[b.id] = names;
      }
      if (cancelled) return;
      setBundleKcal((prev) => ({ ...prev, ...kcalUpdates }));
      setBundleFoodNames((prev) => ({ ...prev, ...nameUpdates }));
    })();
    return () => {
      cancelled = true;
    };
  }, [visibleBundles, bundleKcal, bundleFoodNames]);

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

      {/* Saved meal bundles. 4x4 (2 cols on mobile, 4 on desktop)
          square-tile grid. Each tile is a tap-to-log shortcut for
          the bundle's stored portions. ↑↓ on a tile bumps its
          position so the user can surface their current week's
          go-to meal to the top without reordering the rest.
          Pagination once the filtered list exceeds 12 tiles. */}
      {bundlesLoaded && bundles.length > 0 && (
        <div className="bg-paper border border-ink/15">
          <div className="px-6 py-4 border-b border-ink/10 flex flex-wrap items-baseline justify-between gap-3">
            <div>
              <p className="font-body text-caption uppercase tracking-widest text-ink/50">
                Saved meal bundles
              </p>
              <p className="font-body text-caption text-ink/40 mt-1">
                Tap a tile to log the combo. Drag ⠿ to reorder.
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
          <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {paginatedBundles.map((b) => {
              const kcal = bundleKcal[b.id];
              return (
                <BundleTile
                  key={b.id}
                  bundle={b}
                  kcal={kcal ?? null}
                  foodNames={bundleFoodNames[b.id] ?? {}}
                  isDragging={draggingId === b.id}
                  isDropTarget={dropTargetId === b.id}
                  onLog={async () => {
                    const ids = b.items.map((it) => it.food_id);
                    const list = await fetchFoodsByIds(ids);
                    const byId = new Map(
                      list.map((f) => [f.id, f] as const)
                    );
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
                  onEdit={() => startEditing(b)}
                  onDuplicate={() => startDuplicating(b)}
                  onDelete={() => {
                    if (
                      window.confirm(
                        `Delete meal bundle "${b.name}"?`
                      )
                    ) {
                      void deleteBundle(b.id);
                    }
                  }}
                  onDragStart={(e) => handleDragStart(e, b.id)}
                  onDragOver={(e) => handleDragOver(e, b.id)}
                  onDragLeave={() => handleDragLeave(b.id)}
                  onDrop={(e) => handleDrop(e, b.id)}
                  onDragEnd={handleDragEnd}
                />
              );
            })}
          </div>
          {totalBundlePages > 1 && (
            <div className="px-6 py-4 border-t border-ink/10 flex items-center justify-center gap-2">
              <button
                type="button"
                disabled={bundlePage === 0}
                onClick={() => setBundlePage((p) => Math.max(0, p - 1))}
                aria-label="Previous bundles page"
                className="px-3 py-1 border border-ink/20 font-body text-caption uppercase tracking-widest text-ink/70 hover:border-ink/40 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                ◀
              </button>
              <span className="font-body text-caption uppercase tracking-widest text-ink/40 tabular-nums">
                Showing {bundlePage * BUNDLE_TILES_PER_PAGE + 1}–{Math.min(
      (bundlePage + 1) * BUNDLE_TILES_PER_PAGE,
      visibleBundles.length
    )} of {visibleBundles.length} (page {bundlePage + 1}/{totalBundlePages})
              </span>
              <button
                type="button"
                disabled={bundlePage >= totalBundlePages - 1}
                onClick={() =>
                  setBundlePage((p) =>
                    Math.min(totalBundlePages - 1, p + 1)
                  )
                }
                aria-label="Next bundles page"
                className="px-3 py-1 border border-ink/20 font-body text-caption uppercase tracking-widest text-ink/70 hover:border-ink/40 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                ▶
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab block. The "food panel" has three tabs: Logged today,
          Search, My foods. Each tab's content renders its own
          bordered panel below the tab nav. Logged today is the
          default — when the user opens the foods section they see
          what they've already eaten before they start searching. */}
      <div className="flex items-center gap-1 border-b border-ink/10 mb-4">
        <button
          type="button"
          onClick={() => setTab('logged')}
          aria-pressed={tab === 'logged'}
          className={`px-4 py-2 font-body text-caption uppercase tracking-widest border-b-2 transition-colors ${
            tab === 'logged'
              ? 'border-coral text-ink'
              : 'border-transparent text-ink/50 hover:text-ink'
          }`}
        >
          Logged today
          {todayEntries.length > 0 && (
            <span className="ml-2 text-ink/40 tabular-nums">
              {todayEntries.length}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setTab('search')}
          aria-pressed={tab === 'search'}
          className={`px-4 py-2 font-body text-caption uppercase tracking-widest border-b-2 transition-colors ${
            tab === 'search'
              ? 'border-coral text-ink'
              : 'border-transparent text-ink/50 hover:text-ink'
          }`}
        >
          Search
        </button>
        <button
          type="button"
          onClick={() => setTab('myfoods')}
          aria-pressed={tab === 'myfoods'}
          className={`px-4 py-2 font-body text-caption uppercase tracking-widest border-b-2 transition-colors ${
            tab === 'myfoods'
              ? 'border-coral text-ink'
              : 'border-transparent text-ink/50 hover:text-ink'
          }`}
        >
          My foods
        </button>
      </div>

      {tab === 'logged' ? (
        logLoaded && todayEntries.length > 0 ? (
          /* Logged today. Each row: meal-slot picker, favourite,
             log again, remove. Build-meal mode below shows
             checkboxes + a save form so the user picks which
             items go into the bundle (instead of all-of-today
             which was too greedy). */
          <div className="bg-paper border border-ink/15">
            <div className="px-6 py-4 border-b border-ink/10 flex flex-wrap items-baseline justify-between gap-3">
              <p className="font-body text-caption text-ink/40">
                Tap the meal slot to re-categorize. Pick items below
                to build a bundle.
              </p>
              <p className="font-body text-caption uppercase tracking-widest text-ink/40 tabular-nums">
                {todayEntries.length}{' '}
                {todayEntries.length === 1 ? 'item' : 'items'}
              </p>
            </div>
            <ul>
              {todayEntries.map((e) => {
                const cKcal = contribution(e, 'kcal');
                const cProtein = contribution(e, 'protein');
                const cCarbs = contribution(e, 'carbs');
                const cFat = contribution(e, 'fat');
                const showChips = !!targets;
                const isPickedForBuild =
                  buildMode && e.meal && pickedIds.has(e.id);
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
                                isOverFor('kcal')
                                  ? 'text-coral'
                                  : 'text-ink/50'
                              }`}
                            >
                              +{Math.round(cKcal)}% kcal
                            </span>
                          )}
                          {cProtein >= 5 && (
                            <span
                              className={`font-body text-caption uppercase tracking-widest tabular-nums ${
                                isOverFor('protein')
                                  ? 'text-coral'
                                  : 'text-ink/50'
                              }`}
                            >
                              +{Math.round(cProtein)}% P
                            </span>
                          )}
                          {cCarbs >= 5 && (
                            <span
                              className={`font-body text-caption uppercase tracking-widest tabular-nums ${
                                isOverFor('carbs')
                                  ? 'text-coral'
                                  : 'text-ink/50'
                              }`}
                            >
                              +{Math.round(cCarbs)}% C
                            </span>
                          )}
                          {cFat >= 5 && (
                            <span
                              className={`font-body text-caption uppercase tracking-widest tabular-nums ${
                                isOverFor('fat')
                                  ? 'text-coral'
                                  : 'text-ink/50'
                              }`}
                            >
                              +{Math.round(cFat)}% F
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
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
                          const f = await fetchFoodsByIds([
                            e.food_id,
                          ]).then((l) => l[0]);
                          if (!f) return;
                          setPicked(f);
                          const remembered = portionFor(f.id);
                          if (remembered != null)
                            setPendingGrams(remembered);
                        }}
                        aria-label={`Log ${e.name} again`}
                        title="Log again at the same portion"
                        className="font-body text-caption uppercase tracking-widest text-ink/60 hover:text-coral px-2 py-1 transition-colors"
                      >
                        Log again
                      </button>
                      <button
                        onClick={() => toggle(e.food_id)}
                        aria-label={
                          isFavorite(e.food_id)
                            ? 'Unfavourite'
                            : 'Favourite'
                        }
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

            {todayEntries.length >= 2 && !buildMode && (
              <div className="px-6 py-3 border-t border-ink/10 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    // Seed the meal slot from today's items: pick
                    // the most common non-null meal so the bundle
                    // starts with a sensible default. The user can
                    // override it in the form before saving.
                    const counts: Record<string, number> = {};
                    for (const e of todayEntries) {
                      if (e.meal) counts[e.meal] = (counts[e.meal] ?? 0) + 1;
                    }
                    const inferred =
                      (Object.entries(counts).sort(
                        (a, b) => b[1] - a[1]
                      )[0]?.[0] as Meal | undefined) ?? '';
                    setBuildMode(true);
                    setPickedIds(new Set());
                    setBuildName('');
                    setBuildMeal(inferred);
                    setBuildError(null);
                  }}
                  className="font-body text-caption uppercase tracking-widest text-coral hover:text-coral/85 transition-colors"
                >
                  + Build a meal bundle from today's items
                </button>
                {mealMatch && (
                  <span className="font-body text-caption uppercase tracking-widest text-ink/40">
                    Suggested: "{mealMatch.bundle.name}" · click "Log
                    this meal" above
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
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    autoFocus
                    value={buildName}
                    onChange={(e) => setBuildName(e.target.value)}
                    placeholder="e.g. Breakfast"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveBundle();
                      if (e.key === 'Escape') clearBuild();
                    }}
                    className="flex-1 min-w-[180px] px-3 py-2 bg-paper border-2 border-ink/30 text-ink font-body focus:border-coral outline-none"
                    aria-label="Bundle name"
                  />
                  <select
                    value={buildMeal}
                    onChange={(e) =>
                      setBuildMeal((e.target.value || '') as Meal | '')
                    }
                    aria-label="Meal slot"
                    className="px-3 py-2 bg-paper border-2 border-ink/30 text-ink font-body text-caption uppercase tracking-widest focus:border-coral outline-none"
                  >
                    <option value="">—</option>
                    {MEAL_OPTIONS.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
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
                  <p className="font-body text-caption text-coral">
                    {buildError}
                  </p>
                )}
                <p className="font-body text-caption text-ink/40">
                  Items without a meal slot are skipped automatically.
                  Pick a meal slot above (or leave as — for a neutral
                  tile) before saving.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-paper border border-ink/15 px-6 py-8 text-center">
            <p className="font-body text-caption uppercase tracking-widest text-ink/40">
              Nothing logged today
            </p>
            <p className="font-body text-sm text-ink/60 mt-2">
              Switch to Search or My foods to log your first meal.
            </p>
          </div>
        )
      ) : tab === 'search' ? (
        <FoodSearch
          favorites={favoriteIds}
          onPickFood={handlePickFood}
        />
      ) : (
        <MyCustomFoodsPanel onPickFood={handlePickFood} />
      )}

      {/* Bundle editor / duplicator. Opened by Edit or Duplicate
          on a saved bundle. Shows the items with their portions
          and a list of candidate foods to add. Renders as a
          modal so the user lands on it immediately when they
          tap the tile's ✎ button — no scrolling down to the
          bottom of the logged-food section. */}
      <Modal
        open={!!editing}
        onClose={cancelEdit}
        title={
          editing
            ? editing.isDuplicate
              ? `Duplicate "${editing.originalName}"`
              : `Edit "${editing.originalName}"`
            : ''
        }
        ariaLabel="Bundle editor"
      >
        {editing && (
          <>
            <p className="font-body text-caption text-ink/50">
              {editing.isDuplicate
                ? 'Pick the items + portions for the new copy and save under a fresh name.'
                : 'Change the items + portions in place. The new values take effect immediately.'}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                aria-label="Bundle name"
                className="flex-1 min-w-[180px] px-3 py-2 bg-paper border-2 border-ink/30 text-ink font-body focus:border-coral outline-none"
              />
              <select
                value={editMeal}
                onChange={(e) =>
                  setEditMeal((e.target.value || '') as Meal | '')
                }
                aria-label="Meal slot"
                className="px-3 py-2 bg-paper border-2 border-ink/30 text-ink font-body text-caption uppercase tracking-widest focus:border-coral outline-none"
              >
                <option value="">—</option>
                {MEAL_OPTIONS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
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
                className="font-body text-caption uppercase text-ink/60 hover:text-ink px-3 py-2 transition-colors"
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
          </>
        )}
      </Modal>

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
