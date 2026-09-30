// Cron handler: /api/cron/buddy-expiring-soon
//
// Daily Vercel Cron call. Emails the giftee at the **midpoint** of
// the 14-day activation window (~7 days from expiry) — the "you've
// still got time, but not loads" nudge. The existing
// /api/cron/buddy-expiry cron handles day 14 (gift-code fallback +
// gift-code email to the purchaser).
//
// To avoid spamming when the daily cron matches the same purchase
// for several days in a row, we use the mid_reminder_sent_at column
// (added in migration 0041) as a one-shot flag. The cron only sends
// when mid_reminder_sent_at IS NULL AND expires_at is in the 6-8 day
// window; after sending, it stamps the column so subsequent daily
// runs skip the same purchase.
//
// Auth: same shared secret pattern as the existing /api/cron/buddy-expiry.

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/email';
import { renderBuddyExpiringSoonEmail } from '@/email/buddy-expiring-soon';
import type { Database } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CRON_SECRET = process.env.CRON_SECRET || process.env.BUDDY_CRON_SECRET;

function authOk(req: NextRequest): boolean {
  if (!CRON_SECRET) return false;
  const url = new URL(req.url);
  const qs = url.searchParams.get('secret');
  if (qs && qs === CRON_SECRET) return true;
  const header = req.headers.get('authorization') || '';
  if (header === `Bearer ${CRON_SECRET}`) return true;
  return false;
}

interface BuddyToNudge {
  id: string;
  buddy_email: string;
  buddy_name: string;
  expires_at: string;
  purchaser_user_id: string;
}

export async function GET(req: NextRequest) {
  if (!authOk(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json(
      {
        error: `Supabase env var${
          !supabaseUrl && !supabaseServiceKey ? 's' : ''
        } missing.`,
      },
      { status: 503 }
    );
  }

  const admin = createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Find pending (not-yet-activated) giftees at the midpoint of the
  // 14-day activation window — 7 days from expiry. The window is
  // 6-8 days (144-192h) so the daily cron reliably hits each row on
  // at least one run; the `mid_reminder_sent_at IS NULL` gate
  // ensures we only send once.
  const now = new Date();
  const lower = new Date(now.getTime() + 144 * 60 * 60 * 1000).toISOString();
  const upper = new Date(now.getTime() + 192 * 60 * 60 * 1000).toISOString();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: expiring, error } = await (admin.from('buddy_purchases') as any)
    .select('id, purchaser_user_id, buddy_email, buddy_name, expires_at')
    .eq('status', 'pending')
    .is('mid_reminder_sent_at', null)
    .gte('expires_at', lower)
    .lte('expires_at', upper)
    .limit(50);

  if (error) {
    console.error('buddy-expiring-soon fetch failed:', error);
    return NextResponse.json({ error: 'fetch failed' }, { status: 500 });
  }

  const purchases: BuddyToNudge[] = expiring || [];
  const results: Array<{ id: string; ok: boolean; error?: string }> = [];

  for (const p of purchases) {
    try {
      // Look up the purchaser's name (purchaser_user_id is the buyer's
      // profile id). Falls back to email local-part if no display name.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: purchaser } = await (admin.from('profiles') as any)
        .select('display_name, email')
        .eq('id', p.purchaser_user_id)
        .maybeSingle();
      const purchaserName =
        (purchaser?.display_name as string | undefined) ??
        ((purchaser?.email as string | undefined) ?? '').split('@')[0] ??
        'A friend';

      // The giftee's profile holds the activation_token that the
      // /activate/buddy/[token] route validates. Look it up by email
      // so the reminder email's CTA goes straight to the activate
      // page — without this the giftee would have to find the
      // original invite email in their inbox to click through.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: gifteeProfile } = await (admin.from('profiles') as any)
        .select('activation_token')
        .eq('email', p.buddy_email)
        .maybeSingle();
      const origin = req.nextUrl.origin.replace(/\/$/, '');
      const activationUrl = gifteeProfile?.activation_token
        ? `${origin}/activate/buddy/${gifteeProfile.activation_token}`
        : `${origin}/account`;

      // Mid-window reminder always reads "7 days" — that's the midpoint
      // of the 14-day activation window. Clamped to 7 even on the
      // outer edges of the cron window so the copy stays stable.
      const daysLeft = 7;

      const rendered = renderBuddyExpiringSoonEmail({
        displayName: p.buddy_name,
        email: p.buddy_email,
        purchaserName,
        activationUrl,
        daysLeft,
      });

      const emailResult = await sendEmail({
        to: p.buddy_email,
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
        replyTo: rendered.replyTo,
        tags: [{ name: 'kind', value: 'buddy-expiring-soon' }],
      });

      if (!emailResult.ok) {
        // Don't mark the row as sent if the email failed — we'll
        // retry on the next cron run.
        results.push({ id: p.id, ok: false, error: emailResult.error });
        continue;
      }

      // Stamp the row so subsequent cron runs skip it.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: stampErr } = await (admin.from('buddy_purchases') as any)
        .update({ mid_reminder_sent_at: new Date().toISOString() })
        .eq('id', p.id);
      if (stampErr) {
        // Email went out but the stamp failed — next cron may resend.
        // Log it; we'd rather resend once than miss the window.
        console.warn('mid_reminder_sent_at stamp failed:', stampErr);
      }

      results.push({ id: p.id, ok: true });
    } catch (err) {
      console.error('buddy-expiring-soon single failed:', err);
      results.push({
        id: p.id,
        ok: false,
        error: err instanceof Error ? err.message : 'unknown',
      });
    }
  }

  return NextResponse.json({
    processed: results.length,
    succeeded: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    results,
  });
}
