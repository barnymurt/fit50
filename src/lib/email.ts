// Resend wrapper. Single sendEmail() entry point.
//
// In production: hits Resend via RESEND_API_KEY.
// In development (no RESEND_API_KEY): logs to console so the rest of
// the system can be exercised without spamming real addresses.
//
// Test-mode override: if EMAIL_TEST_TO is set, every send is
// redirected there regardless of `to`. The original recipient is
// logged so we know what would have gone where. Use this when you
// want to see every email a user gets in your own inbox without
// spamming them.
//
// Email IDs are returned to the caller so they can be stored for
// debugging and so the webhook can join Resend delivery events back
// to the buddy_purchases row.

import { Resend } from 'resend';

const fromAddress =
  process.env.BUDDY_EMAIL_FROM ?? 'FIT50 <hello@fit50challenge.io>';

// `apiKey` and `testToOverride` are read inside sendEmail() rather than
// at module load so dev-mode scripts that import this file and then
// populate process.env from .env.local actually pick up the values.
// (In production, env is set by the platform before module load.)
function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  return key ? new Resend(key) : null;
}
function getTestToOverride(): string | null {
  return process.env.EMAIL_TEST_TO?.trim() || null;
}

export interface SendEmailArgs {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  tags?: Array<{ name: string; value: string }>;
}

export interface SendEmailResult {
  ok: boolean;
  id?: string;
  error?: string;
  redirected?: boolean;
  originalTo?: string;
}

export async function sendEmail(args: SendEmailArgs): Promise<SendEmailResult> {
  const resend = getResend();
  const redirectedTo = getTestToOverride();
  const finalTo = redirectedTo ?? args.to;

  if (!resend) {
    console.log('[email:dev]', {
      to: finalTo,
      from: args.to,
      ...(redirectedTo ? { subject: `[→${args.to}] ${args.subject}` } : { subject: args.subject }),
    });
    console.log(args.text ?? '[html only]');
    return {
      ok: true,
      id: 'dev-' + Math.random().toString(36).slice(2, 10),
      ...(redirectedTo ? { redirected: true, originalTo: args.to } : {}),
    };
  }
  try {
    const result = await resend.emails.send({
      from: fromAddress,
      to: finalTo,
      subject: redirectedTo ? `[→${args.to}] ${args.subject}` : args.subject,
      html: args.html,
      text: args.text,
      replyTo: args.replyTo,
      tags: args.tags,
    });
    if (result.error) {
      console.error('[email] Resend error:', result.error);
      return { ok: false, error: result.error.message };
    }
    return {
      ok: true,
      id: result.data?.id,
      ...(redirectedTo ? { redirected: true, originalTo: args.to } : {}),
    };
  } catch (err) {
    console.error('[email] send failed:', err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'unknown',
    };
  }
}

export const emailFromAddress = fromAddress;
