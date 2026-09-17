// Anthropic Claude adapter. Uses the Messages API:
// POST /v1/messages with { model, system, messages, max_tokens }.
// Response: { content: [{ type: 'text', text }], ... }.
//
// We rely on the system prompt (and the model's instruction-following)
// to constrain output to JSON, since Claude doesn't expose an
// OpenAI-style response_format=json_object. Most recent Claude
// models (3.5+) comply reliably; we JSON.parse the text and surface
// a clear error if the model added prose.

import { SYSTEM_PROMPT, type ExtractedFood, type LLMConfig } from './types';

const MAX_DESCRIPTION_LEN = 1000;
const REQUEST_TIMEOUT_MS = 30_000;
const MAX_TOKENS = 1024;

interface ExtractArgs {
  config: LLMConfig;
  description: string;
  apiKey: string;
}

// Photo path — supply an image instead of (or alongside) text.
// Anthropic vision: image goes in `messages[].content` as a
// `{type: 'image', source: {type: 'base64', media_type, data}}`
// block; text goes alongside as `{type: 'text', text}`. The model
// sees both blocks together.
interface ExtractImageArgs {
  config: LLMConfig;
  apiKey: string;
  imageBytes: Uint8Array;
  mime: 'image/jpeg' | 'image/png' | 'image/webp';
  caption?: string;
}

export async function anthropicExtract({
  config,
  description,
  apiKey,
}: ExtractArgs): Promise<ExtractedFood> {
  if (description.length > MAX_DESCRIPTION_LEN) {
    throw new Error(`description too long (max ${MAX_DESCRIPTION_LEN} chars).`);
  }
  return callAnthropic({
    config,
    apiKey,
    userContent: [{ type: 'text', text: description }],
  });
}

export async function anthropicExtractImage({
  config,
  apiKey,
  imageBytes,
  mime,
  caption,
}: ExtractImageArgs): Promise<ExtractedFood> {
  const content: Array<Record<string, unknown>> = [];
  if (caption) content.push({ type: 'text', text: caption });
  content.push({
    type: 'image',
    source: {
      type: 'base64',
      media_type: mime,
      data: bytesToBase64(imageBytes),
    },
  });
  return callAnthropic({
    config,
    apiKey,
    userContent: content,
  });
}

async function callAnthropic({
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
    res = await fetch(`${config.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
        ...(config.extraHeaders ?? {}),
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens: MAX_TOKENS,
        temperature: 0.2,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userContent }],
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
    content?: Array<{ type?: string; text?: string }>;
  };
  const text = json.content
    ?.filter((c) => c.type === 'text')
    .map((c) => c.text ?? '')
    .join('');
  if (!text) throw new Error(`${config.name} returned no text content.`);
  return parseAndSanitize(text);
}

function bytesToBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('base64');
  }
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

function parseAndSanitize(raw: string): ExtractedFood {
  let parsed: Record<string, unknown>;
  // Claude sometimes wraps the JSON in ```json fences. Strip them.
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    throw new Error(
      `${err instanceof Error ? err.message : 'JSON parse failed'}: ${cleaned.slice(0, 200)}`
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