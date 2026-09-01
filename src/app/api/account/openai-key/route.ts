// GET / POST / DELETE /api/account/openai-key
//
// BYOK (Bring Your Own Key) plumbing for the LLM auto-fill
// feature. The user pastes their OpenAI key here, the server
// stores it on profiles.openai_api_key, and the extract route
// reads it per-request. We never return the key to the client —
// the GET returns just whether it's set + a masked preview, not
// the secret itself.

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Cheap format check. Real validation happens on the first extract
// call — if the key is wrong, OpenAI returns 401 and we surface
// that to the user.
function looksLikeOpenAiKey(s: string): boolean {
  return /^sk-[A-Za-z0-9_-]{20,}$/.test(s);
}

function maskKey(s: string): string {
  if (s.length < 10) return '••••';
  return `${s.slice(0, 7)}${'•'.repeat(Math.min(20, s.length - 11))}${s.slice(-4)}`;
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
    .select('openai_api_key')
    .eq('id', user.id)
    .maybeSingle();

  const key = (data?.openai_api_key as string | null) ?? null;
  return NextResponse.json({
    ok: true,
    set: !!key,
    // Masked preview so the user can confirm which key is stored
    // without exposing the secret.
    masked: key ? maskKey(key) : null,
  });
}

export async function POST(req: NextRequest) {
  const ctx = await authedUser();
  if ('error' in ctx) return ctx.error;
  const { admin, user } = ctx;

  let body: { api_key?: unknown };
  try {
    body = (await req.json()) as { api_key?: unknown };
  } catch {
    return NextResponse.json({ error: 'Body must be JSON.' }, { status: 400 });
  }
  const apiKey = typeof body.api_key === 'string' ? body.api_key.trim() : '';
  if (!apiKey) {
    return NextResponse.json({ error: 'api_key is required.' }, { status: 400 });
  }
  if (!looksLikeOpenAiKey(apiKey)) {
    return NextResponse.json(
      { error: "That doesn't look like an OpenAI key (expected 'sk-...')." },
      { status: 400 }
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin.from('profiles') as any)
    .update({ openai_api_key: apiKey })
    .eq('id', user.id);

  if (error) {
    console.error('openai_api_key update failed:', error);
    return NextResponse.json(
      { error: 'Could not save the key. Try again.' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    masked: maskKey(apiKey),
  });
}

export async function DELETE() {
  const ctx = await authedUser();
  if ('error' in ctx) return ctx.error;
  const { admin, user } = ctx;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin.from('profiles') as any)
    .update({ openai_api_key: null })
    .eq('id', user.id);

  if (error) {
    console.error('openai_api_key clear failed:', error);
    return NextResponse.json(
      { error: 'Could not clear the key. Try again.' },
      { status: 500 }
    );
  }
  return NextResponse.json({ ok: true });
}