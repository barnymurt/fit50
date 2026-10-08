# User stories — INDEX

Living catalogue. Every shipped feature × user type. Read it to see what
fit50 already does before designing anything new.

Update on every feature ship. Append a row. Don't rewrite history.

## User types (canonical)

| Tag | Definition | Primary happy-path story |
|---|---|---|
| `anonymous` | Visitor, no account | [happy-path-anonymous.md](./happy-path-anonymous.md) |
| `new_free` | Signed up, no payment, no challenge started | [happy-path-free-user.md](./happy-path-free-user.md) |
| `active_free` | Day 1–50, no premium | [happy-path-free-user.md](./happy-path-free-user.md) |
| `premium` | Paid €5.99 unlock | [happy-path-premium-user.md](./happy-path-premium-user.md) |
| `cohort_member` | Opted into the monthly cohort | [happy-path-free-user.md](./happy-path-free-user.md) (or premium variant) |
| `solo_user` | No cohort, doing it alone | [happy-path-free-user.md](./happy-path-free-user.md) (or premium variant) |
| `returning` | Back after a gap, streak protection candidate | (premium) [happy-path-premium-user.md](./happy-path-premium-user.md) |
| `streak_broken` | Failed a day | [streak-protection.md](./streak-protection.md) |
| `mobile` | Phone-primary device | (every happy-path covers it) |
| `account_mgmt` | On `/account`, looking at progress / settings | (every happy-path covers it) |
| `buddy_recipient` | Giftee in a buyer's pair purchase (always ends up premium) | [happy-path-buddy-recipient.md](./happy-path-buddy-recipient.md) |

## Story kinds

Two kinds of stories live in this folder:

- **per-feature** — one file per shipped feature (e.g. `streak-protection.md`).
  These are the spec. Use TEMPLATE.md.
- **happy-path** — one file per user type's full lifecycle (e.g.
  `happy-path-free-user.md`). These are the journey map. Same TEMPLATE.md
  shape, but the user story spans the whole lifecycle and acceptance
  criteria are grouped by stage. Cross-reference per-feature stories inline.

When designing a new feature, read the relevant happy-path file first to
understand the journey the feature is interrupting, then read the
per-feature stories of nearby features to see the existing spec.

## Catalogue

| Feature | User types | Story | Shipped | Premium? |
|---|---|---|---|---|
| Happy path: anonymous visitor | anonymous | [happy-path-anonymous.md](./happy-path-anonymous.md) | `docs` | n/a |
| Happy path: free user | new_free, active_free, cohort_member, solo_user | [happy-path-free-user.md](./happy-path-free-user.md) | `docs` | n/a |
| Happy path: premium user | premium, returning | [happy-path-premium-user.md](./happy-path-premium-user.md) | `docs` | n/a |
| Happy path: buddy recipient | buddy_recipient | [happy-path-buddy-recipient.md](./happy-path-buddy-recipient.md) | `docs` | n/a |
| Start the challenge today / future date | active_free, mobile | [start-the-challenge.md](./start-the-challenge.md) | `220fc72` | no |
| Scheduled future start (survives refresh) | active_free, mobile | [scheduled-start.md](./scheduled-start.md) | `220fc72` | no |
| Premium unlock (€5.99 one-time) | new_free, active_free | [premium-unlock.md](./premium-unlock.md) | (see account page) | — |
| Streak protection (1 free pass / week) | premium, streak_broken | [streak-protection.md](./streak-protection.md) | `0038` | yes |
| Join the monthly cohort | anonymous, new_free, active_free | [join-a-cohort.md](./join-a-cohort.md) | `b31258e` | no |
| Cohort high-five (5/day kudos) | cohort_member | [cohort-high-five.md](./cohort-high-five.md) | `e73ccb6` | no |
| Cohort finish-line anchor message | cohort_member, new_free | [cohort-finish-line-message.md](./cohort-finish-line-message.md) | `269a236` | no |
| Day-before-start reminder email | active_free, cohort_member, solo_user | [day-before-reminder.md](./day-before-reminder.md) | `269a236` | no |
| Public cohort share landing pages | anonymous | [cohort-public-share.md](./cohort-public-share.md) | `c23a6e5` | no |

## How to use this catalogue

1. New feature idea? Skim the table to see if it already exists under a
   different name.
2. Need to understand a user type? Read the happy-path story tagged with
   it (column 3 of the user-types table).
3. Refactor in flight? The story files link back to the code via the
   `Shipped` section.
4. End of a build, before commit: append your row. One line. Don't drop
   the row even if you later consolidate features.
5. **Happy-path stories are documentation, not features.** They don't need
   a story-of-their-own and the `user-stories-first` skill does not
   trigger on them — they're for the next LLM session to read, not to
   build.