import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase';
import crypto from 'crypto';

interface CreemWebhookPayload {
  id: string;
  eventType: string;
  object: {
    customer?: {
      email: string;
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

async function setPremium(
  supabase: ReturnType<typeof createClient<Database>>,
  userId: string,
  isPremium: boolean,
  email: string,
  eventType: string
) {
  // The Supabase JS client's strict generic types don't always line up
  // with our Database['Update'] shape. Cast through unknown to get the
  // payload we want without fighting the type system.
  const update = {
    is_premium: isPremium,
    ...(isPremium ? { premium_purchased_at: new Date().toISOString() } : {}),
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('profiles') as any).update(update).eq('id', userId);
  if (error) {
    console.error(`Failed to set is_premium=${isPremium}:`, error);
    return false;
  }
  console.log(`✓ Premium ${isPremium ? 'granted' : 'revoked'} for ${email} (${eventType})`);
  return true;
}

export async function POST(req: NextRequest) {
  const secret = process.env.CREEM_WEBHOOK_SECRET;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!secret) {
    return NextResponse.json({ error: 'CREEM_WEBHOOK_SECRET not set' }, { status: 500 });
  }
  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: 'Supabase env vars not set' }, { status: 500 });
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

  const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const eventType = payload.eventType;
  const customerEmail = payload.object?.customer?.email?.toLowerCase();

  // For a one-time-payment product, only two events matter:
  //   - checkout.completed → grant premium
  //   - refund.created     → revoke premium
  // Anything else, we don't care about — ignore.
  if (eventType !== 'checkout.completed' && eventType !== 'refund.created') {
    console.log(`Skipping event ${eventType}`);
    return NextResponse.json({ received: true, skipped: true });
  }

  if (!customerEmail) {
    console.error('No customer email in webhook payload');
    return NextResponse.json({ received: true, note: 'no email' });
  }

  // Find the user by email
  const { data: userList, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error('Failed to list users:', listError);
    return NextResponse.json({ error: 'list failed' }, { status: 500 });
  }

  const matchingUser = userList.users.find(
    (u) => u.email?.toLowerCase() === customerEmail
  );

  if (!matchingUser) {
    console.error(`No Supabase user for ${customerEmail}`);
    return NextResponse.json({ received: true, note: 'no user match' });
  }

  const success = await setPremium(
    supabase,
    matchingUser.id,
    eventType === 'checkout.completed',
    customerEmail,
    eventType
  );

  if (!success) {
    return NextResponse.json({ error: 'update failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
