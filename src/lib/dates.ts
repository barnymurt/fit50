// Pure date helpers used by the Tracker + macro sections.
// All math uses the user's local timezone (every toISOString() in the UI
// pipeline passes through dateKeyLocal so server vs client never disagree
// about which calendar day a tap belongs to).

export const CHALLENGE_DAYS = 50;
export const MS_PER_DAY = 86_400_000;

/**
 * Dev-only date override.
 *
 * Reads `?date=YYYY-MM-DD` from `window.location.search` and returns
 * that calendar date as a `Date` (set to local-tz midnight) if it's
 * present and parseable. Otherwise returns `new Date()`.
 *
 * Scoped to non-production Vercel environments by gating on
 * `NEXT_PUBLIC_VERCEL_ENV` (inlined into the client bundle so
 * server + client agree). Production deployments do NOT set this
 * var — Vercel leaves it unset, which the helper treats as
 * "production" and returns null. Preview environments set it to
 * "preview"; local dev either sets it or leaves it unset; either
 * way the override applies.
 *
 * This exists to support the `?date=` preview affordance documented
 * in `docs/user-stories/debug-cohort-date-override.md`. Use is
 * local, temporary, and easily reversed — see the story's
 * "Implementation notes" section.
 */
export function devOverrideNow(): Date | null {
  if (typeof window === 'undefined') return null;
  // NEXT_PUBLIC_VERCEL_ENV is inlined at build time so the value
  // is available on both server (SSR) and client. Production is
  // the value left when this var is unset.
  const env = process.env.NEXT_PUBLIC_VERCEL_ENV;
  if (env === undefined || env === 'production') return null;
  const params = new URLSearchParams(window.location.search);
  const raw = params.get('date');
  if (!raw) return null;
  const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) return null;
  if (mo < 1 || mo > 12) return null;
  if (d < 1 || d > 31) return null;
  const dt = new Date(y, mo - 1, d);
  if (Number.isNaN(dt.getTime())) return null;
  // Validate the rolled-over date matches the input. `new Date(2026, 1, 29)`
  // silently becomes March 1 in non-leap years; we want to reject those.
  if (
    dt.getFullYear() !== y ||
    dt.getMonth() !== mo - 1 ||
    dt.getDate() !== d
  ) return null;
  return dt;
}

/**
 * The "now" used by date-sensitive render code. Returns the dev
 * `?date=` override in dev if one is set and valid, otherwise real
 * `new Date()`. Centralising this here means removing the preview
 * affordance is one function deletion.
 */
export function nowOrOverride(): Date {
  const override = devOverrideNow();
  return override ?? new Date();
}

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
 * Parse a `YYYY-MM-DD` date key into a `Date` set to local-tz
 * midnight. Used to look up the day number for a given calendar
 * date without the day-offset bugs that come from passing the
 * string directly to `new Date()` (which parses as UTC).
 */
export function parseDateKey(dateKey: string): Date {
  const [y, m, d] = dateKey.split('-').map(Number);
  if (!y || !m || !d) return new Date();
  return new Date(y, m - 1, d);
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
