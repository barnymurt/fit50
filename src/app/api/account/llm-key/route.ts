// GET / POST / DELETE /api/account/llm-key
//
// BYOK (Bring Your Own Key) plumbing for the LLM auto-fill
// feature. The user pastes their provider's key here, the server
// stores it on profiles.llm_api_key + profiles.llm_provider, and
// the extract route reads both per request. We never return the
// secret to the client — GET returns just whether it's set + a
// masked preview + the provider name.
//
// Provider detection: the key prefix determines the default
// provider (sk-ant-… → Anthropic, AIza… → Gemini, pplx-… →
// Perplexity, sk-… → OpenAI). The user can override via the
// `provider` field on POST. The detected (or overridden) provider
// is what gets stored.
//
// Auth: Bearer-token via Authorization header (see src/lib/auth-
// server.ts). Required because the app's session lives in
// localStorage rather than cookies, which server-side helpers can't
// see.

import { NextRequest, NextResponse } from 'next/server';
import {
  ALL_PROVIDERS,
  PROVIDERS,
  detectProvider,
  looksLikeProviderKey,
  type LLMProvider,
} from '@/lib/llm/providers';
import { authedUserFromRequest } from '@/lib/auth-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function maskKey(s: string): string {
  if (s.length < 10) return '••••';
  return `${s.slice(0, 7)}${'•'.repeat(Math.min(20, s.length - 11))}${s.slice(-4)}`;
}

function isProvider(p: unknown): p is LLMProvider {
  return typeof p === 'string' && (ALL_PROVIDERS as string[]).includes(p);
}

export async function GET(req: NextRequest) {
  const auth = await authedUserFromRequest(req);
  if ('error' in auth) return auth.error;
  const { admin, user } = auth.ctx;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (admin.from('profiles') as any)
    .select('llm_api_key, llm_provider')
    .eq('id', user.id)
    .maybeSingle();

  const key = (data?.llm_api_key as string | null) ?? null;
  const provider = (data?.llm_provider as LLMProvider | null) ?? null;
  return NextResponse.json({
    ok: true,
    set: !!key,
    // Masked preview so the user can confirm which key is stored
    // without exposing the secret.
    masked: key ? maskKey(key) : null,
    provider: provider ?? null,
    provider_name: provider ? PROVIDERS[provider]?.name ?? provider : null,
  });
}

export async function POST(req: NextRequest) {
  const auth = await authedUserFromRequest(req);
  if ('error' in auth) return auth.error;
  const { admin, user } = auth.ctx;

  let body: { api_key?: unknown; provider?: unknown };
  try {
    body = (await req.json()) as { api_key?: unknown; provider?: unknown };
  } catch {
    return NextResponse.json({ error: 'Body must be JSON.' }, { status: 400 });
  }
  const apiKey = typeof body.api_key === 'string' ? body.api_key.trim() : '';
  if (!apiKey) {
    return NextResponse.json({ error: 'api_key is required.' }, { status: 400 });
  }

  // Resolve the provider: explicit override wins, otherwise detect
  // from the key prefix. Default falls back to OpenAI for sk-… keys
  // since that's the most common shape.
  const explicit = isProvider(body.provider) ? body.provider : null;
  const provider: LLMProvider = explicit ?? detectProvider(apiKey);

  if (!looksLikeProviderKey(provider, apiKey)) {
    return NextResponse.json(
      {
        error: `That key doesn't match the shape expected by ${PROVIDERS[provider].name} (sk-… / sk-ant-… / AIza… / pplx-…). Pick a different provider or check the key.`,
      },
      { status: 400 }
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin.from('profiles') as any)
    .update({ llm_api_key: apiKey, llm_provider: provider })
    .eq('id', user.id);

  if (error) {
    console.error('llm_api_key update failed:', error);
    return NextResponse.json(
      { error: 'Could not save the key. Try again.' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    masked: maskKey(apiKey),
    provider,
    provider_name: PROVIDERS[provider].name,
  });
}

export async function DELETE(req: NextRequest) {
  const auth = await authedUserFromRequest(req);
  if ('error' in auth) return auth.error;
  const { admin, user } = auth.ctx;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin.from('profiles') as any)
    .update({ llm_api_key: null, llm_provider: 'openai' })
    .eq('id', user.id);

  if (error) {
    console.error('llm_api_key clear failed:', error);
    return NextResponse.json(
      { error: 'Could not clear the key. Try again.' },
      { status: 500 }
    );
  }
  return NextResponse.json({ ok: true });
}