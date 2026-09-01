// POST /api/foods/custom/extract
//
// Free-text → structured macros. User types something like
// "homemade granola with oats, honey, almonds", we ask an LLM to
// estimate per-100g macros + name/brand/category. The result fills
// the AddCustomFoodModal fields; the user reviews and edits before
// saving.
//
// Model: gpt-4o-mini via OpenAI chat completions with JSON mode.
// Cheap (under $0.001 per call at typical prompt size) and fast
// (sub-second). Falls back to a 502 with the upstream message if the
// model errors or the response can't be parsed as JSON.
//
// Privacy: the description is sent to OpenAI. The modal surfaces
// this in the UI before the user opts in. We don't log descriptions
// server-side; OpenAI's API policy is no-retention by default.

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import type { Database } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface ExtractBody {
  description?: unknown;
}

interface ExtractedFood {
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

const MAX_DESCRIPTION_LEN = 1000;

// Per-user rate limit: 30 requests / 60s. Cheap + fast enough that
// anyone hitting this hard is either malicious or genuinely stuck.
// The map is in-memory so it resets on server restart — fine for a
// soft cap; upgrade to a real rate-limit store if abuse appears.
const RATE_BUCKET = new Map<string, number[]>();
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 30;

function rateLimited(userId: string): boolean {
  const now = Date.now();
  const bucket = (RATE_BUCKET.get(userId) ?? []).filter(
    (t) => now - t < RATE_WINDOW_MS
  );
  if (bucket.length >= RATE_MAX) {
    RATE_BUCKET.set(userId, bucket);
    return true;
  }
  bucket.push(now);
  RATE_BUCKET.set(userId, bucket);
  return false;
}

const SYSTEM_PROMPT = `You're a nutrition expert. Given a free-text description of a single food, return its nutritional information per 100g as JSON.

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

export async function POST(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!supabaseUrl || !supabaseAnon) {
    return NextResponse.json(
      { error: 'Supabase env vars missing.' },
      { status: 503 }
    );
  }
  if (!openaiKey) {
    return NextResponse.json(
      {
        error:
          'LLM extraction is not configured. Set OPENAI_API_KEY in the env.',
      },
      { status: 503 }
    );
  }

  let body: ExtractBody;
  try {
    body = (await req.json()) as ExtractBody;
  } catch {
    return NextResponse.json({ error: 'Body must be JSON.' }, { status: 400 });
  }

  const description = typeof body.description === 'string' ? body.description.trim() : '';
  if (!description) {
    return NextResponse.json(
      { error: 'description is required.' },
      { status: 400 }
    );
  }
  if (description.length > MAX_DESCRIPTION_LEN) {
    return NextResponse.json(
      { error: `description too long (max ${MAX_DESCRIPTION_LEN} chars).` },
      { status: 400 }
    );
  }

  const cookieStore = cookies();
  const ssr = createServerClient<Database>(supabaseUrl, supabaseAnon, {
    cookies: {
      getAll() { return cookieStore.getAll(); },
      setAll(toSet) {
        try {
          toSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // ignored
        }
      },
    },
  });
  const { data: { user } } = await ssr.auth.getUser();
  if (!user?.id) {
    return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
  }
  if (rateLimited(user.id)) {
    return NextResponse.json(
      { error: 'Too many requests. Try again in a minute.' },
      { status: 429 }
    );
  }

  let upstream: Response;
  try {
    upstream = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: description },
        ],
      }),
    });
  } catch (err) {
    console.error('OpenAI fetch failed:', err);
    return NextResponse.json(
      { error: 'Could not reach the extraction service.' },
      { status: 502 }
    );
  }

  if (!upstream.ok) {
    const errBody = await upstream.text().catch(() => '');
    console.error('OpenAI error:', upstream.status, errBody);
    return NextResponse.json(
      {
        error: `Extraction service returned ${upstream.status}. Try again or fill the form manually.`,
      },
      { status: 502 }
    );
  }

  const json = (await upstream.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = json.choices?.[0]?.message?.content;
  if (!content) {
    return NextResponse.json(
      { error: 'Extraction service returned an empty response.' },
      { status: 502 }
    );
  }

  let parsed: ExtractedFood;
  try {
    const raw = JSON.parse(content);
    parsed = sanitize(raw);
  } catch (err) {
    console.error('Could not parse OpenAI response:', err, content);
    return NextResponse.json(
      { error: 'Extraction service returned malformed JSON.' },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true, food: parsed });
}

// Defensive clamping + defaults. The LLM is told to follow these
// ranges but we re-clamp here in case it slipped.
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
    raw.serving_basis === '100ml' ? '100ml' as const : '100g' as const;
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