// cohort-events
//
// Given a cohort start date, return the date the user finishes
// the 50-day challenge (start + 49 days, since day 1 = start) and
// a "real-world" cultural event that falls on or near the finish
// day. Used in the cohort page messaging to give the user a
// concrete end-date anchor — start Nov 1, finish Dec 20 (Christmas
// Eve), ready to celebrate the festive season in style; start
// Dec 1, finish Jan 19, Dry Jan done; etc.
//
// Region-aware for December (Dry Jan is a UK/AU thing, MLK Day
// is a US thing). Otherwise the same event for all users.
//
// Used by:
//   - /cohorts (landing)            — next-cohort finish card
//   - /cohorts/[id]                — finish line on the share card
//   - StartCohortCard               — in-app for the chosen cohort
//
// The map below is hand-curated for the next 12 months. For a
// start month that has no explicit event in the map, the function
// returns a generic "50 days from {start} = {finish}" with no
// event label, so the UI still has a real date to show.

export type CohortRegion = 'us' | 'row';

export interface CohortFinish {
  finishDate: string;   // YYYY-MM-DD
  eventName: string;    // "Christmas Eve", "MLK Day", ...
  eventDate: string;     // YYYY-MM-DD, when the event actually falls
  copy: string;          // Sentence-fragment for the user-facing copy
}

const ROW: Array<{
  startMonth: number;  // 1-12
  finishMonth: number;
  finishDay: number;
  eventName: string;
  copy: string;
  eventMonth?: number;
  eventDay?: number;
}> = [
  { startMonth: 1,  finishMonth: 2,  finishDay: 19, eventName: 'International Whale Conservation Day', copy: 'the 50 days wrap just before the spring equinox — start fresh, finish with the whales' },
  { startMonth: 2,  finishMonth: 3,  finishDay: 22, eventName: 'World Water Day',                 copy: '50 days ends on World Water Day — drink up' },
  { startMonth: 3,  finishMonth: 4,  finishDay: 19, eventName: 'Bicycle Day',                    copy: 'you finish on World Bicycle Day — 50 days, zero carbon if you walked' },
  { startMonth: 4,  finishMonth: 5,  finishDay: 20, eventName: 'World Bee Day',                     copy: 'you finish on World Bee Day — 50 days, a little less processed sugar, 50 days of bees' },
  { startMonth: 5,  finishMonth: 6,  finishDay: 19, eventName: 'Juneteenth',                      copy: 'you finish on Juneteenth — a sober holiday is still a holiday' },
  { startMonth: 6,  finishMonth: 7,  finishDay: 20, eventName: 'International Chess Day',          copy: 'you finish on International Chess Day — 50 days of one good move at a time' },
  { startMonth: 7,  finishMonth: 8,  finishDay: 19, eventName: 'World Photography Day',            copy: 'you finish on World Photography Day — the only photo on your phone that matters is the one of you on day 1' },
  { startMonth: 8,  finishMonth: 9,  finishDay: 19, eventName: 'Talk Like a Pirate Day',           copy: '50 days ends on Talk Like a Pirate Day — arrr, you made it' },
  { startMonth: 9,  finishMonth: 10, finishDay: 20, eventName: 'World Statistics Day',            copy: 'you finish on World Statistics Day — and yours are 50/50' },
  { startMonth: 10, finishMonth: 11, finishDay: 19, eventName: 'International Men\u2019s Day',     copy: 'you finish on International Men\u2019s Day — 50 days is something worth celebrating' },
  { startMonth: 11, finishMonth: 12, finishDay: 20, eventName: 'Christmas Eve',                    copy: 'you finish on Christmas Eve — 50 days, ready to celebrate the festive season in style' },
];

