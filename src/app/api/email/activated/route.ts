// POST /api/email/activated
//
// Sends the activated-welcome email to a user who just activated
// their account through the buddy-pair flow. Different copy than
// the regular signup welcome — their account exists because
// someone paid for it, not because they signed up directly.

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/email';
import { renderActivatedEmail } from '@/email/welcome';
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
    .select('email, display_name, purchased_by_user_id')
    .eq('id', userId)
    .maybeSingle();

  const email = (profile?.email as string) || '';
  if (!email) {
    return NextResponse.json({ ok: true, skipped: 'no profile email yet' });
  }

  // Look up the purchaser so we can greet the buddy by name.
  let purchaserName = 'A friend';
  const purchaserId = profile?.purchased_by_user_id as string | undefined;
  if (purchaserId) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: purchaser } = await (admin.from('profiles') as any)
      .select('display_name, email')
      .eq('id', purchaserId)
      .maybeSingle();
    if (purchaser?.display_name) {
      purchaserName = purchaser.display_name as string;
    } else if (purchaser?.email) {
      purchaserName = (purchaser.email as string).split('@')[0];
    }
  }

  const origin = req.nextUrl.origin.replace(/\/$/, '');
  const accountUrl = `${origin}/account`;
  const rendered = renderActivatedEmail({
    displayName: (profile?.display_name as string | null) || null,
    email,
    purchaserName,
    accountUrl,
  });

  const result = await sendEmail({
    to: email,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
    tags: [{ name: 'kind', value: 'activated' }],
  });

  return NextResponse.json({
    ok: result.ok,
    id: result.id,
    error: result.error,
  });
}
