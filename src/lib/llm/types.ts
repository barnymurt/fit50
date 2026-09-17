// Shared types + the system prompt for LLM auto-fill. All providers
// use the same prompt + same JSON output schema, so a swap of base
// URL / auth header is all that's needed for the OpenAI-compat
// providers. Anthropic and Gemini have their own adapters.

export type LLMProvider =
  | 'openai'
  | 'anthropic'
  | 'gemini'
  | 'deepseek'
  | 'minimax'
  | 'perplexity';

export interface LLMConfig {
  /** Display name for the UI. */
  name: string;
  /** Per-provider base URL. Adapter concatenates the right path. */
  baseUrl: string;
  /** Low-cost / fast model id. */
  model: string;
  /** HTTP header name carrying the API key. '' uses a query param. */
  authHeader: string;
  /** Prefix in front of the key in the header (e.g. 'Bearer '). '' for none. */
  authPrefix: string;
  /** Provider identifier used in the validation / storage layer. */
  id: LLMProvider;
  /** Per-call extra headers (e.g. `anthropic-workspace-id` for
   *  identity-linked Anthropic keys). Adapters merge these into
   *  the request alongside auth + content-type. */
  extraHeaders?: Record<string, string>;
}

export const SYSTEM_PROMPT = `You're a nutrition expert. Given a free-text description of a single food, return its nutritional information per 100g as JSON.

Return:
{
  "name": string,                    // display name, e.g. "Homemade granola"
  "brand": string | null,           // brand if mentioned, else null
  "category": string,               // one of: "Other", "Meat & Poultry", "Fish & Seafood", "Eggs", "Dairy", "Milk & Milk Alternatives", "Grains", "Bread & Bakery", "Pasta & Noodles", "Rice & Rice Dishes", "Legumes & Beans", "Vegetables", "Fruits", "Nuts & Seeds", "Oils & Fats", "Condiments & Sauces", "Snacks", "Sweets & Desserts", "Breakfast Foods", "Ready Meals", "Soups", "Salads", "Sandwiches & Wraps", "Pizza & Fast Food", "Beverages", "Protein Foods"
  "subcategory": string | null,     // optional, e.g. "Cookies" or "Smoothies"
  "kcal": number,                   // kcal per 100g (or per 100ml for beverages)
  "protein": number,                // grams per 100g
  "carbs": number,                  // grams per 100g
  "fat": number,                    // grams per 100g
  "fiber": number,                  // grams per 100g
  "serving_basis": "100g" | "100ml",
  "standard_serving_grams": number | null,
  "standard_serving_label": string | null,
  "aliases": string[],              // 2-5 alternative names / search terms
  "confidence": "high" | "medium" | "low",
  "notes": string | null            // one short sentence flagging assumptions, e.g. "Estimate assumes standard recipe"
}

Rules:
- Macros are per the unit in serving_basis. For most foods that's 100g; for beverages / liquids 100ml.
- kcal from macros should roughly equal protein*4 + carbs*4 + fat*9. Allow ±15%.
- kcal clamped 0-999. Macros each clamped 0-999.
- standard_serving_grams: pick a sensible typical portion (e.g. 50 for a cookie, 30 for cheese, 250 for soup). null if you genuinely don't know.
- If the description is too vague to estimate (e.g. "some food"), set confidence="low" and notes explains why.
- Output ONLY the JSON object — no prose, no markdown, no preamble.`;

export interface ExtractedFood {
  name: string;
  brand: string | null;
  category: string;
  subcategory: string | null;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  serving_basis: '100g' | '100ml';
  standard_serving_grams: number | null;
  standard_serving_label: string | null;
  aliases: string[];
  confidence: 'high' | 'medium' | 'low';
  notes: string | null;
}

// Per-provider capability flag — used by the photo route to pick
// between "send the image bytes directly" (vision-capable) and
// "OCR the image first, then send the text" (text-only providers).
// Keep this list in lock-step with the actual provider config in
// providers.ts — add a provider here means its model must accept
// image inputs.
export const VISION_CAPABLE_PROVIDERS: ReadonlySet<LLMProvider> = new Set([
  'openai', // gpt-4o-mini supports image_url content parts
  'anthropic', // claude-3-5-haiku accepts image source blocks
  'gemini', // gemini-1.5-flash accepts inline_data parts
]);

// HF-hosted OCR — used as the vision fallback for non-vision-capable
// providers (deepseek, MiniMax, perplexity) and as a safety net when
// the user's own vision-capable key is missing. GOT-OCR-2.0 reads
// Western + Chinese + Korean text out of the box and handles dense
// nutrition panels well.
export type HFOCRProvider = 'hf-got-ocr-2';

// Result of an OCR pass — raw text + which OCR backend produced it.
// The photo route forwards `text` into the existing extractMacros()
// text path so both vision-direct and OCR+vision pipelines share
// the same JSON sanitiser.
export interface OCRResult {
  text: string;
  provider: HFOCRProvider;
}