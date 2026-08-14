// Pure date helpers used by the Tracker + macro sections.
// All math uses the user's local timezone (every toISOString() in the UI
// pipeline passes through dateKeyLocal so server vs client never disagree
// about which calendar day a tap belongs to).

export const CHALLENGE_DAYS = 50;
export const MS_PER_DAY = 86_400_000;

/**
 * Strip the time component off a Date and return a `YYYY-MM-DD` string.
 * Two dates that fall on the same calendar day in the user's timezone
 * produce the same key, regardless of hour.
 */
export function dateKeyLocal(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Compute the 1-indexed day number for "now" given a `startDate`.
 * Returns 1 if `startDate` is in the future.
 * Clamps to [1, CHALLENGE_DAYS].
 */
export function dayIndexFromStart(
  startDate: string | Date | null | undefined,
  now: Date = new Date()
): number {
  if (!startDate) return 1;
  const start = new Date(startDate);
  if (Number.isNaN(start.getTime())) return 1;
  const startMidnight = new Date(
    start.getFullYear(),
    start.getMonth(),
    start.getDate()
  ).getTime();
  const nowMidnight = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  ).getTime();
  const deltaDays = Math.floor((nowMidnight - startMidnight) / MS_PER_DAY);
  if (deltaDays < 0) return 1;
  if (deltaDays >= CHALLENGE_DAYS) return CHALLENGE_DAYS;
  return deltaDays + 1;
}

/**
 * Inverse of `dayIndexFromStart`. Given a start and a day number,
 * return the calendar date that day lands on. Used by the 50-day chip
 * strip so each chip can show its own date.
 */
export function dayKeyFromStart(
  startDate: string | Date,
  dayNumber: number
): string {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const target = new Date(start.getTime() + (dayNumber - 1) * MS_PER_DAY);
  return dateKeyLocal(target);
}

/**
 * Format a `YYYY-MM-DD` as a short human label. Returns e.g. "Mon 18 Aug".
 */
export function formatDateKeyShort(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  if (!y || !m || !d) return dateKey;
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

/**
 * Resolve the days-remaining / days-elapsed text for the splash and
 * the chip strip header.
 */
export function challengeProgress(
  startDate: string | Date | null | undefined,
  now: Date = new Date()
): { dayNumber: number; daysElapsed: number; daysRemaining: number } {
  if (!startDate) {
    return { dayNumber: 0, daysElapsed: 0, daysRemaining: CHALLENGE_DAYS };
  }
  const dayNumber = dayIndexFromStart(startDate, now);
  const daysElapsed = Math.max(0, dayNumber - 1);
  const daysRemaining = Math.max(0, CHALLENGE_DAYS - dayNumber);
  return { dayNumber, daysElapsed, daysRemaining };
}
