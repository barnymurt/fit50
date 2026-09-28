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
  | 'perplexity'
  | 'groq';

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

// Shared output schema and clamping rules. Used by both the typed
// description prompt and the photo-of-label prompt so the route
// doesn't have to re-shape.
const LABEL_SCHEMA_BLOCK = `
Return ONLY this JSON object — no prose, no markdown, no preamble:
{
  "name": string,                    // display name, e.g. "Homemade granola" or "Backer's Chocolate Digestives"
  "brand": string | null,           // brand if shown, else null. Strip "by " if the label says "X by Y"
  "category": string,               // one of: "Other", "Meat & Poultry", "Fish & Seafood", "Eggs", "Dairy", "Milk & Milk Alternatives", "Grains", "Bread & Bakery", "Pasta & Noodles", "Rice & Rice Dishes", "Legumes & Beans", "Vegetables", "Fruits", "Nuts & Seeds", "Oils & Fats", "Condiments & Sauces", "Snacks", "Sweets & Desserts", "Breakfast Foods", "Ready Meals", "Soups", "Salads", "Sandwiches & Wraps", "Pizza & Fast Food", "Beverages", "Protein Foods"
  "subcategory": string | null,     // optional, e.g. "Cookies" or "Smoothies"
  "kcal": number,                   // kcal per the unit in serving_basis (100g for solids, 100ml for beverages)
  "protein": number,                // grams per the unit in serving_basis
  "carbs": number,                  // grams per the unit in serving_basis
  "fat": number,                    // grams per the unit in serving_basis
  "fiber": number,                  // grams per the unit in serving_basis
  "serving_basis": "100g" | "100ml",
  "standard_serving_grams": number | null,  // typical portion a person eats, e.g. 30 for a biscuit, 250 for a soup
  "standard_serving_label": string | null, // human-readable display, e.g. "1 biscuit", "1 scoop", "1 bar", or null
  "aliases": string[],              // 2-5 alternative names / search terms (lowercase, no brand)
  "confidence": "high" | "medium" | "low",
  "notes": string | null            // one short sentence flagging assumptions, e.g. "Estimate assumes standard recipe"
}

Clamping rules:
- kcal and each macro must be clamped to 0–999.
- kcal ≈ protein*4 + carbs*4 + fat*9, allowing ±15% slack.
- If you cannot give a reasonable estimate, set confidence="low" and have notes explain why.`;

export const SYSTEM_PROMPT = `You're a nutrition expert. Given a free-text description of a single food, return its nutritional information per 100g as JSON.

${LABEL_SCHEMA_BLOCK}`;

// Specialist prompt used by the photo path and any path whose
// input is a nutrition label image (or its OCR transcript).
// Teaches the model how nutrition panels are laid out so it can
// pick the right values when a label shows both per-100g AND
// per-serving, when energy is in kJ, when the label is in
// French / Spanish / Portuguese, etc.
export const LABEL_SYSTEM_PROMPT = `You read nutrition labels on food packaging. A photo of the label (or its OCR text) is below. Return the product's nutritional information per 100g (or per 100ml for beverages) as JSON.

How a nutrition label is typically laid out:
- Header: product name, brand, sometimes "by [maker]" pattern.
- Nutrition table: rows are nutrients, columns are usually
  "per 100g / per 100ml" AND "per serving" / "per portion" / "per [unit]".
  Some labels also show "% RI" (Reference Intake) — ignore that
  column, it's a percentage for daily allowance.
- Common row order (EU/UK): Energy, Fat, of which saturates,
  Carbohydrate, of which sugars, Protein, Salt.
- Common row order (US): Calories, Calories from fat, Total Fat,
  Saturated Fat, Trans Fat, Cholesterol, Sodium, Total
  Carbohydrate, Dietary Fiber, Total Sugars, Added Sugars,
  Protein, Vitamin D, Calcium, Iron, Potassium.

Units and conversions:
- Energy is often in kJ (kilojoules). 1 kcal = 4.184 kJ, so divide
  kJ by 4.184 to get kcal. If both kcal and kJ are printed, prefer
  the kcal figure. If only kJ is present, convert it.
- Volume units (100ml) only for liquids. If the product is a
  powder, soup, or other rehydrated form, treat it as solids
  per 100g unless the label explicitly uses 100ml.
- "Sugars" is a subset of carbohydrate, not additional. Just
  record total carbohydrate.

Multi-language labels:
- "Énergie" / "Energia" / "Energie" = Energy.
- "Matières grasses" / "Grasas" / "Lipides" / "Gordura" = Fat.
- "Glucides" / "Hidratos de carbono" / "Carbohydrates" =
  Carbohydrate.
- "Protéines" / "Proteínas" = Protein.
- "Fibres" / "Fibra" = Fiber (often labelled "Fibres alimentaires"
  / "Fibra alimentaria").
- "Sel" / "Sal" = Salt.

Reading values:
- ALWAYS read the per-100g / per-100ml column. Never use the
  per-serving values for kcal/protein/carbs/fat/fiber — those go
  in standard_serving_grams and standard_serving_label instead.
- If the label only has per-100g (no per-serving column), set
  standard_serving_grams to a sensible typical portion for that
  food type (e.g. 30 for a biscuit, 250 for soup, 50 for cheese,
  60 for bread). Use standard_serving_label like "1 piece", "1
  biscuit", "1 slice", "1 scoop" when the panel implies a unit.
- If only per-serving is printed and per-100g is implied by
  dividing, prefer the implied per-100g figure but record both
  the serving weight in standard_serving_grams and the label in
  standard_serving_label.
- "0" or blank cells mean zero of that nutrient — record 0.
- If a value is partially obscured by glare, fold or shadow,
  flag confidence="medium" or "low" and have notes explain what
  you guessed at. Don't invent numbers.

Confidence:
- "high": label is in-focus, all nutrients legible, in English
  (or you read the language above).
- "medium": one or two values are hard to read but you can take
  a confident guess.
- "low": the photo is too blurry / too dark / too angled to
  read reliably. Still return your best read but flag it.

${LABEL_SCHEMA_BLOCK}`;

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
  'perplexity', // sonar accepts image URLs as remote_file inputs
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