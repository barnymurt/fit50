// POST /api/buddy/purchase
//
// Creates a Stripe Checkout session for a buddy-pair purchase
// (€9.99). Two paid seats in a single transaction: one for the
// purchaser, one for the buddy. The webhook at
// /api/stripe/webhook handles fulfilment.
//
// Validation:
//
// - buddy_email is well-formed and different from the purchaser's
// - the buddy_email isn't already a pending_purchase for someone
//   else (one purchase per email; selling a seat to a stranger
//   who didn't ask for it is the central anti-spam guarantee)
// - if the buddy_email already maps to a FIT50 user, premium users
//   block; non-premium users are auto-upgraded in the webhook
//
// Auth: the purchaser must be signed in. We use the SSR cookie
// client so we get the session from the request.

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import type { Database } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PRIX_EUR_CENTS = 599;
const PAIR_PRICE_EUR_CENTS = 999;
// Stripe line items are per-seat. The pair has two seats, so total
// charge is 2 × €5.99 = €11.98. We charge the lower €9.99 by
// applying a coupon at the session level.

const PRODUCT_NAME = 'FIT50 Premium';
const PRODUCT_DESCRIPTION =
  'Streak protection, macro food tracker, multi-purpose timer, project board and water tracker. One payment, yours forever.';

function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

export async function POST(req: NextRequest) {
  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!stripeSecret) {
    return NextResponse.json({ error: 'stripe not configured' }, { status: 503 });
  }
  if (!supabaseUrl || !supabaseAnon || !supabaseServiceKey) {
    return NextResponse.json({ error: 'supabase not configured' }, { status: 503 });
  }

  const body = await req.json().catch(() => ({}));
  const buddyEmail = typeof body.buddy_email === 'string' ? body.buddy_email.trim().toLowerCase() : '';
  const buddyName = typeof body.buddy_name === 'string' ? body.buddy_name.trim() : '';
  const personalNote = typeof body.personal_note === 'string' ? body.personal_note.trim().slice(0, 200) : '';

  if (!isValidEmail(buddyEmail)) {
    return NextResponse.json({ error: 'Please enter a valid email for your buddy.' }, { status: 400 });
  }
  if (!buddyName || buddyName.length > 60) {
    return NextResponse.json({ error: 'Please enter your buddy\u2019s first name.' }, { status: 400 });
  }

  // Auth — must be signed in.
  const cookieStore = cookies();
  const supabase = createServerClient<Database>(
    supabaseUrl,
    supabaseAnon,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
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
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id || !user.email) {
    return NextResponse.json({ error: 'Sign in to buy a buddy pair.' }, { status: 401 });
  }

  if (buddyEmail === user.email.toLowerCase()) {
    return NextResponse.json(
      { error: 'You can\u2019t nominate yourself as a buddy.' },
      { status: 400 }
    );
  }

  // Admin client for cross-table checks.
  const admin = createAdminClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // 1. Is there already a pending purchase for this buddy email?
  //     (Any purchaser, not just this one.)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existingPurchase } = await (admin.from('buddy_purchases') as any)
    .select('id, status, purchaser_user_id')
    .eq('buddy_email', buddyEmail)
    .in('status', ['pending', 'activated'])
    .maybeSingle();

  if (existingPurchase) {
    return NextResponse.json(
      {
        error: existingPurchase.purchaser_user_id === user.id
          ? 'You already have a pending buddy purchase for this email.'
          : 'That email already has a buddy purchase in progress.',
      },
      { status: 409 }
    );
  }

  // 2. Does the buddy email already exist as a FIT50 user?
  //     If they're premium, block. If they're free, auto-upgrade.
  const { data: buddyProfile } = await (admin.from('profiles') as any)
    .select('id, is_premium, display_name')
    .eq('email', buddyEmail)
    .maybeSingle();

  let buddyResolution: 'premium' | 'free' | 'new' = 'new';
  if (buddyProfile?.is_premium) {
    return NextResponse.json(
      {
        error: 'That email already has FIT50 Premium. Buddy pair is for free accounts.',
      },
      { status: 409 }
    );
  } else if (buddyProfile) {
    buddyResolution = 'free';
  }

  // 3. Build the Stripe Checkout session.
  const origin = req.nextUrl.origin;
  const stripe = new Stripe(stripeSecret);

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: user.email,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'eur',
            unit_amount: PRIX_EUR_CENTS,
            product_data: {
              name: 'FIT50 Premium (you)',
              description: PRODUCT_DESCRIPTION,
            },
          },
        },
        {
          quantity: 1,
          price_data: {
            currency: 'eur',
            unit_amount: PRIX_EUR_CENTS,
            product_data: {
              name: `FIT50 Premium (${buddyName || 'buddy'})`,
              description: 'Lifetime access for your buddy. They\u2019ll get their own account once they activate.',
            },
          },
        },
      ],
      discounts: [
        {
          coupon: await ensurePairDiscount(stripe),
        },
      ],
      metadata: {
        type: 'buddy_pair',
        purchaser_user_id: user.id,
        purchaser_email: user.email,
        buddy_email: buddyEmail,
        buddy_name: buddyName,
        personal_note: personalNote,
        buddy_resolution: buddyResolution,
      },
      success_url: `${origin}/account?checkout=buddy_pair`,
      cancel_url: `${origin}/?checkout=canceled`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('Buddy purchase session creation failed:', err);
    return NextResponse.json({ error: 'checkout failed' }, { status: 500 });
  }
}

const COUPON_NAME = 'FIT50-BUDDY-PAIR';

async function ensurePairDiscount(stripe: Stripe): Promise<string> {
  // The discount is (2 × €5.99 - €9.99) = €1.99 off. Reuse the
  // coupon if it exists; create if it doesn't.
  const list = await stripe.coupons.list({ limit: 100 });
  const existing = list.data.find((c) => c.name === COUPON_NAME);
  if (existing) return existing.id;
  const created = await stripe.coupons.create({
    name: COUPON_NAME,
    amount_off: 199,
    currency: 'eur',
    duration: 'once',
  });
  return created.id;
}