const US: typeof ROW = [
  ...ROW.filter(
    (e) => e.startMonth !== 11 && e.startMonth !== 12
  ),
  { startMonth: 11, finishMonth: 12, finishDay: 25, eventName: 'Christmas Day',                       copy: 'you finish on Christmas Day — 50 days, ready to celebrate the festive season in style' },
  { startMonth: 12, finishMonth: 1,  finishDay: 19, eventName: 'Martin Luther King Jr. Day',          copy: '50 days ends on MLK Day — the man had a dream, you just finished a 50-day challenge. Same energy.' },
];

function isoFor(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function daysBetween(a: string, b: string): number {
  const aMs = new Date(a + 'T00:00:00').getTime();
  const bMs = new Date(b + 'T00:00:00').getTime();
  return Math.round((bMs - aMs) / 86_400_000);
}

export function cohortFinish(
  startDate: string,
  region: CohortRegion = 'row'
): CohortFinish {
  const startMs = new Date(startDate + 'T00:00:00').getTime();
  const finishMs = startMs + 49 * 86_400_000;
  const finish = new Date(finishMs);
  const startMonth = finish.getMonth() + 1;
  const year = finish.getFullYear();
  const finishDate = isoFor(
    finish.getFullYear(),
    finish.getMonth() + 1,
    finish.getDate()
  );

  const table = region === 'us' ? US : ROW;
  const entry = table.find((e) => e.startMonth === startMonth);
  if (!entry) {
    return {
      finishDate,
      eventName: '',
      eventDate: finishDate,
      copy: `50 days from start lands on ${finishDate}`,
    };
  }
  const eventDate = entry.eventMonth
    ? isoFor(year, entry.eventMonth, entry.eventDay!)
    : isoFor(
        entry.finishMonth,
        entry.finishMonth === 1 && startMonth === 12 ? year + 1 : year,
        entry.finishDay
      );
  return {
    finishDate,
    eventName: entry.eventName,
    eventDate,
    copy: entry.copy,
  };
}

// daysUntilStart — for the countdown chip on the cohort card.
export function daysUntilStart(startDate: string): number {
  const startMs = new Date(startDate + 'T00:00:00').getTime();
  const today = new Date(new Date().toDateString()).getTime();
  return Math.max(
    0,
    Math.round((startMs - today) / 86_400_000)
  );
}

// daysUntilEvent — for the chip on the share card.
export function daysUntilEvent(eventDate: string): number {
  const eventMs = new Date(eventDate + 'T00:00:00').getTime();
  const today = new Date(new Date().toDateString()).getTime();
  return Math.max(
    0,
    Math.round((eventMs - today) / 86_400_000)
  );
}

// Days-from-start to "y" suffix — small util used by the cert
// page and the share card to describe the finish line.
export function daysToWeeks(days: number): string {
  if (days < 1) return 'today';
  if (days < 7) return `in ${days} day${days === 1 ? '' : 's'}`;
  const weeks = Math.round(days / 7);
  return `in ${weeks} week${weeks === 1 ? '' : 's'}`;
}

// For the in-app "finish line" panel on a chosen cohort, we
// want a sentence-fragment the user can scan in one breath.
// Output e.g.:
//   "You finish on Friday, 20 December 2025 (in 50 days)
//    — Christmas Eve, ready to celebrate the festive season
//    in style."
export function finishLineSentence(
  startDate: string,
  region: CohortRegion = 'row'
): string {
  const f = cohortFinish(startDate, region);
  const fdate = new Date(f.finishDate + 'T00:00:00');
  const dayName = fdate.toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const d = daysBetween(
    new Date().toISOString().slice(0, 10),
    f.finishDate
  );
  const days = Math.max(0, d);
  const inN = days > 0 ? ` (in ${days} day${days === 1 ? '' : 's'})` : '';
  if (!f.eventName) {
    return `You finish on ${dayName}${inN}.`;
  }
  return `You finish on ${dayName}${inN} — ${f.eventName}. ${f.copy.charAt(0).toUpperCase()}${f.copy.slice(1)}`;
}
