// Resend wrapper. Single sendEmail() entry point.
//
// In production: hits Resend via RESEND_API_KEY.
// In development (no RESEND_API_KEY): logs to console so the rest of
// the system can be exercised without spamming real addresses.
//
// Email IDs are returned to the caller so they can be stored for
// debugging and so the webhook can join Resend delivery events back
// to the buddy_purchases row.

import { Resend } from 'resend';

const apiKey = process.env.RESEND_API_KEY;
const fromAddress =
  process.env.BUDDY_EMAIL_FROM ?? 'FIT50 <hello@fit50challenge.io>';

let resend: Resend | null = null;
if (apiKey) {
  resend = new Resend(apiKey);
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
}

export async function sendEmail(args: SendEmailArgs): Promise<SendEmailResult> {
  if (!resend) {
    console.log('[email:dev]', { to: args.to, subject: args.subject });
    console.log(args.text ?? '[html only]');
    return { ok: true, id: 'dev-' + Math.random().toString(36).slice(2, 10) };
  }
  try {
    const result = await resend.emails.send({
      from: fromAddress,
      to: args.to,
      subject: args.subject,
      html: args.html,
      text: args.text,
      replyTo: args.replyTo,
      tags: args.tags,
    });
    if (result.error) {
      console.error('[email] Resend error:', result.error);
      return { ok: false, error: result.error.message };
    }
    return { ok: true, id: result.data?.id };
  } catch (err) {
    console.error('[email] send failed:', err);
    return { ok: false, error: err instanceof Error ? err.message : 'unknown' };
  }
}

export const emailFromAddress = fromAddress;
