// Cron handler: /api/cron/buddy-expiry
//
// Daily Vercel Cron (or GitHub Actions scheduled workflow) call.
// Finds pending buddy purchases past their 14-day window,
// converts them to gift codes, deletes the pending user accounts
// (GDPR — no consent, no data), and emails the purchaser.
//
// Authenticated via a shared secret in the Authorization header
// or as ?secret=... Vercel Cron adds its own Authorization header;
// for GitHub Actions we pass the secret explicitly.

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/email';
import { randomBytes } from 'crypto';
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
  // Vercel Cron adds `Authorization: Bearer <CRON_SECRET>` automatically
  // when the secret is configured in the cron definition.
  return false;
}

function giftCode(): string {
  // FIT50-XXXX-XXXX (8 random URL-safe chars, hyphenated for readability)
  const raw = randomBytes(8).toString('base64url').toUpperCase().replace(/[^A-Z0-9]/g, '');
  return `FIT50-${raw.slice(0, 4)}-${raw.slice(4, 8)}`;
}

interface ExpiringPurchase {
  id: string;
  purchaser_user_id: string;
  purchaser_email: string;
  buddy_email: string;
  buddy_name: string;
}

export async function GET(req: NextRequest) {
  if (!authOk(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: 'supabase not configured' }, { status: 503 });
  }

  const admin = createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: expiring, error } = await (admin.from('buddy_purchases') as any)
    .select('id, purchaser_user_id, purchaser_email, buddy_email, buddy_name')
    .eq('status', 'pending')
    .lt('expires_at', new Date().toISOString())
    .limit(50);

  if (error) {
    console.error('buddy-expiry fetch failed:', error);
    return NextResponse.json({ error: 'fetch failed' }, { status: 500 });
  }

  const purchases: ExpiringPurchase[] = expiring || [];
  const results: Array<{ id: string; ok: boolean; code?: string; error?: string }> = [];

  for (const p of purchases) {
    try {
      const code = giftCode();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: gcError } = await (admin.from('gift_codes') as any).insert({
        code,
        buddy_purchase_id: p.id,
      });
      if (gcError) throw new Error('gift_codes insert: ' + gcError.message);

      // Delete the pending Auth user (this also deletes the profile
      // via the on-delete cascade, which we don't have on profiles,
      // so we delete the profile row explicitly first).
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profile } = await (admin.from('profiles') as any)
        .select('id')
        .eq('email', p.buddy_email)
        .maybeSingle();

      if (profile?.id) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: delProfileErr } = await (admin.from('profiles') as any)
          .delete()
          .eq('id', profile.id);
        if (delProfileErr) {
          console.warn('profile delete failed (will still try auth delete):', delProfileErr);
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: authErr } = await admin.auth.admin.deleteUser(profile.id);
        if (authErr) {
          console.warn('auth delete failed:', authErr);
        }
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateErr } = await (admin.from('buddy_purchases') as any)
        .update({ status: 'expired_gifted' })
        .eq('id', p.id);
      if (updateErr) {
        console.warn('buddy_purchases update failed:', updateErr);
      }

      // Email the purchaser.
      const emailResult = await sendEmail({
        to: p.purchaser_email,
        subject: `${p.buddy_name} didn\u2019t activate their FIT50 seat — here\u2019s the gift code`,
        html: renderGiftEmail(p.buddy_name, code),
        text: `Hi,

Your buddy ${p.buddy_name} didn't activate their FIT50 seat within the 14-day window.

Your second seat is now a gift code you can pass to anyone — it doesn't expire.

Gift code: ${code}

Pass it on to someone who'd actually appreciate the 50 days. The worst 50 days of your life are better than the easiest 50 days with someone who doesn't want to be there.

— The FIT50 team`,
        tags: [{ name: 'kind', value: 'buddy-expired-gift' }],
      });

      if (!emailResult.ok) {
        console.warn('gift email failed:', emailResult.error);
      }

      results.push({ id: p.id, ok: true, code });
    } catch (err) {
      console.error('buddy-expiry single failed:', err);
      results.push({ id: p.id, ok: false, error: err instanceof Error ? err.message : 'unknown' });
    }
  }

  return NextResponse.json({
    processed: results.length,
    succeeded: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    results,
  });
}

function renderGiftEmail(buddyName: string, code: string): string {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Your buddy didn't activate</title>
  </head>
  <body style="margin:0;padding:0;background:#F6F1E5;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;color:#1A1A1A;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#F6F1E5;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;background:#FFFFFF;border:1px solid #E5E0D0;">
            <tr>
              <td style="padding:32px;">
                <p style="margin:0 0 12px 0;font-family:Georgia,serif;font-size:22px;">Your buddy didn't activate.</p>
                <p style="margin:0 0 16px 0;font-size:16px;line-height:1.5;">
                  ${escapeHtml(buddyName)} didn't activate their FIT50 seat within the 14-day window.
                </p>
                <p style="margin:0 0 24px 0;font-size:16px;line-height:1.5;">
                  Your second seat is now a gift code you can pass to anyone — it doesn't expire.
                </p>
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="background:#F6F1E5;border:1px solid #E5E0D0;margin:0 auto;">
                  <tr>
                    <td style="padding:16px 24px;font-family:Menlo,Consolas,monospace;font-size:18px;letter-spacing:0.05em;">
                      ${escapeHtml(code)}
                    </td>
                  </tr>
                </table>
                <p style="margin:24px 0 0 0;font-size:14px;line-height:1.5;color:#1A1A1A99;">
                  Pass it to someone who'd appreciate the 50 days. Or sit on it for a bit.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
