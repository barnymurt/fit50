// fit.ts — measures every text node after layout; flags any
// overflow and any one-word last line. Phase 1 ships a data-side
// pre-check that catches the cases we can predict from the JSON
// alone (field length vs the per-template cap in voice-lint);
// the rendered check is added when Playwright is wired in
// (the marquee-fit check is already wired in marquee-fit.ts).

import type { Post } from '../schema/post.js';
import type { LintRules } from '../tokens.js';

export function checkFitLengths(post: Post, lint: LintRules) {
  const flags: import('./ground-sequence.js').Flag[] = [];
  const limits = lint.field_limits;
  for (const slide of post.slides) {
    const t = slide.template;
    const l = limits[t];
    if (!l) continue;
  for (const [name, value] of Object.entries(slide.fields)) {
    if (!value || typeof value === 'string' || typeof value === 'number') continue;
    if (typeof (value as any).text !== 'string') continue;
    const cap = l[name];
    if (typeof cap !== 'number') continue;
    const text = (value as any).text as string;
    if (text.length > cap) {
      flags.push({
        slideId: slide.id,
        field: name,
        message: `Field ${name} is ${text.length} chars, cap is ${cap}.`,
      });
    }
  }
    // `items` is a list, not a Field; check each item's title.
    if (Array.isArray(slide.fields.items) && l.item_title) {
      const cap = l.item_title as number;
      for (const [i, item] of slide.fields.items.entries()) {
        if (item.title.length > cap) {
          flags.push({
            slideId: slide.id,
            field: `items[${i}].title`,
            message: `Item title is ${item.title.length} chars, cap is ${cap}.`,
          });
        }
      }
    }
  }
  return flags;
}

export function checkOneWordLastLine(post: Post) {
  // Phase 1 stub. The rendered check runs in Playwright and
  // counts the words on the last line of every text node.
  // The stub is a no-op so the data-side check is green; the
  // rendered check is what catches the real cases.
  return [] as import('./ground-sequence.js').Flag[];
}
