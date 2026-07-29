import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

interface CreemWebhookPayload {
  id: string;
  eventType: string;
  created_at: number;
  object: {
    id: string;
    object: string;
    customer?: {
      id: string;
      email: string;
    };
    metadata?: {
      referenceId?: string;
      user_id?: string;
    };
    product?: {
      id: string;
    };
    status?: string;
  };
}

function verifySignature(rawBody: string, signature: string | null, secret: string): boolean {
  if (!signature) return false;
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, 'utf8'),
      Buffer.from(signature, 'utf8')
    );
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const secret = process.env.CREEM_WEBHOOK_SECRET;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!secret) {
    console.error('CREEM_WEBHOOK_SECRET not set');
    return NextResponse.json({ error: 'webhook not configured' }, { status: 500 });
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Supabase env vars not set');
    return NextResponse.json({ error: 'supabase not configured' }, { status: 500 });
  }

  const rawBody = await req.text();
  const signature = req.headers.get('creem-signature');

  if (!verifySignature(rawBody, signature, secret)) {
    console.error('Invalid Creem webhook signature');
    return NextResponse.json({ error: 'invalid signature' }, { status: 401 });
  }

  let payload: CreemWebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Look up the user by email (the customer email from Creem)
  // We don't use metadata.referenceId because the checkout link
  // doesn't pass custom data — we match by email instead.
  const customerEmail = payload.object?.customer?.email?.toLowerCase();
  if (!customerEmail) {
    console.error('No customer email in webhook payload');
    return NextResponse.json({ received: true, note: 'no email, skipped' });
  }

  // Find the user by email in Supabase auth
  const { data: userList, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error('Failed to list users:', listError);
    return NextResponse.json({ error: 'list failed' }, { status: 500 });
  }

  const matchingUser = userList.users.find(
    (u) => u.email?.toLowerCase() === customerEmail
  );

  if (!matchingUser) {
    console.error(`No Supabase user found for email ${customerEmail}`);
    return NextResponse.json({ received: true, note: 'no user match, skipped' });
  }

  const eventType = payload.eventType;
  const status = payload.object?.status;

  const isActive = ['active', 'trialing'].includes(status || '');

  // Grant or revoke premium based on event type
  const grantEvents = ['checkout.completed', 'subscription.active', 'subscription.paid', 'subscription.trialing', 'subscription.update'];
  const revokeEvents = ['subscription.canceled', 'subscription.expired', 'subscription.paused', 'subscription.scheduled_cancel', 'subscription.past_due', 'refund.created'];

  if (grantEvents.includes(eventType)) {
    const { error } = await supabase
      .from('profiles')
      .update({
        is_premium: true,
        premium_purchased_at: new Date().toISOString(),
      })
      .eq('id', matchingUser.id);

    if (error) {
      console.error('Failed to grant premium:', error);
      return NextResponse.json({ error: 'update failed' }, { status: 500 });
    }

    console.log(`✓ Premium granted for ${customerEmail} (event: ${eventType})`);
  } else if (revokeEvents.includes(eventType)) {
    const { error } = await supabase
      .from('profiles')
      .update({ is_premium: false })
      .eq('id', matchingUser.id);

    if (error) {
      console.error('Failed to revoke premium:', error);
      return NextResponse.json({ error: 'update failed' }, { status: 500 });
    }

    console.log(`✓ Premium revoked for ${customerEmail} (event: ${eventType})`);
  } else {
    console.log(`Unhandled event type: ${eventType}`);
  }

  return NextResponse.json({ received: true });
}
