// POST /api/foods/custom/extract
//
// Free-text → structured macros. The user types a description
// like "homemade granola with oats, honey, almonds"; we ask the
// user's stored LLM (BYOK) to estimate per-100g macros + name /
// brand / category. The result fills the AddCustomFoodModal
// fields; the user reviews and edits before saving.
//
// Provider dispatch (src/lib/llm/extract.ts) routes the call to
// the right adapter based on profiles.llm_provider. OpenAI /
// DeepSeek / MiniMax / Perplexity share an OpenAI-compat adapter
// (different baseUrl + model). Anthropic and Gemini each have
// their own adapter because their request shapes differ.
//
// Privacy: the description is sent to whatever LLM provider the
// user picked. We don't log descriptions server-side. The LLM
// provider's no-retention policy is the user's call to make.

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase';
import { extractMacros, type LLMProvider } from '@/lib/llm/extract';
import { PROVIDERS } from '@/lib/llm/providers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface ExtractBody {
  description?: unknown;
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

export async function POST(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseService = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseAnon || !supabaseService) {
    return NextResponse.json(
      { error: 'Supabase env vars missing.' },
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

  // BYOK: the user supplies their own LLM key. Read both key and
  // provider from profiles.llm_api_key / profiles.llm_provider.
  // Admin client so we can read the sensitive column server-side
  // without exposing it to the browser.
  const admin = createClient<Database>(supabaseUrl, supabaseService, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (admin.from('profiles') as any)
    .select('llm_api_key, llm_provider')
    .eq('id', user.id)
    .maybeSingle();
  const apiKey = (profile?.llm_api_key as string | null) ?? null;
  const provider = (profile?.llm_provider as LLMProvider | null) ?? 'openai';
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "No LLM key on file. Add one in the food panel or via /api/account/llm-key.",
        code: 'no_llm_key',
      },
      { status: 412 }
    );
  }

  try {
    const food = await extractMacros(description, apiKey, provider);
    return NextResponse.json({
      ok: true,
      food,
      provider,
      provider_name: PROVIDERS[provider]?.name ?? provider,
    });
  } catch (err) {
    console.error('LLM extract failed:', err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : 'Extraction service returned an error.',
      },
      { status: 502 }
    );
  }
}