import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import type { Database } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function setPremium(
  supabase: ReturnType<typeof createClient<Database>>,
  userId: string,
  isPremium: boolean,
  email: string,
  source: string
) {
  const update = {
    is_premium: isPremium,
    ...(isPremium
      ? { premium_purchased_at: new Date().toISOString() }
      : {}),
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('profiles') as any)
    .update(update)
    .eq('id', userId);
  if (error) {
    console.error(
      `Failed to set is_premium=${isPremium} for ${userId}:`,
      error
    );
    return false;
  }
  console.log(
    `✓ Premium ${isPremium ? 'granted' : 'revoked'} for ${email} (${source})`
  );
  return true;
}

async function ensureProfileExists(
  supabase: ReturnType<typeof createClient<Database>>,
  userId: string,
  email: string
) {
  // The user may have just signed up via magic link and not have a
  // profiles row yet. Create one with the bare minimum so the
  // update() above has something to hit. challenge_started_at is
  // NOT NULL in the schema, so we set it to today.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('profiles') as any).upsert(
    {
      id: userId,
      email,
      is_premium: false,
      challenge_started_at: new Date().toISOString().slice(0, 10),
    },
    { onConflict: 'id', ignoreDuplicates: true }
  );
  if (error) {
    console.error(`Failed to ensure profile for ${userId}:`, error);
  }
}

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!secret || !webhookSecret) {
    return NextResponse.json(
      { error: 'stripe env vars not set' },
      { status: 500 }
    );
  }
  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json(
      { error: 'supabase env vars not set' },
      { status: 500 }
    );
  }

  const stripe = new Stripe(secret);
  const rawBody = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'missing signature' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      webhookSecret
    );
  } catch (err) {
    console.error('Invalid Stripe webhook signature:', err);
    return NextResponse.json(
      { error: 'invalid signature' },
      { status: 401 }
    );
  }

  const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const metadataUserId =
          (session.metadata?.user_id as string | undefined) ?? '';
        const customerEmail =
          (session.metadata?.user_email as string | undefined) ??
          session.customer_details?.email ??
          session.customer_email ??
          '';

        let userId = metadataUserId;

        // Guest checkout: no Supabase user at checkout time. Try to
        // match an existing user by email. If none exists yet, the
        // buyer will sign up later and we lose the linkage — log it
        // so it can be reconciled manually.
        if (!userId) {
          if (!customerEmail) {
            console.error(
              'checkout.session.completed without user_id or email; cannot grant'
            );
            break;
          }
          const { data: userList, error: listError } =
            await supabase.auth.admin.listUsers();
          if (listError) {
            console.error('Failed to list users for email match:', listError);
            return NextResponse.json(
              { error: 'list failed' },
              { status: 500 }
            );
          }
          const match = userList.users.find(
            (u) => u.email?.toLowerCase() === customerEmail.toLowerCase()
          );
          if (!match) {
            console.error(
              `No Supabase user for guest checkout email ${customerEmail}; manual reconciliation needed`
            );
            break;
          }
          userId = match.id;
        }

        await ensureProfileExists(supabase, userId, customerEmail);
        const ok = await setPremium(
          supabase,
          userId,
          true,
          customerEmail,
          event.type
        );
        if (!ok) {
          return NextResponse.json(
            { error: 'update failed' },
            { status: 500 }
          );
        }
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        const userId =
          ((charge.metadata?.user_id as string | undefined) ?? '') ||
          '';
        const userEmail = charge.billing_details?.email ?? '';
        if (!userId) {
          // Fall back: look up via the customer email we stored at
          // checkout time. Charge metadata isn't auto-populated, so
          // we have to use the customer/session metadata. For now,
          // log and skip — refunds are rare and we can reconcile
          // manually if needed.
          console.error(
            'charge.refunded without user_id metadata; cannot auto-revoke'
          );
          break;
        }
        const ok = await setPremium(
          supabase,
          userId,
          false,
          userEmail,
          event.type
        );
        if (!ok) return NextResponse.json({ error: 'update failed' }, { status: 500 });
        break;
      }

      default:
        console.log(`Skipping Stripe event ${event.type}`);
    }
  } catch (err) {
    console.error('Stripe webhook handler error:', err);
    return NextResponse.json(
      { error: 'handler failed' },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}