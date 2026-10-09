// index.ts — run every check on a post, return the combined
// flag list. The renderer's pre-draw hook and the editor's
// "validate" button both go through this.

import type { Post } from '../schema/post.js';
import { loadLint, type Tokens } from '../tokens.js';
import { checkGroundSequence } from './ground-sequence.js';
import { checkTextColour } from './text-colour.js';
import { checkCoralOnce } from './coral-once.js';
import { checkMarqueeFit } from './marquee-fit.js';
import { checkFitLengths, checkOneWordLastLine } from './fit.js';

export type { Flag } from './ground-sequence.js';
export {
  checkGroundSequence,
  checkTextColour,
  checkCoralOnce,
  checkMarqueeFit,
  checkFitLengths,
  checkOneWordLastLine,
};

export async function runAllChecks(post: Post, tokens: Tokens) {
  const lint = await loadLint();
  const flags = [
    ...checkGroundSequence(post),
    ...checkTextColour(post, tokens),
    ...checkCoralOnce(post),
    ...checkMarqueeFit(post, tokens),
    ...checkFitLengths(post, lint),
    ...checkOneWordLastLine(post),
  ];
  return flags;
}
