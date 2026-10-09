// text-colour.ts — text colour matches the ground. Pure data
// check, no rendering needed: the rule is in tokens.json.

import type { Post } from '../schema/post.js';
import type { Ground, Tokens } from '../tokens.js';
import { textColourFor } from '../tokens.js';

export function checkTextColour(post: Post, tokens: Tokens) {
  const flags: import('./ground-sequence.js').Flag[] = [];
  for (const slide of post.slides) {
    const expected = textColourFor(slide.ground as Ground);
    if (!expected) {
      flags.push({
        slideId: slide.id,
        message: `Ground "${slide.ground}" is not in the ground_pairs table.`,
      });
    }
  }
  return flags;
}
