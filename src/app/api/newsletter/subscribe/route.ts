import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase';

export const runtime = 'nodejs';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  const email = typeof (body as { email?: unknown })?.email === 'string'
    ? (body as { email: string }).email.trim().toLowerCase()
    : '';

  if (!email || !EMAIL_RE.test(email) || email.length > 254) {
    return NextResponse.json({ error: 'invalid email' }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ error: 'service unavailable' }, { status: 503 });
  }

  const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

  // The Supabase JS client's strict generic types don't always line up
  // with our Database['Insert'] shape. Cast through unknown to get the
  // payload we want without fighting the type system (matches the
  // pattern in src/app/api/stripe/webhook/route.ts).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase
    .from('newsletter_subscribers') as any)
    .insert({ email });

  if (error && error.code !== '23505') {
    return NextResponse.json({ error: 'subscribe failed' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}