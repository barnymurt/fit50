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
// Auth: Bearer-token via Authorization header. Required because
// the app's session lives in localStorage rather than cookies.

import { NextRequest, NextResponse } from 'next/server';
import { authedUserFromRequest } from '@/lib/auth-server';
import { extractMacros, type LLMProvider } from '@/lib/llm/extract';
import { PROVIDERS } from '@/lib/llm/providers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface ExtractBody {
  description?: unknown;
}

const MAX_DESCRIPTION_LEN = 1000;

// Per-user rate limit: 30 requests / 60s.
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
  const auth = await authedUserFromRequest(req);
  if ('error' in auth) return auth.error;
  const { user } = auth.ctx;

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

  if (rateLimited(user.id)) {
    return NextResponse.json(
      { error: 'Too many requests. Try again in a minute.' },
      { status: 429 }
    );
  }

  const { admin } = auth.ctx;

  // BYOK: the user supplies their own LLM key. Read key + provider
  // + (optionally) Anthropic workspace id from profiles.
  // Admin client so we can read the sensitive columns server-side
  // without exposing them to the browser.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (admin.from('profiles') as any)
    .select('llm_api_key, llm_provider, anthropic_workspace_id')
    .eq('id', user.id)
    .maybeSingle();
  const apiKey = (profile?.llm_api_key as string | null) ?? null;
  const provider = (profile?.llm_provider as LLMProvider | null) ?? 'openai';
  const anthropicWorkspaceId =
    (profile?.anthropic_workspace_id as string | null) ?? null;
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
    const food = await extractMacros(description, apiKey, provider, {
      ...(anthropicWorkspaceId ? { anthropicWorkspaceId } : {}),
    });
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