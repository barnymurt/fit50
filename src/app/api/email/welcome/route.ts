// POST /api/email/welcome
//
// Sends the welcome email to a brand-new account. Called from
// AuthContext.signUp() after Supabase auth returns successfully.
// Uses the service-role key to look up the profile + display name
// and send the email. Idempotent enough — sending twice is harmless.
//
// No auth required: the only caller is the sign-up flow, where the
// user has just been created but their session hasn't propagated yet.
// In practice the user_id comes from the sign-up response and is
// safe to trust as a one-shot token.

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/email';
import { renderWelcomeEmail } from '@/email/welcome';
import type { Database } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: 'supabase not configured' }, { status: 503 });
  }

  const body = await req.json().catch(() => ({}));
  const userId = typeof body.user_id === 'string' ? body.user_id : '';

  if (!userId) {
    return NextResponse.json({ error: 'missing user_id' }, { status: 400 });
  }

  const admin = createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (admin.from('profiles') as any)
    .select('email, display_name')
    .eq('id', userId)
    .maybeSingle();

  const email = (profile?.email as string) || '';
  if (!email) {
    return NextResponse.json({ ok: true, skipped: 'no profile email yet' });
  }

  const origin = req.nextUrl.origin.replace(/\/$/, '');
  const signInUrl = `${origin}/account`;
  const rendered = renderWelcomeEmail({
    displayName: (profile?.display_name as string | null) || null,
    email,
    signInUrl,
  });

  const result = await sendEmail({
    to: email,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
    tags: [{ name: 'kind', value: 'welcome' }],
  });

  return NextResponse.json({
    ok: result.ok,
    id: result.id,
    error: result.error,
  });
}
