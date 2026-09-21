// OpenAI-compat adapter. Handles OpenAI, DeepSeek, Mistral, Perplexity
// (and any other provider that exposes /v1/chat/completions with
// the same request/response shape). Provider differences live in
// PROVIDERS — only baseUrl and model id change.
//
// The four providers vary on whether they support response_format
// for JSON-mode. We set it anyway; if the provider ignores it, the
// JSON.parse below fails and the route returns 502.

import { SYSTEM_PROMPT, type ExtractedFood, type LLMConfig } from './types';

const MAX_DESCRIPTION_LEN = 1000;
const REQUEST_TIMEOUT_MS = 30_000;

interface ExtractArgs {
  config: LLMConfig;
  description: string;
  apiKey: string;
}

// Photo path — supply an image instead of (or alongside) the text
// description. The route uploads the photo to Supabase Storage and
// passes the public URL here; OpenAI-compat providers all accept
// `image_url` with a public URL. Any text in `caption` is sent as
// an extra user-content part (used when the route has both an image
// and an OCR'd description it wants to feed alongside).
interface ExtractImageArgs {
  config: LLMConfig;
  apiKey: string;
  /** Public URL of the photo on Supabase Storage. */
  imageUrl: string;
  /** MIME for logging only — the provider fetches the URL itself. */
  mime: 'image/jpeg' | 'image/png' | 'image/webp';
  /** Optional caption (e.g. "OCR'd text below"). Concatenated as a
   *  text part before the image so the model uses it as context. */
  caption?: string;
}

export async function openaiCompatExtract({
  config,
  description,
  apiKey,
}: ExtractArgs): Promise<ExtractedFood> {
  if (description.length > MAX_DESCRIPTION_LEN) {
    throw new Error(`description too long (max ${MAX_DESCRIPTION_LEN} chars).`);
  }
  return callOpenAICompat({
    config,
    apiKey,
    userContent: [{ type: 'text', text: description }],
  });
}

export async function openaiCompatExtractImage({
  config,
  apiKey,
  imageUrl,
  mime,
  caption,
}: ExtractImageArgs): Promise<ExtractedFood> {
  const content: Array<Record<string, unknown>> = [];
  if (caption) content.push({ type: 'text', text: caption });
  content.push({
    type: 'image_url',
    image_url: {
      url: imageUrl,
      // 'auto' lets the provider pick the best tile size based on
      // the image dimensions. 'high' would burn more tokens for the
      // same accuracy on a small nutrition panel.
      detail: 'auto',
    },
  });
  return callOpenAICompat({
    config,
    apiKey,
    userContent: content,
  });
}

// Shared request body / response parsing. Both the text and image
// paths funnel through here so the JSON sanitiser + error
// handling is in one place.
async function callOpenAICompat({
  config,
  apiKey,
  userContent,
}: {
  config: LLMConfig;
  apiKey: string;
  userContent: Array<Record<string, unknown>>;
}): Promise<ExtractedFood> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        [config.authHeader]: `${config.authPrefix}${apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userContent },
        ],
      }),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timeout);
    if ((err as { name?: string }).name === 'AbortError') {
      throw new Error(`${config.name} timed out after ${REQUEST_TIMEOUT_MS}ms.`);
    }
    throw err;
  }
  clearTimeout(timeout);

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(
      `${config.name} returned ${res.status}. ${body.slice(0, 200)}`
    );
  }

  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error(`${config.name} returned no content.`);
  return parseAndSanitize(content);
}

// Defensive clamping + defaults. The model is told to follow these
// ranges but we re-clamp here in case it slips.
function parseAndSanitize(raw: string): ExtractedFood {
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new Error(
      `${err instanceof Error ? err.message : 'JSON parse failed'}: ${raw.slice(0, 200)}`
    );
  }
  return sanitize(parsed);
}

function sanitize(raw: Record<string, unknown>): ExtractedFood {
  const num = (v: unknown, max: number): number => {
    const n = typeof v === 'string' ? Number(v) : (v as number);
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.min(max, n));
  };
  const str = (v: unknown, max: number): string => {
    if (typeof v !== 'string') return '';
    return v.trim().slice(0, max);
  };
  const optStr = (v: unknown, max: number): string | null => {
    if (v === null || v === undefined || v === '') return null;
    return str(v, max);
  };
  const aliases = Array.isArray(raw.aliases)
    ? (raw.aliases as unknown[])
        .filter((x): x is string => typeof x === 'string')
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
        .slice(0, 5)
    : [];
  const serving_basis =
    raw.serving_basis === '100ml' ? ('100ml' as const) : ('100g' as const);
  const confidence: 'high' | 'medium' | 'low' =
    raw.confidence === 'high' || raw.confidence === 'low'
      ? raw.confidence
      : 'medium';

  return {
    name: str(raw.name, 120) || 'Unnamed food',
    brand: optStr(raw.brand, 80),
    category: str(raw.category, 60) || 'Other',
    subcategory: optStr(raw.subcategory, 60),
    kcal: num(raw.kcal, 9999),
    protein: num(raw.protein, 999),
    carbs: num(raw.carbs, 999),
    fat: num(raw.fat, 999),
    fiber: num(raw.fiber, 999),
    serving_basis,
    standard_serving_grams:
      typeof raw.standard_serving_grams === 'number' &&
      raw.standard_serving_grams > 0
        ? Math.min(9999, raw.standard_serving_grams)
        : null,
    standard_serving_label: optStr(raw.standard_serving_label, 40),
    aliases,
    confidence,
    notes: optStr(raw.notes, 280),
  };
}