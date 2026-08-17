// POST /api/buddy/redeem
//
// Body: { code, email, password }
// Creates a new account for the gift code recipient. The seat is
// paired with the original purchaser once activated.

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MIN_PASSWORD_LENGTH = 8;

function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

export async function POST(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: 'supabase not configured' }, { status: 503 });
  }

  const body = await req.json().catch(() => ({}));
  const code = typeof body.code === 'string' ? body.code.trim().toUpperCase() : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (!code || code.length > 30) {
    return NextResponse.json({ error: 'Invalid code.' }, { status: 400 });
  }
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: 'Please enter a valid email.' }, { status: 400 });
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json(
      { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` },
      { status: 400 }
    );
  }

  const admin = createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: gift, error } = await (admin.from('gift_codes') as any)
    .select('id, buddy_purchase_id, redeemed_by_user_id, redeemed_at')
    .eq('code', code)
    .maybeSingle();

  if (error || !gift) {
    return NextResponse.json({ error: 'This code is invalid.' }, { status: 400 });
  }

  if (gift.redeemed_by_user_id || gift.redeemed_at) {
    return NextResponse.json({ error: 'This code has already been used.' }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: purchase } = await (admin.from('buddy_purchases') as any)
    .select('purchaser_user_id')
    .eq('id', gift.buddy_purchase_id)
    .maybeSingle();

  const purchaserUserId = purchase?.purchaser_user_id as string | undefined;

  // Create the user.
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createError || !created?.user?.id) {
    console.error('Gift redeem createUser failed:', createError);
    return NextResponse.json(
      { error: 'Could not create account. The email may already be registered.' },
      { status: 500 }
    );
  }

  const userId = created.user.id;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin.from('profiles') as any).upsert(
    {
      id: userId,
      email,
      is_premium: true,
      premium_purchased_at: new Date().toISOString(),
      challenge_started_at: new Date().toISOString().slice(0, 10),
      activation_status: 'active',
      purchased_by_user_id: purchaserUserId,
      buddy_user_id: purchaserUserId,
    },
    { onConflict: 'id' }
  );

  // Pair back to the original purchaser.
  if (purchaserUserId) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin.from('profiles') as any)
      .update({ buddy_user_id: userId })
      .eq('id', purchaserUserId);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin.from('gift_codes') as any)
    .update({ redeemed_by_user_id: userId, redeemed_at: new Date().toISOString() })
    .eq('id', gift.id);

  // Generate a magic link to sign in.
  const { data: link, error: linkError } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: { redirectTo: `${new URL(req.url).origin}/account?activated=1` },
  });

  if (linkError || !link?.properties?.action_link) {
    return NextResponse.json(
      { error: 'Account created. Please sign in to continue.' },
      { status: 200 }
    );
  }

  return NextResponse.json({ ok: true, action_link: link.properties.action_link });
}
