// coral-once.ts — coral used at most once per slide.
//
// The "coral once per view" rule applies to the rendered
// slide, not to the JSON. We check the JSON by counting how
// many fields carry the coral colour directly. The template
// also uses coral for the marquee band on Instagram grounds,
// so this check has to know which aspect/ground the slide is
// on. A simpler version: flag slides whose fields hardcode
// coral more than once.
//
// For Phase 1, we just count coral string occurrences in the
// rendered HTML (the renderer tags them with data-coral). This
// check stub is the data-side counterpart.

import type { Post } from '../schema/post.js';

export function checkCoralOnce(post: Post) {
  const flags: import('./ground-sequence.js').Flag[] = [];
  // Phase 1 keeps this a no-op: the rule is enforced at render
  // time by the templates (each renders coral in exactly one
  // place per non-cta slide). The data-side check is added in
  // Phase 6 when the post-draft generator wants the early
  // signal.
  return flags;
}
