// Spoken macro vocabulary → nutrition-label phrasing.
//
// Speech recognition gives us words, but the LLM's food prompt is
// written around nutrition-label language. When someone says "carbs"
// or "per hundred grams", we rewrite it to "carbohydrate" or
// "per 100 g" so the model has the strongest possible signal.
//
// This is deliberately conservative: we only rewrite terms we know
// the LLM will read correctly. Anything we don't recognise passes
// through untouched, because a wrong rewrite is worse than no
// rewrite.
//
// Pure functions only — no DOM, no dependencies.

import { normaliseNumbers } from './numbers';

/**
 * Single-word substitutions. Matched case-insensitively on whole
 * words so we never mangle "carb" inside "carbohydrate" or
 * "grassy" inside "grams".
 */
const WORD_SUBSTITUTIONS: ReadonlyArray<[RegExp, string]> = [
  // Energy
  [/\bcalories\b/gi, 'kcal'],
  [/\bcal\b/gi, 'kcal'],
  [/\benergy\b/gi, 'kcal'],
  [/\bkilocalories\b/gi, 'kcal'],
  [/\bkcalories\b/gi, 'kcal'],

  // Macros
  [/\bcarbs\b/gi, 'carbohydrate'],
  [/\bcarbohydrates\b/gi, 'carbohydrate'],
  [/\bproteins\b/gi, 'protein'],
  [/\bfats\b/gi, 'fat'],
  [/\bfibre\b/gi, 'fiber'],
  [/\bfibres\b/gi, 'fiber'],
  [/\bfiber\b/gi, 'fiber'],
  [/\bsugars\b/gi, 'sugar'],

  // Units
  [/\bgrams\b/gi, 'g'],
  [/\bgram\b/gi, 'g'],
  [/\bgrammes\b/gi, 'g'],
  [/\bgramme\b/gi, 'g'],
  [/\bmilligrams\b/gi, 'mg'],
  [/\bmilligram\b/gi, 'mg'],
  [/\bmillilitres\b/gi, 'ml'],
  [/\bmilliliters\b/gi, 'ml'],
  [/\bml\b/gi, 'ml'],
];

/**
 * Multi-word phrases, applied before the single-word substitutions.
 * Order matters — "per hundred grams" must be rewritten before we
 * get to "grams" → "g".
 */
const PHRASE_SUBSTITUTIONS: ReadonlyArray<[RegExp, string]> = [
  // Basis. The custom-food form is per 100 g (or 100 ml for
  // drinks), so "per hundred grams" needs to become explicit.
  [/\bper\s+(?:hundred|100)\s*(?:grams?|grammes?|g)\b/gi, 'per 100 g'],
  [/\bper\s+(?:hundred|100)\s*(?:millilitres?|milliliters?|ml)\b/gi, 'per 100 ml'],
  [/\bper\s+(?:a\s+)?(?:single|serving|portion)\b/gi, 'per 100 g'],
  [/\bper\s+serving\b/gi, 'per 100 g'],

  // Serving labels people actually say out loud.
  [/\bper\s+(?:cup|tin|can|jar|bottle|bar|slice|scoop|piece)\b/gi, 'per 100 g'],
];

/**
 * Rewrite spoken macro vocabulary into nutrition-label phrasing.
 *
 *   "carbs 20, protein 15, per hundred grams" →
 *   "carbohydrate 20, protein 15, per 100 g"
 *
 * Non-numeric content is never touched.
 */
export function normaliseMacroPhrasing(text: string): string {
  if (!text) return text;

  let out = text;
  for (const [pattern, replacement] of PHRASE_SUBSTITUTIONS) {
    out = out.replace(pattern, replacement);
  }
  for (const [pattern, replacement] of WORD_SUBSTITUTIONS) {
    out = out.replace(pattern, replacement);
  }
  return out;
}

/**
 * Full normalisation for a spoken food description: macro phrasing
 * first, then number words → digits.
 *
 * Order matters: "per hundred grams" becomes "per 100 g" (a phrase
 * rewrite) before "hundred" is turned into a digit, otherwise we'd
 * end up with "per 100 g" via two different routes and "grams" would
 * already have been rewritten to "g".
 */
export function normaliseSpokenDescription(text: string): string {
  return normaliseNumbers(normaliseMacroPhrasing(text));
}
