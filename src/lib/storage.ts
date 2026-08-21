// localStorage helpers with versioned schema.
// v1 was the pre-tracker-logging shape (currentDay: 1..50,
// habitCompletions keyed by day number). v2 is startDate-driven:
// day number derives from (now - startDate), and the in-progress
// taps live in `pendingTaps` for today's date, with closed days
// archived in `closedDays`. v1 reads trigger a one-shot migration
// when a fresh key is missing. v1 writes are no longer produced.

export const SCHEMA_VERSION = 2 as const;
export const TRACKER_KEY = 'fit50-tracker-v2';
export const TRACKER_KEY_V1 = 'fit50_tracker';
export const WATER_KEY = 'fit50-water-v2';
export const WATER_KEY_V1 = 'fit50-water-v1';
export const MACRO_KEY = 'fit50-macro-v2';
export const MACRO_DAY_KEY = 'fit50-macro-day-v2';

export interface TrackerDataV2 {
  schemaVersion: 2;
  startDate: string | null;
  /**
   * `pendingTaps` belong to this local-tz date (`YYYY-MM-DD`). When the
   * user boots the app on a later day without the rollover effect
   * having fired (because the tab was closed at midnight), we compare
   * this key against today and archive any non-today taps into
   * `closedDays` for the day they actually belong to. Without this,
   * yesterday's tiles appeared selected on the new day until the
   * user toggled them off or the next rollover interval fired.
   */
  pendingTapsDateKey: string | null;
  pendingTaps: Record<string, boolean>;
  closedDays: Record<number, Record<string, boolean>>;
  streakUsedWeekKeys: string[];
  waterByDate: Record<string, number>;
}

interface TrackerDataV1 {
  currentDay: number;
  habitCompletions: Record<string, Record<number, boolean>>;
  streakCount: number;
  longestStreak: number;
  lastUpdated: string;
  startDate: string;
}

export function loadJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && '__v' in parsed) {
      if (parsed.__v === SCHEMA_VERSION) {
        const data = (parsed.data as T) ?? fallback;
        return backfillTrackerV2MissingFields(data, fallback);
      }
    }
    return fallback;
  } catch {
    return fallback;
  }
}

/**
 * Old v2 blobs (pre-pendingTapsDateKey) load with the new field
 * missing. Default to null rather than guess the date — be
 * conservative: leave pendingTaps as-is, the rollover reconcile in
 * useTrackerState will pick up the correct day on first write.
 */
function backfillTrackerV2MissingFields<T>(data: T, fallback: T): T {
  if (!data || typeof data !== 'object') return data;
  const d = data as Record<string, unknown>;
  if (typeof d.schemaVersion === 'number' && d.schemaVersion === 2) {
    if (!('pendingTapsDateKey' in d)) {
      return { ...d, pendingTapsDateKey: null } as T;
    }
  }
  return data;
}

export function saveJson<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(
      key,
      JSON.stringify({ __v: SCHEMA_VERSION, data })
    );
  } catch {
    // Ignore quota errors and private mode
  }
}

export function clearJson(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore
  }
}

/**
 * Read v1 `fit50_tracker` and convert it to v2. Strategy 3 from
 * the migration plan: treat stored `currentDay` as truth and
 * back-derive `startDate = now - (currentDay - 1) days` so the
 * new wall-clock-derived day count stays in sync going forward.
 *
 * Returns null if no v1 blob is present or the blob is unusable;
 * callers should default to a clean v2 in that case.
 */
export function migrateV1ToV2(now: Date = new Date()): TrackerDataV2 | null {
  if (typeof window === 'undefined') return null;
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(TRACKER_KEY_V1);
  } catch {
    return null;
  }
  if (!raw) return null;

  let v1: TrackerDataV1;
  try {
    v1 = JSON.parse(raw);
  } catch {
    return null;
  }
  if (
    !v1 ||
    typeof v1 !== 'object' ||
    typeof v1.currentDay !== 'number' ||
    typeof v1.habitCompletions !== 'object'
  ) {
    return null;
  }

  const currentDay = Math.max(1, Math.min(50, v1.currentDay));
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (currentDay - 1));

  const closedDays: TrackerDataV2['closedDays'] = {};
  Object.entries(v1.habitCompletions || {}).forEach(([habitId, days]) => {
    Object.entries(days || {}).forEach(([dayStr, done]) => {
      if (!done) return;
      const dayNum = parseInt(dayStr, 10);
      if (Number.isNaN(dayNum) || dayNum === currentDay) return;
      if (!closedDays[dayNum]) closedDays[dayNum] = {};
      closedDays[dayNum][habitId] = true;
    });
  });

  return {
    schemaVersion: 2,
    startDate: start.toISOString(),
    pendingTapsDateKey: null,
    pendingTaps: {},
    closedDays,
    streakUsedWeekKeys: [],
    waterByDate: {},
  };
}

export function emptyTrackerV2(): TrackerDataV2 {
  return {
    schemaVersion: 2,
    startDate: null,
    pendingTapsDateKey: null,
    pendingTaps: {},
    closedDays: {},
    streakUsedWeekKeys: [],
    waterByDate: {},
  };
}

/**
 * Read the v2 tracker from storage, migrating from v1 if necessary.
 * Returns null if the user hasn't started a challenge yet
 * (startDate === null) so callers can decide whether to show the
 * Start splash or load existing progress.
 */
export function loadTrackerV2(
  now: Date = new Date()
): TrackerDataV2 | null {
  const fresh = loadJson<TrackerDataV2>(TRACKER_KEY, emptyTrackerV2());
  if (fresh.startDate) {
    return fresh;
  }
  const migrated = migrateV1ToV2(now);
  if (migrated && migrated.startDate) {
    saveJson(TRACKER_KEY, migrated);
    try {
      localStorage.removeItem(TRACKER_KEY_V1);
    } catch {
      // best-effort cleanup
    }
    return migrated;
  }
  return null;
}

export function saveTrackerV2(data: TrackerDataV2): void {
  saveJson(TRACKER_KEY, data);
}

/**
 * One-shot helper used by the StartChallenge splash's "discard old
 * data" link — wipes both v1 and v2 keys so the user gets a fresh
 * slate without v1's age-corrected startDate clamping them.
 */
export function wipeAllTrackerData(): void {
  clearJson(TRACKER_KEY);
  clearJson(TRACKER_KEY_V1);
  clearJson(WATER_KEY);
  clearJson(WATER_KEY_V1);
  clearJson(MACRO_KEY);
  clearJson(MACRO_DAY_KEY);
}
