// POST /api/buddy/resend
//
// Re-sends the buddy invite email. Rate-limited: 1 per 48 hours per
// buddy_purchases row. Updates `last_resent_at` so we can enforce.

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/email';
import { renderBuddyInviteEmail } from '@/email/buddy-invite';
import type { Database } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const RESEND_COOLDOWN_MS = 48 * 60 * 60 * 1000;

export async function POST(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseAnon || !supabaseServiceKey) {
    return NextResponse.json({ error: 'supabase not configured' }, { status: 503 });
  }

  const cookieStore = cookies();
  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnon, {
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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id || !user.email) {
    return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
  }

  const admin = createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: row, error } = await (admin.from('buddy_purchases') as any)
    .select('id, buddy_email, buddy_name, personal_note, status, expires_at, last_resent_at')
    .eq('purchaser_user_id', user.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !row) {
    return NextResponse.json({ error: 'No pending buddy to resend to.' }, { status: 404 });
  }

  if (row.last_resent_at) {
    const last = new Date(row.last_resent_at).getTime();
    if (Date.now() - last < RESEND_COOLDOWN_MS) {
      const hours = Math.ceil((RESEND_COOLDOWN_MS - (Date.now() - last)) / 3600000);
      return NextResponse.json(
        { error: `Please wait ${hours}h before sending another invite.` },
        { status: 429 }
      );
    }
  }

  // Get the buddy's pending activation token.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (admin.from('profiles') as any)
    .select('activation_token, activation_expires_at')
    .eq('email', row.buddy_email)
    .maybeSingle();

  if (!profile?.activation_token) {
    return NextResponse.json(
      { error: 'Activation token missing. Contact support.' },
      { status: 500 }
    );
  }

  const origin = req.nextUrl.origin.replace(/\/$/, '');
  const url = `${origin}/activate/buddy/${profile.activation_token}`;
  const emailContent = renderBuddyInviteEmail({
    buddyName: row.buddy_name,
    purchaserName: user.email.split('@')[0],
    purchaserEmail: user.email,
    personalNote: row.personal_note || '',
    activationUrl: url,
  });

  const result = await sendEmail({
    to: row.buddy_email,
    subject: emailContent.subject,
    html: emailContent.html,
    text: emailContent.text,
    tags: [{ name: 'kind', value: 'buddy-invite-resend' }],
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error || 'Email failed.' }, { status: 500 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin.from('buddy_purchases') as any)
    .update({ last_resent_at: new Date().toISOString() })
    .eq('id', row.id);

  return NextResponse.json({ ok: true });
}
