// Single source of truth for the daily-habit list. Every hook and
// component that needs to know "how many habits does a complete day
// require?" imports HABIT_IDS.length from here so adding or removing
// a habit only edits this file. The id strings must stay stable —
// they are persisted in localStorage (closedDays / pendingTaps) and
// in Supabase (daily_state.habit_id, daily_totals.habit_id), so
// renaming one is a data migration, not a code edit.

export const HABIT_IDS = [
  'chill-out',
  'fuel-right',
  'crispy-clarity',
  'fresh-lungs',
  'open-mind',
  'move-body',
  'wet-lips',
  'step-it-up',
  'feed-brain',
] as const;

export type HabitId = (typeof HABIT_IDS)[number];

export const HABIT_COUNT = HABIT_IDS.length;

/**
 * A day counts as complete only when every habit is tapped.
 * The number derives from the canonical list rather than being
 * hardcoded so this can't drift out of sync with HABIT_IDS again.
 */
export function isFullyDone(taps: Record<string, boolean | undefined>): boolean {
  if (!taps) return false;
  for (const id of HABIT_IDS) {
    if (taps[id] !== true) return false;
  }
  return true;
}
