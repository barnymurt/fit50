// marquee-fit.ts — measured width of the marquee ≤ canvas
// width − 2 × padding. The measurements live in tokens.json
// and were captured against the actual font load (per the
// spec). This check rejects posts that reference an unknown
// marquee id or whose aspect is mismatched.

import type { Post } from '../schema/post.js';
import {
  marqueeLine,
  type Aspect,
  type Tokens,
} from '../tokens.js';

export function checkMarqueeFit(post: Post, tokens: Tokens) {
  const flags: import('./ground-sequence.js').Flag[] = [];
  const aspect: Aspect = post.aspect;
  for (const slide of post.slides) {
    if (slide.template === 'cta') continue;
    const id = post.marquee || 'marquee_default';
    const ml = marqueeLine(id, tokens);
    if (!ml) {
      flags.push({
        slideId: slide.id,
        message: `Marquee id "${id}" is not in the marquee_lines table.`,
      });
      continue;
    }
    const measured = aspect === '9:16' ? ml.width_px_tiktok : ml.width_px_instagram;
    const limit = tokens.marquee_lines.padding_px * 2;
    if (measured + limit > tokens.type_scale[aspect === '9:16' ? 'tiktok' : 'instagram'].canvas.width) {
      flags.push({
        slideId: slide.id,
        message: `Marquee "${id}" measured ${measured}px + ${limit}px padding exceeds ${tokens.type_scale[aspect === '9:16' ? 'tiktok' : 'instagram'].canvas.width}px canvas.`,
      });
    }
  }
  return flags;
}
