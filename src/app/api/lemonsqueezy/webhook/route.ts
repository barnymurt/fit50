import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

interface LemonSqueezyWebhookPayload {
  meta: {
    event_name: string;
    custom_data?: {
      user_id?: string;
    };
  };
  data: {
    id: string;
    attributes: {
      status: string;
      user_email: string;
      ends_at?: string | null;
    };
  };
}

function verifySignature(rawBody: string, signature: string | null, secret: string): boolean {
  if (!signature) return false;
  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(rawBody).digest('hex');
  try {
    return crypto.timingSafeEqual(
      Buffer.from(digest),
      Buffer.from(signature)
    );
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!secret) {
    console.error('LEMON_SQUEEZY_WEBHOOK_SECRET is not set');
    return NextResponse.json({ error: 'webhook not configured' }, { status: 500 });
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Supabase env vars not set');
    return NextResponse.json({ error: 'supabase not configured' }, { status: 500 });
  }

  const rawBody = await req.text();
  const signature = req.headers.get('x-signature');

  if (!verifySignature(rawBody, signature, secret)) {
    console.error('Invalid webhook signature');
    return NextResponse.json({ error: 'invalid signature' }, { status: 401 });
  }

  let payload: LemonSqueezyWebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  const eventName = payload.meta?.event_name;
  const userId = payload.meta?.custom_data?.user_id;
  const status = payload.data?.attributes?.status;
  const email = payload.data?.attributes?.user_email;

  if (!userId) {
    console.error('No user_id in custom_data');
    return NextResponse.json({ error: 'missing user_id' }, { status: 400 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const isActive = status === 'active' || status === 'on_trial';

  if (eventName === 'subscription_created' || eventName === 'subscription_updated') {
    const { error } = await supabase
      .from('profiles')
      .update({
        is_premium: isActive,
        premium_purchased_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      console.error('Failed to update profile:', error);
      return NextResponse.json({ error: 'update failed' }, { status: 500 });
    }

    console.log(`✓ Premium ${isActive ? 'granted' : 'revoked'} for user ${userId} (${email})`);
  } else if (eventName === 'subscription_cancelled' || eventName === 'subscription_expired') {
    const { error } = await supabase
      .from('profiles')
      .update({ is_premium: false })
      .eq('id', userId);

    if (error) {
      console.error('Failed to revoke premium:', error);
      return NextResponse.json({ error: 'update failed' }, { status: 500 });
    }

    console.log(`✓ Premium revoked for user ${userId} (${email})`);
  }

  return NextResponse.json({ received: true });
}
