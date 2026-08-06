# FIT50 Design System

> **Read this before any visual work.** The full visual reference lives in the three `.dc.html` files alongside this — open `Foundations.dc.html` first.

## The six colours

| Token | Hex | Role |
|---|---|---|
| **Ink** | `#1A1A1A` | All body copy and headings. Primary button fill on light. Workouts section ground. |
| **Paper** | `#FAF6EE` | Default page background. Becomes text colour on ink and teal grounds. |
| **Coral** | `#E88B5A` | **The only action colour.** Completed habit tiles, progress fills, focus rings, hover states, marquee type, text selection. Use for exactly one thing per view. |
| **Teal** | `#4A9B9B` | Rules section ground and the streak card. Also means "success": a day with 7+ habits done, a finished timer. |
| **Cream** | `#F2D9A2` | Partial progress in the 50-day grid, and the streak numeral on teal. A soft tone, never a button. |
| **Lavender** | `#D8B8D0` | Calculator section ground, and the far stop of the hero gradient orb. Carries ink text, not paper. |
| **White** | `#FFFFFF` | Panel colour above paper: tracker card, FAQ section. Distinct from paper — do not swap them. |
| **Rule** | `rgba(26,26,26,0.12)` | Every divider and panel border on light. On dark, use `rgba(254,254,254,0.14)` (rule-light) or paper at 15%. |

**Opacity ladder** (tint ink and paper rather than adding greys):
- `100%` body
- `85%` hover
- `70%` prose
- `50%` labels
- `30%` borders
- `12%` rules

## The three typefaces, strict jobs

| Token | Font | Job |
|---|---|---|
| `font-display` | **Fraunces** (Georgia fallback) | Every heading, every big numeral, the FIT50 wordmark. **Always set at 400 — never bold.** |
| `font-body` | **Inter** (system-ui fallback) | Prose, labels, buttons, inputs, all caption text. Features `cv11` and `ss01` on globally. |
| `font-marquee` | **Lilita One** | One job only: the scrolling section headers. Never used for UI text, never below 5rem. |

## Type scale

| Token | Size / Line-height / Tracking | Used for |
|---|---|---|
| `display-1` | `clamp(4.5rem, 11vw, 9rem)` / 0.9 / -0.03em | Hero headline only. One per page. |
| `display-2` | `clamp(2.75rem, 6vw, 5rem)` / 1 / -0.02em | Section headline. Tracker, footer wordmark. |
| `h1` | `clamp(2rem, 3.5vw, 2.75rem)` / 1.1 / -0.01em | All nine, every day. |
| `h2` | `clamp(1.5rem, 2vw, 1.875rem)` / 1.2 / -0.01em | Card titles, tracker count, closing lines. |
| `h3` | `clamp(1.25rem, 1.5vw, 1.5rem)` / 1.3 | Accordion questions. |
| `body` | `1rem` / 1.6 · Inter 400 | Prose sits at `ink/70`, `max-w-2xl`. |
| `caption` | `0.75rem` / 1.4 / 0.12em · always uppercase | The workhorse label. Nav, eyebrows, buttons, meta. |
| `numeral` | `clamp(6rem, 12vw, 9rem)` / -0.04em | Streak count, workout line letters. Hero "50" goes to 26vw / -0.06em. Timers add `tabular-nums`. |

## Section tones, in order

The page alternates deliberately: **paper → teal → lavender → ink → paper → white → ink**. Two adjacent sections never share a ground.

| Tone | Background | Text |
|---|---|---|
| `paper` | `#FAF6EE` | ink |
| `teal` | `#4A9B9B` | paper |
| `lavender` | `#D8B8D0` | ink |
| `ink` | `#1A1A1A` | paper |
| `white` | `#FFFFFF` | ink (panels inside paper) |

Cream and lavender only carry ink text. Paper text on cream or lavender is **wrong** — both are dark enough to be treated as paper-toned grounds.

## Shape, motion, focus

### Radius

- **0px** — panels, cards, inputs, tiles, grid cells (squares are the house style)
- **Full (9999px)** — the default Button, and the 32px accordion toggle
- **Nothing in between**

### Easing

`cubic-bezier(0.4, 0, 0.2, 1)` for everything.

### Durations

- **200ms** — buttons, links, hover colour
- **300ms** — habit tiles, nav, accordion body
- **500ms** — progress bar, solved-cube glow
- **700ms** — rule card flip (`rotateY 180°`)
- **60s / 200–240s** — marquee loops

All of it collapses to `0.01ms` under `prefers-reduced-motion`.

### Focus & elevation

- Focus is always a **2px coral outline at 3px offset** with a 2px radius
- **No drop shadows anywhere** in the system
- The one exception is the solved cube's `0 0 0 4px rgba(232,139,90,0.35)` ring
- Depth comes from ground colour and 1px rules, never shadows

## Space & grid

| Token | Value | Used for |
|---|---|---|
| Container | `max-width: 1280px · 0 auto` | All page content |
| Gutter | `24px` mobile, `40px` md+ | Inside the container |
| Section padding | `clamp(5rem, 10vw, 8rem)` | Section bottom margin |
| Marquee sections | `pt-40` mobile, `pt-56` desktop | Extra top padding for the marquee band |
| Headline-to-content | `48px` → `64px` at md | Inside sections |
| Card grid gap | `24px` | Card layouts |
| Layout grid gap | `32px` | Major layout splits |
| Cube grid gap | `1px` | The 3×3 tracker cells |
| Inner grid gap | `6px` | Small grids (like 50-day view) |

## Do / don't

**Do**
- Use coral for exactly one thing per view: the thing to act on.
- Tint ink and paper for hierarchy instead of reaching for grey.
- Set headings in Fraunces 400 — never bold them.
- Keep captions uppercase with 0.12em tracking, always 12px.
- Change ground colour to signal a new section.
- Let 1px rules do the dividing work.

**Don't**
- Round a card, panel or input — squares are the house style.
- Add drop shadows to build depth.
- Use Lilita One anywhere except a full-width marquee.
- Put paper text on cream or lavender; both carry ink.
- Introduce a new accent hue. Coral is the accent.
- Swap white for paper in panels — the two are distinct.

## The visual reference files

The full design system with live previews is in:

- `docs/design-system/Foundations.dc.html` — colour, type, section tones, space, motion
- `docs/design-system/Components.dc.html` — every component pattern
- `docs/design-system/Patterns.dc.html` — full page-level patterns

Open these in a browser (or run a local file server in that folder) to see everything with live examples. The HTML uses `<x-dc>` and `<helmet>` custom elements — that's expected, just view in a browser.

## Why this file exists

This document is the **single source of truth** for the FIT50 visual language. Any agent or human building on this project should:

1. **Read this file first** before any visual work
2. **Open the three `.dc.html` files** in `docs/design-system/` to see the values in context
3. **Check the current code** in `src/components/` to see how the values are applied
4. **Never invent** new colours, type sizes, or spacing — extend the system instead

If you're tempted to add a new colour, ask: "is this coral, or is this coral?" If the answer is "neither, it's teal-leaning", you're adding a colour. Don't.
