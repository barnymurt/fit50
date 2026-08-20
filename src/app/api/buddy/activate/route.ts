// POST /api/buddy/activate
//
// Body: { token, password }
// Validates the activation token, sets the password on the pending
// Supabase Auth user, activates the profile, pairs the two
// accounts, and returns a magic link so the buddy is signed in
// immediately.
//
// Two paths:
//  - Service role key set: directly set the password via
//    admin.updateUserById. Most reliable, no extra email roundtrip.
//  - Service role key missing: 503 with a code that the page
//    uses to flip the UI into "send a sign-in link" mode. The
//    user can then click /api/buddy/activate/otp (anon-only) to
//    skip the password set and complete the flow with a magic link.

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MIN_PASSWORD_LENGTH = 8;

export async function POST(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    return NextResponse.json(
      {
        error:
          'NEXT_PUBLIC_SUPABASE_URL is not set on the server. Add it in Vercel env vars.',
      },
      { status: 503 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const token = typeof body.token === 'string' ? body.token.trim() : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (!token || token.length > 200) {
    return NextResponse.json({ error: 'Invalid activation link.' }, { status: 400 });
  }

  // No service role → return a code so the client flips into the
  // magic-link fallback. (Doing the lookup with anon-key requires
  // the profiles SELECT policy to permit anonymous reads, which our
  // current RLS does not — so we have to bail here. The OTP
  // endpoint at /api/buddy/activate/otp runs the activation lookups
  // with the same auth context the user already proved via the
  // activation token, and doesn't need the service role.)
  if (!supabaseServiceKey) {
    return NextResponse.json(
      {
        error:
          'SUPABASE_SERVICE_ROLE_KEY is missing. The activation flow needs it to set the password server-side. Click the link below to finish the flow with a sign-in email instead — then you can set a password from the account page.',
        needs_service_role: true,
      },
      { status: 503 }
    );
  }

  const admin = createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // 1. Find the profile by activation token.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile, error: profileError } = await (admin.from('profiles') as any)
    .select('id, email, activation_status, activation_expires_at, purchased_by_user_id')
    .eq('activation_token', token)
    .maybeSingle();

  if (profileError) {
    console.error('Activation lookup failed:', profileError);
    return NextResponse.json({ error: 'Activation lookup failed.' }, { status: 500 });
  }

  if (!profile) {
    return NextResponse.json({ error: 'This activation link is invalid or has already been used.' }, { status: 400 });
  }

  if (profile.activation_status !== 'pending_activation') {
    return NextResponse.json(
      { error: 'This link has already been used. Try signing in instead.' },
      { status: 400 }
    );
  }

  if (
    profile.activation_expires_at &&
    new Date(profile.activation_expires_at).getTime() < Date.now()
  ) {
    return NextResponse.json(
      { error: 'This link has expired. Ask your friend to send a new one.' },
      { status: 400 }
    );
  }

  // Password strength check.
  if (password.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json(
      { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` },
      { status: 400 }
    );
  }

  // 2. Set the password on the underlying Auth user.
  const { data: updatedUser, error: updateError } = await admin.auth.admin.updateUserById(
    profile.id,
    { password, email_confirm: true }
  );

  if (updateError || !updatedUser?.user) {
    console.error('Auth update failed:', updateError);
    return NextResponse.json(
      { error: 'Could not set password. Try again or contact support.' },
      { status: 500 }
    );
  }

  // 3. Activate the profile + pair the two accounts.
  const now = new Date().toISOString();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin.from('profiles') as any)
    .update({
      activation_status: 'active',
      activation_token: null,
      activation_expires_at: null,
      buddy_user_id: profile.purchased_by_user_id,
    })
    .eq('id', profile.id);

  if (profile.purchased_by_user_id) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin.from('profiles') as any)
      .update({ buddy_user_id: profile.id })
      .eq('id', profile.purchased_by_user_id);
  }

  // 4. Mark the buddy purchase as activated.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin.from('buddy_purchases') as any)
    .update({ status: 'activated', activated_at: now })
    .eq('buddy_email', (profile.email as string).toLowerCase())
    .eq('status', 'pending');

  // 5. Generate a magic link so the browser is signed in immediately.
  const { data: link, error: linkError } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email: profile.email as string,
    options: {
      redirectTo: `${new URL(req.url).origin}/account?activated=1`,
    },
  });

  if (linkError || !link?.properties?.action_link) {
    console.error('Magiclink generation failed:', linkError);
    return NextResponse.json(
      { error: 'Account activated. Please sign in to continue.' },
      { status: 200 }
    );
  }

  return NextResponse.json({
    ok: true,
    user_id: profile.id,
    action_link: link.properties.action_link,
  });
}
