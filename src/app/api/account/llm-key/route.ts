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

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase';
import {
  ALL_PROVIDERS,
  PROVIDERS,
  detectProvider,
  looksLikeProviderKey,
  type LLMProvider,
} from '@/lib/llm/providers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function maskKey(s: string): string {
  if (s.length < 10) return '••••';
  return `${s.slice(0, 7)}${'•'.repeat(Math.min(20, s.length - 11))}${s.slice(-4)}`;
}

function isProvider(p: unknown): p is LLMProvider {
  return typeof p === 'string' && (ALL_PROVIDERS as string[]).includes(p);
}

async function authedUser() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseService = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseAnon || !supabaseService) {
    return { error: NextResponse.json({ error: 'Supabase env vars missing.' }, { status: 503 }) };
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
    return { error: NextResponse.json({ error: 'Not signed in.' }, { status: 401 }) };
  }
  const admin = createClient<Database>(supabaseUrl, supabaseService, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return { admin, user };
}

export async function GET() {
  const ctx = await authedUser();
  if ('error' in ctx) return ctx.error;
  const { admin, user } = ctx;

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
  const ctx = await authedUser();
  if ('error' in ctx) return ctx.error;
  const { admin, user } = ctx;

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

  // Resolve the provider: explicit override wins, otherwise
  // detect from the key prefix. Default falls back to OpenAI for
  // sk-… keys since that's the most common shape.
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

export async function DELETE() {
  const ctx = await authedUser();
  if ('error' in ctx) return ctx.error;
  const { admin, user } = ctx;

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