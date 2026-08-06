# Design system

This folder is the canonical source for FIT50's visual language.

## Start here

- **[DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)** — the full system in markdown. **Read this first** for any visual work.

## Live visual reference

Open these in a browser (they use `<x-dc>` and `<helmet>` custom elements — just open the file):

- **[Foundations.dc.html](./Foundations.dc.html)** — colour, type, section tones, space, motion, focus
- **[Components.dc.html](./Components.dc.html)** — every component pattern
- **[Patterns.dc.html](./Patterns.dc.html)** — full page-level patterns

`support.js` is a shared runtime the `.dc.html` files depend on. Keep them together.

## Why both markdown and HTML?

The markdown is what any agent (or human) reads before working. The HTML files are the live visual reference — the actual rendered designs, with real fonts and real colors. Both are kept in sync with `tailwind.config.js` and `globals.css`.

If you spot a difference between any of these sources and the live code, **the live code is wrong** — fix it.
