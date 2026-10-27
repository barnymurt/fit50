// Spoken number words → digits.
//
// Speech recognition transcribes *words*, not numbers. When someone
// says "one hundred and twenty calories", the browser hands us the
// string "one hundred and twenty calories" — not "120 calories".
// Dumping that straight into the LLM gives us fuzzy guesses, so we
// normalise the number words to digits first. The LLM then reads
// "greek yogurt, 120 kcal, 15 g protein" and parses it
// deterministically.
//
// Pure functions only — no DOM, no dependencies. Easy to unit test.

// Units, tens, and the teens. Anything the recogniser commonly
// emits for a spoken digit.
const UNITS: Record<string, number> = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
};

const TENS: Record<string, number> = {
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
};

const SCALES: Record<string, number> = {
  hundred: 100,
  thousand: 1000,
  million: 1000000,
};

// Every word we know how to turn into a number.
const NUMBER_WORDS = new Set([
  ...Object.keys(UNITS),
  ...Object.keys(TENS),
  ...Object.keys(SCALES),
]);

// Matches a run of spoken number words, separated by whitespace,
// hyphens, or "and". Greedy but bounded so it can't eat the rest of
// a sentence:
//
//   "one hundred and twenty"  → matches
//   "twenty five"             → matches
//
// The word boundaries are what stop "someone" from matching "one" —
// we only ever match whole number words.
//
// NOTE: this is built with `new RegExp` + a string, so the escapes
// are doubled: `\\b` in the *string* is the `\b` word-boundary the
// regex engine wants. A single `\b` here would produce a literal
// backslash-b and the pattern would never match anything.
const NUMBER_WORD =
  '(?:zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|' +
  'thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|' +
  'thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand|million)';

// "point" joins a whole number to its fraction: "twelve point five".
const DECIMAL_POINT = '(?:point)';

const NUMBER_PHRASE = new RegExp(
  `\\b${NUMBER_WORD}(?:[\\s-]+(?:and[\\s-]+)?${NUMBER_WORD})*` +
    `(?:[\\s-]+${DECIMAL_POINT}[\\s-]+${NUMBER_WORD})?\\b`,
  'gi'
);

/**
 * Convert a single spoken number phrase into a number.
 * Returns null when the phrase isn't a number we can read.
 *
 * Handles:
 *   "twenty five"           → 25
 *   "twenty-five"           → 25
 *   "one hundred and twenty"→ 120
 *   "one hundred twenty"    → 120
 *   "two point five"        → 2.5
 *   "zero"                  → 0
 */
export function wordsToNumber(phrase: string): number | null {
  const cleaned = phrase
    .toLowerCase()
    .replace(/[.,!?]/g, '')
    .replace(/[\s-]+/g, ' ')
    .trim();

  if (!cleaned) return null;

  // Decimal: "two point five" → 2.5
  const parts = cleaned.split(' point ');
  if (parts.length === 2) {
    const whole = wordsToNumber(parts[0]);
    const frac = wordsToNumber(parts[1]);
    if (whole === null || frac === null) return null;
    // "two point five" is 2.5, not 2.05. The fractional part is
    // read as a decimal fraction of the whole, so we keep only the
    // digits of the fraction (5 → .5, 25 → .25).
    const fracStr = String(frac);
    return Number(`${whole}.${fracStr}`);
  }

  // "and" is a filler between number words: "one hundred and twenty".
  const words = cleaned
    .split(' ')
    .filter((w) => w !== 'and')
    .filter((w) => w.length > 0);

  if (words.length === 0) return null;

  let total = 0;
  let current = 0;
  let sawNumber = false;

  for (const word of words) {
    if (word in UNITS) {
      current += UNITS[word];
      sawNumber = true;
    } else if (word in TENS) {
      current += TENS[word];
      sawNumber = true;
    } else if (word in SCALES) {
      const scale = SCALES[word];
      if (scale === 100) {
        // "hundred" applies to what we've accumulated so far.
        // "two hundred" → 200, not 20.
        current = (current === 0 ? 1 : current) * scale;
      } else {
        // "thousand" / "million" apply to the whole accumulated
        // total: "three thousand" → 3000.
        total += (current === 0 ? 1 : current) * scale;
        current = 0;
      }
      sawNumber = true;
    } else {
      // Not a number word — bail out rather than guess.
      return null;
    }
  }

  if (!sawNumber) return null;
  return total + current;
}

/**
 * Replace every spoken number phrase in `text` with its digits.
 *
 *   "greek yogurt one hundred and twenty calories" →
 *   "greek yogurt 120 calories"
 *
 * Non-numeric words are left exactly as they were — "someone" stays
 * "someone" because we only ever match whole number words.
 *
 * Idempotent: normalising an already-normalised string is a no-op,
 * because the digits aren't number words.
 */
export function normaliseNumbers(text: string): string {
  if (!text) return text;

  return text.replace(NUMBER_PHRASE, (match) => {
    const value = wordsToNumber(match);
    if (value === null) return match;
    return String(value);
  });
}

/**
 * True when the text contains at least one spoken number word.
 * Used to decide whether a transcript is worth auto-submitting.
 *
 * NOTE: `NUMBER_PHRASE` carries the `g` flag, which makes `.test()`
 * stateful — it advances `lastIndex` between calls, so calling this
 * twice on the same string can return different answers. We use a
 * separate non-global regex to keep this a pure predicate.
 */
const NUMBER_PROBE = new RegExp(NUMBER_PHRASE.source, 'i');

export function hasSpokenNumber(text: string): boolean {
  return NUMBER_PROBE.test(text);
}

// Exposed for tests + callers that want to know the vocabulary.
export const SPOKEN_NUMBER_WORDS: ReadonlySet<string> = NUMBER_WORDS;
