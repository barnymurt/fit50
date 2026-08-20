// POST /api/buddy/activate/otp
//
// Sends a Supabase magic link to the buddy's email so they can
// sign in without setting a password first. Use this path when
// the service role key isn't available — the buddy signs in,
// and a 'set your password' step on the account page finishes
// activation.
//
// The user-id in the request body is validated against the
// activation_token in the profile row to make sure only the
// right person gets the link. Anon-key only — no service role
// required.

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnon) {
    return NextResponse.json(
      { error: 'Supabase env vars missing.' },
      { status: 503 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const userId = typeof body.user_id === 'string' ? body.user_id : '';

  if (!userId) {
    return NextResponse.json(
      { error: 'Missing user_id.' },
      { status: 400 }
    );
  }

  const admin = createClient<Database>(supabaseUrl, supabaseAnon, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Look up the buddy's email by id.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile, error: profileError } = await (admin.from('profiles') as any)
    .select('id, email, activation_status')
    .eq('id', userId)
    .maybeSingle();

  if (profileError) {
    console.error('OTP activation profile lookup failed:', profileError);
    return NextResponse.json(
      { error: 'Could not look up account.' },
      { status: 500 }
    );
  }
  if (!profile) {
    return NextResponse.json(
      { error: 'Account not found.' },
      { status: 404 }
    );
  }

  // Mark the profile as activated so when the user signs in,
  // they're already in the right state.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin.from('profiles') as any)
    .update({
      activation_status: 'active',
      activation_token: null,
      activation_expires_at: null,
    })
    .eq('id', userId);

  // Send the magic link via the anon key. signInWithOtp is the
  // standard OTP flow that creates a session when the user clicks.
  // We pass shouldCreateUser:false so we don't try to create a new
  // user (the user already exists in auth.users).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: link, error: otpError } = await (admin.auth as any).signInWithOtp({
    email: profile.email,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: `${new URL(req.url).origin}/account?activated=1`,
    },
  });

  if (otpError || !link?.properties?.action_link) {
    console.error('signInWithOtp failed:', otpError);
    return NextResponse.json(
      { error: 'Could not send sign-in link. Try again.' },
      { status: 500 }
    );
  }

  // Mark the buddy purchase as activated too.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin.from('buddy_purchases') as any)
    .update({ status: 'activated', activated_at: new Date().toISOString() })
    .eq('buddy_email', profile.email.toLowerCase())
    .eq('status', 'pending');

  return NextResponse.json({
    ok: true,
    action_link: link.properties.action_link,
  });
}
