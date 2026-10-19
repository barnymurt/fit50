# Preview the cohort section as-of any date

The repo has a small in-app affordance for this. No DevTools, no
clock changes, no DB edits.

Visit:

```
https://fit50challenge.io/?date=2026-11-01
```

(Use a real date in `YYYY-MM-DD` form.)

The homepage cohort countdown card re-renders against that calendar
date instead of today.

## What you'll see

| Field | Real Oct 19 | `?date=2026-11-01` |
|---|---|---|
| Eyebrow | `NEXT COHORT STARTS IN` | `NEXT COHORT STARTS TODAY` |
| Numeral | `13 days` | `Today` |
| Start line | `Starts Sunday, 1 November` | `Starts Sunday, 1 November` |
| Finish-line | `… (in 32 days)` | `… (in 50 days)` |
| Coral CTA | unchanged | unchanged |

Same Nov cohort underneath, just the day counter and the "in N days"
parenthetical on the finish-line sentence shift to the override date.

## Scope

- The override applies **only to the homepage cohort countdown card**.
  The Tracker, day-number math, streak, /account, and every other
  time-sensitive surface render against real time as before.
- The override only shifts **"now"** — the cohort *list* is still
  whatever the server returns for real today. If you set
  `?date=2027-01-01` you'll see the next eligible cohort rendered
  against Jan 1 2027, which can show negative `daysAway` for
  already-passed cohorts. That's expected, not a bug.
- `?date=garbage`, `?date=2026-13-99`, `?date=2026-11-31` all
  fall back to real time silently. No error UI.
- **Production builds ignore the param.** `process.env.NODE_ENV === 'production'` short-circuits the helper so a real visitor landing on `?date=…` sees the same render as `/`. The override is a developer affordance, not a feature.

## Reversibility

If you decide you don't want this affordance any more, the entire
override lives behind one function (`devOverrideNow` and its caller
`nowOrOverride` in `src/lib/dates.ts`) and one usage site in
`src/components/cohort/CohortHomepageSection.tsx`. To remove:
delete the helper and the four lines in the component that call it.
No DB migrations, no schema, no commits needed to revert.

Spec: `docs/user-stories/debug-cohort-date-override.md`.

## If you'd rather not deal with the URL

Three no-URL ways to see the Nov cohort rendering (none of which
gives you the literal `Today` numeral, but all show the same card):

1. **Incognito** on `https://fit50challenge.io`. Block renders
   anonymous with `13 days`. Same copy, same finish-line anchor.
2. **Test user** — sign in as the seeded test user
   (`cohort-preview-2026-11-01@fit50test.local` / `previewpass123`)
   in a separate Chrome profile. Block renders with `13 days`.
3. **Wait 13 days.** Block renders naturally on real Nov 1.

The `?date=` URL is the only path that produces the literal `Today`
numeral and the "in 50 days" finish-line suffix.
