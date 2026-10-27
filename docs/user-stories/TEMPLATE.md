# User story template

Copy this file to `docs/user-stories/<slug>.md` and fill in every
section. **All four required sections must be non-empty** — a story
with an empty section is not finished and must not be built from.

---

# <Feature name>

**Status:** Draft — awaiting approval
**Branch:** `<branch-name>`
**Feature area:** <where in the app this lives>

---

## User story

**As a** <user type from INDEX.md>
**I want** <the goal, in the user's words>
**So that** <the benefit>

---

## Context

<Why this exists. What the user does today, what's missing, what
the product wants to be. Two or three short paragraphs.>

---

## Acceptance criteria

<Every criterion must be testable. Use Given/When/Then or a
checklist. Cover the happy path, the failure paths, and the
states in between.>

### <Happy path>

- **Given** … **when** … **then** …

### <Failure handling>

- **Given** … **when** … **then** …

### <Non-goals for this slice>

- <Anything that must NOT be in this story.>

---

## UX / UI risks

<A table of risk → mitigation. Cover at minimum:

- anonymous vs signed-in
- free vs premium
- mobile vs desktop
- empty / loading / error states
- edge of the data model
- design-system fit
- accessibility
>

| Risk | Mitigation |
|---|---|
| | |

---

## Out of scope

<What this slice deliberately does not build. Be specific — this
is the list future contributors read to avoid re-litigating
decisions.>

---

## Test plan

### Unit

<What's unit-testable and what the cases are.>

### Integration

<What flows through the API / database.>

### Manual

<What a human has to try. Include browsers and devices.>

### Visual

<Design-system checks.>

---

## Implementation notes

**New files**

| File | Purpose |
|---|---|

**Edited files**

| File | Change |
|---|---|

**Not changed:** <anything deliberately left alone, and why>
