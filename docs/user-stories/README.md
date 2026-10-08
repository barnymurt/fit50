# User stories

Every new feature in FIT50 is designed for a specific user, not "everyone".
This folder is the build-phase contract that makes that statement true across
LLM sessions.

## Why this folder exists

LLM sessions forget. AGENTS.md gets re-read, but no file currently says
"draft the user story before writing code". Without an enforced workflow the
default is "vibe + iterate" — code first, fix the rough edges later. That
costs days of rework on every feature.

This folder is the persistent memory:

- **`README.md`** — the workflow (this file).
- **`TEMPLATE.md`** — the format every story uses.
- **`INDEX.md`** — the living catalogue of every shipped feature × user type.
- **`<slug>.md`** — one file per feature.

AGENTS.md points here. The `user-stories-first` skill enforces it. Even
without either, the convention is documented and any LLM can find it.

## When to write a user story

Write one **before** writing any code for:

- A new feature, screen, or surface.
- A new premium gate or paywall change.
- A new API route that returns user-visible data.
- A new cron, email, or notification.
- A new hook that the user interacts with (not internal helpers).

You **do not** need a story for:

- Pure bug fixes (something is broken, fix it).
- Trivial copy edits with no UX change.
- Internal refactors with no user-visible behaviour change.
- Test additions to existing acceptance criteria.

If you're unsure, write one. Cheap to delete, expensive to skip.

## The four sections that must be filled before code starts

1. **User story** — _As a `<user type>`, I want `<goal>`, so that `<benefit>`._
2. **Acceptance criteria** — Given/when/then or checklist. Testable.
3. **UX/UI risks** — edge cases, empty states, mobile vs desktop, anonymous vs
   signed-in, free vs premium, failure modes.
4. **Out of scope** — what this slice deliberately does NOT do.

If any of the four is empty, the story is not finished. Do not start coding.

## Workflow

```
1. Read docs/user-stories/INDEX.md to see the existing user model.
2. Copy TEMPLATE.md to docs/user-stories/<kebab-slug>.md.
3. Fill the four required sections + the test plan.
4. Show the user the draft.
6. Start coding only after the user signs off.
7. When shipped, append a row to INDEX.md.
8. Reference the story file in the commit message body.
```

## File naming

`docs/user-stories/kebab-case-slug.md`. No dates in the filename. Keep them
short — the spec is the value, not the prose.

## Don't ship a feature without updating `INDEX.md`

If a feature landed but the catalogue doesn't say so, the next LLM session
won't know it shipped, won't know which user types it serves, and will likely
rebuild something that already exists. INDEX.md is the single source of truth
for "what does fit50 currently do, and who does each thing serve".