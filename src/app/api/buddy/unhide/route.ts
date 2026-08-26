// POST /api/buddy/unhide
//
// Reverse of /api/buddy/hide. Clears `hidden_at` so the pair shows
// in the carousel again.
//
// Body: { pair_id }
// Response: { ok: true } or { error: string }

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const pairId = typeof body.pair_id === 'string' ? body.pair_id.trim() : '';

  if (!pairId) {
    return NextResponse.json(
      { error: 'pair_id is required.' },
      { status: 400 }
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseAnon || !supabaseServiceKey) {
    const missing: string[] = [];
    if (!supabaseUrl) missing.push('NEXT_PUBLIC_SUPABASE_URL');
    if (!supabaseAnon) missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
    if (!supabaseServiceKey) missing.push('SUPABASE_SERVICE_ROLE_KEY');
    return NextResponse.json(
      {
        error: `Supabase env var${missing.length > 1 ? 's' : ''} missing: ${missing.join(', ')}. Add ${missing.length > 1 ? 'them' : 'it'} in Vercel env vars.`,
      },
      { status: 503 }
    );
  }

  const cookieStore = cookies();
  const ssrClient = createServerClient<Database>(supabaseUrl, supabaseAnon, {
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
  const { data: { user } } = await ssrClient.auth.getUser();
  if (!user?.id) {
    return NextResponse.json(
      { error: 'You must be signed in to unhide a buddy.' },
      { status: 401 }
    );
  }

  const admin = createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin.from('buddy_pairs') as any)
    .update({ hidden_at: null })
    .eq('id', pairId)
    .eq('user_id', user.id);

  if (error) {
    console.error('unhide buddy failed:', error);
    return NextResponse.json(
      { error: 'Could not unhide this buddy. Try again.' },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}