// ground-sequence.ts — no two adjacent slides share a ground.

import type { Post } from '../schema/post.js';

export interface Flag {
  slideId?: string;
  field?: string;
  message: string;
}

export function checkGroundSequence(post: Post): Flag[] {
  const flags: Flag[] = [];
  for (let i = 1; i < post.slides.length; i++) {
    if (post.slides[i].ground === post.slides[i - 1].ground) {
      flags.push({
        slideId: post.slides[i].id,
        message: `Ground "${post.slides[i].ground}" repeats the previous slide's ground. Pick a different one.`,
      });
    }
  }
  return flags;
}
