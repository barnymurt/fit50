// POST /api/buddy/purchase
//
// Creates a Stripe Checkout session for a buddy-pair purchase.
// Accepts non-signed-in buyers: the form is the single source of
// truth for buyer_email, buyer_name, buddy_email, buddy_name.
//
// Validation:
//   - both emails well-formed
//   - emails are different
//   - neither email is already a FIT50 Premium member
//   - the buyer email isn't already a pending buddy purchase
//   - the buddy email isn't already a pending buddy purchase
//
// Auth: optional. The API attaches user_id to metadata when the
// caller is signed in (so the webhook can pair accounts and skip
// creating a new user for the buyer). For unsigned buyers, the
// webhook creates the user on payment success.

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import type { Database } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PRIX_EUR_CENTS = 599;
const PAIR_COUPON_AMOUNT_OFF_CENTS = 199;   // 2 × 5.99 − 1.99 = 9.99
const LOYALTY_COUPON_AMOUNT_OFF_CENTS = 199; // 5.99 − 1.99 = 4.00

function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

export async function POST(req: NextRequest) {
  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!stripeSecret) {
    return NextResponse.json(
      { error: 'STRIPE_SECRET_KEY is not set on the server. Add it in Vercel env vars.' },
      { status: 503 }
    );
  }
  if (!supabaseUrl || !supabaseAnon || !supabaseServiceKey) {
    const missing: string[] = [];
    if (!supabaseUrl) missing.push('NEXT_PUBLIC_SUPABASE_URL');
    if (!supabaseAnon) missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
    if (!supabaseServiceKey) missing.push('SUPABASE_SERVICE_ROLE_KEY');
    return NextResponse.json(
      {
        error: `Supabase env var${missing.length > 1 ? 's' : ''} missing: ${missing.join(', ')}. Add ${missing.length > 1 ? 'them' : 'it'} in Vercel env vars.`,
      },
      { status: 503 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const purchaserEmail = typeof body.purchaser_email === 'string'
    ? body.purchaser_email.trim().toLowerCase()
    : '';
  const purchaserName = typeof body.purchaser_name === 'string'
    ? body.purchaser_name.trim().slice(0, 60)
    : '';
  const buddyEmail = typeof body.buddy_email === 'string'
    ? body.buddy_email.trim().toLowerCase()
    : '';
  const buddyName = typeof body.buddy_name === 'string'
    ? body.buddy_name.trim().slice(0, 60)
    : '';
  const personalNote = typeof body.personal_note === 'string'
    ? body.personal_note.trim().slice(0, 200)
    : '';

  if (!isValidEmail(purchaserEmail)) {
    return NextResponse.json(
      { error: 'Please enter a valid email for you.' },
      { status: 400 }
    );
  }
  if (!purchaserName) {
    return NextResponse.json({ error: 'Please enter your first name.' }, { status: 400 });
  }
  if (!isValidEmail(buddyEmail)) {
    return NextResponse.json(
      { error: 'Please enter a valid email for your buddy.' },
      { status: 400 }
    );
  }
  if (!buddyName) {
    return NextResponse.json(
      { error: 'Please enter your buddy’s first name.' },
      { status: 400 }
    );
  }
  if (purchaserEmail === buddyEmail) {
    return NextResponse.json(
      { error: 'You can’t pair with yourself.' },
      { status: 400 }
    );
  }

  // SSR-aware auth: if the buyer is signed in, use their user.id so
  // the webhook can pair accounts and skip the createUser step.
  const cookieStore = cookies();
  const ssrClient = createServerClient<Database>(supabaseUrl, supabaseAnon, {
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
  });
  const {
    data: { user },
  } = await ssrClient.auth.getUser();

  const admin = createAdminClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // 1. Block if the buyer email is already a pending purchase.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existingPurchase } = await (admin.from('buddy_purchases') as any)
    .select('id, status, purchaser_user_id')
    .eq('buddy_email', buddyEmail)
    .in('status', ['pending', 'activated'])
    .maybeSingle();

  if (existingPurchase) {
    return NextResponse.json(
      {
        error:
          existingPurchase.purchaser_user_id === user?.id
            ? 'You already have a pending buddy purchase for this email.'
            : 'That email already has a buddy purchase in progress.',
      },
      { status: 409 }
    );
  }

  // 2. Check the buyer email — if it's already a FIT50 Premium
  //    member, we need to apply the loyalty discount. If they're
  //    not signed in but the email is a free account, the user
  //    should sign in first to claim that account.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: purchaserProfile } = await (admin.from('profiles') as any)
    .select('id, is_premium, display_name')
    .eq('email', purchaserEmail)
    .maybeSingle();

  let purchaserIsPremium = false;
  if (purchaserProfile?.is_premium) {
    // Buyer already has a FIT50 Premium account. The price drops to
    // the loyalty price, and we need a signed-in session to pair the
    // accounts in the webhook. If the cookie session is anonymous,
    // block — the user should sign in to claim the discount.
    if (!user) {
      return NextResponse.json(
        {
          error:
            'That email already has a paid FIT50 account. Sign in to claim the loyalty discount.',
        },
        { status: 401 }
      );
    }
    if (user.email?.toLowerCase() !== purchaserEmail) {
      return NextResponse.json(
        {
          error:
            'The signed-in account does not match the buyer email. Sign in with the buyer email to claim the loyalty discount.',
        },
        { status: 403 }
      );
    }
    purchaserIsPremium = true;
  }

  // 3. The buddy must be a brand-new email. If they already have an
  //    account, even a free one, the buddy is no longer a "gift" — we
  //    can't create another account for them. Block with a clear msg.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: buddyProfile } = await (admin.from('profiles') as any)
    .select('id, is_premium, display_name')
    .eq('email', buddyEmail)
    .maybeSingle();

  if (buddyProfile) {
    return NextResponse.json(
      {
        error:
          buddyProfile.is_premium
            ? 'That email already has FIT50 Premium. Buddy pair is for new accounts.'
            : 'That email is already a FIT50 user. Sign in and pair from your account instead.',
      },
      { status: 409 }
    );
  }

  // 4. Build the Stripe Checkout session.
  const origin = req.nextUrl.origin.replace(/\/$/, '');
  const stripe = new Stripe(stripeSecret);

  let line_items: Stripe.Checkout.SessionCreateParams.LineItem[];
  let couponName: string;
  let couponAmountOffCents: number;
  let totalCents: number;

  if (purchaserIsPremium) {
    line_items = [
      {
        quantity: 1,
        price_data: {
          currency: 'eur',
          unit_amount: PRIX_EUR_CENTS,
          product_data: {
            name: `FIT50 Premium (${buddyName || 'buddy'})`,
            description:
              'Lifetime access for your buddy. They’ll get their own account once they activate.',
          },
        },
      },
    ];
    couponName = 'FIT50-LOYALTY-BUDDY';
    couponAmountOffCents = LOYALTY_COUPON_AMOUNT_OFF_CENTS;
    totalCents = PRIX_EUR_CENTS - LOYALTY_COUPON_AMOUNT_OFF_CENTS;
  } else {
    line_items = [
      {
        quantity: 1,
        price_data: {
          currency: 'eur',
          unit_amount: PRIX_EUR_CENTS,
          product_data: {
            name: 'FIT50 Premium (you)',
            description:
              'Streak protection, macro food tracker, multi-purpose timer, project board and water tracker. One payment, yours forever.',
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
            description:
              'Lifetime access for your buddy. They’ll get their own account once they activate.',
          },
        },
      },
    ];
    couponName = 'FIT50-BUDDY-PAIR';
    couponAmountOffCents = PAIR_COUPON_AMOUNT_OFF_CENTS;
    totalCents = PRIX_EUR_CENTS * 2 - PAIR_COUPON_AMOUNT_OFF_CENTS;
  }

  const couponId = await ensureDiscount(stripe, couponName, couponAmountOffCents);

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    customer_email: purchaserIsPremium ? purchaserEmail : undefined,
    line_items,
    discounts: [{ coupon: couponId }],
    metadata: {
      type: 'buddy_pair',
      // For the webhook to know who's who and how to pair them up.
      purchaser_email: purchaserEmail,
      purchaser_name: purchaserName,
      purchaser_existing_user_id: user?.id ?? '',
      buddy_email: buddyEmail,
      buddy_name: buddyName,
      personal_note: personalNote,
      // Was the buyer already premium at purchase time? The webhook
      // uses this to skip the buyer's premium grant + skip createUser
      // for the buyer. The buddy is still created as a brand-new
      // account.
      purchaser_was_premium: purchaserIsPremium ? 'true' : 'false',
      amount_paid_cents: totalCents.toString(),
    },
    success_url: `${origin}/account?checkout=buddy_pair`,
    cancel_url: `${origin}/?checkout=canceled`,
  });

  return NextResponse.json({ url: session.url });
}

async function ensureDiscount(
  stripe: Stripe,
  name: string,
  amountOffCents: number
): Promise<string> {
  const list = await stripe.coupons.list({ limit: 100 });
  const existing = list.data.find((c) => c.name === name);
  if (existing) return existing.id;
  const created = await stripe.coupons.create({
    name,
    amount_off: amountOffCents,
    currency: 'eur',
    duration: 'once',
  });
  return created.id;
}
