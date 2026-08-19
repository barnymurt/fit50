// POST /api/buddy/purchase
//
// Two pricing paths:
//   mode = 'pair'      : €9.99 — Pair at checkout. Both seats are
//                          purchased together. Both accounts get
//                          created / updated. No loyalty discount.
//   mode = 'add_buddy'  : €5.99 — Add a buddy later. The buyer is
//                          already a solo user; they pay for one
//                          new seat (the buddy's). No pair discount.
//
// Auth: optional. The API attaches user_id to metadata when the
// caller is signed in (so the webhook can pair accounts and skip
// creating a new user for the buyer). For unsigned buyers, the
// webhook creates the user on payment success.
//
// Checkout upsell: "Save €2 and bring a mate along. Pairs finish
// at nearly 2x the rate of solo challengers." Surfaced in the
// homepage / account UI when the picker is in pair mode.

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import type { Database } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SEAT_EUR_CENTS = 599;        // €5.99 per seat
const PAIR_COUPON_OFF_CENTS = 199; // €1.99 off — pair nets €9.99
// mode=add_buddy has no discount — full €5.99.

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
  const mode = body.mode === 'add_buddy' ? 'add_buddy' : 'pair';
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
  // The client (useAuth) knows whether the buyer is signed in. If
  // their cookies aren't being picked up by the SSR client (which
  // has happened in some deployment setups with custom cookie
  // paths or cross-domain previews), accept the user's id directly
  // and let the admin API confirm it exists. Trust is bounded — we
  // only use it to look up the buyer's existing profile, never as
  // authentication for writes.
  const bodyUserId = typeof body.user_id === 'string' ? body.user_id : '';

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
  // Read cookies via both the request and the next/headers helper
  // (Next 14: the request cookie store is the most reliable way to
  // see cookies set by a different rendering).
  const cookieStore = cookies();
  const requestCookies = req.cookies.getAll();
  const ssrClient = createServerClient<Database>(supabaseUrl, supabaseAnon, {
    cookies: {
      getAll() {
        const fromHeaders = cookieStore.getAll();
        // Merge — request cookies win (latest value wins).
        const map = new Map<string, { name: string; value: string }>();
        for (const c of fromHeaders) map.set(c.name, c);
        for (const c of requestCookies) map.set(c.name, c);
        return Array.from(map.values());
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
    data: { user: cookieUser },
    error: userErr,
  } = await ssrClient.auth.getUser();

  const admin = createAdminClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // If the SSR client didn't see a session, fall back to the user_id
  // sent by the client and verify it via the admin API. This handles
  // edge cases where the session cookie isn't being picked up by
  // cookies()/req.cookies in some preview setups.
  let user: typeof cookieUser = cookieUser;
  if (!user && bodyUserId) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: lookupUser } = await (admin.auth.admin.getUserById as any)(
      bodyUserId
    );
    if (lookupUser?.user) {
      // Lightweight trust check: the body must have supplied an email
      // that matches the looked-up user's email. If they don't match,
      // reject.
      if (
        purchaserEmail &&
        lookupUser.user.email?.toLowerCase() === purchaserEmail
      ) {
        user = lookupUser.user;
      }
    }
  }

  // mode = 'add_buddy' requires a signed-in buyer (the buyer is
  // adding a buddy to their own existing account).
  if (mode === 'add_buddy' && !user) {
    return NextResponse.json(
      { error: 'Sign in to add a buddy to your account.' },
      { status: 401 }
    );
  }

  // The buyer email must match the signed-in account when adding
  // a buddy to an existing solo (we don't allow users to claim a
  // purchase for someone else).
  if (mode === 'add_buddy' && user && user.email?.toLowerCase() !== purchaserEmail) {
    return NextResponse.json(
      { error: 'The signed-in account does not match the buyer email.' },
      { status: 403 }
    );
  }

  // 1. Block if the buddy email is already a pending purchase.
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

  // 2. The buddy must be a brand-new email. If they already have an
  //    account, even a free one, the buddy is no longer a "gift" — we
  //    can't create another account for them.
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

  // 3. Build the Stripe Checkout session.
  const origin = req.nextUrl.origin.replace(/\/$/, '');
  const stripe = new Stripe(stripeSecret);

  let line_items: Stripe.Checkout.SessionCreateParams.LineItem[];
  let couponName: string | null = null;
  let couponAmountOffCents: number | null = null;
  let totalCents: number;

  if (mode === 'pair') {
    // Pair at checkout: two seats at €5.99 minus €1.99 = €9.99.
    line_items = [
      {
        quantity: 1,
        price_data: {
          currency: 'eur',
          unit_amount: SEAT_EUR_CENTS,
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
          unit_amount: SEAT_EUR_CENTS,
          product_data: {
            name: `FIT50 Premium (${buddyName || 'buddy'})`,
            description:
              'Lifetime access for your buddy. They’ll get their own account once they activate.',
          },
        },
      },
    ];
    couponName = 'FIT50-BUDDY-PAIR';
    couponAmountOffCents = PAIR_COUPON_OFF_CENTS;
    totalCents = SEAT_EUR_CENTS * 2 - PAIR_COUPON_OFF_CENTS; // 999
  } else {
    // Add buddy later: one new seat at €5.99, no discount.
    line_items = [
      {
        quantity: 1,
        price_data: {
          currency: 'eur',
          unit_amount: SEAT_EUR_CENTS,
          product_data: {
            name: `FIT50 Premium (${buddyName || 'buddy'})`,
            description:
              'Lifetime access for your buddy. They’ll get their own account once they activate.',
          },
        },
      },
    ];
    totalCents = SEAT_EUR_CENTS; // 599
  }

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: 'payment',
    payment_method_types: ['card'],
    line_items,
    metadata: {
      type: 'buddy_pair',
      mode,
      // Only set this when the buyer is already signed in. The
      // webhook creates a brand-new user when this is empty.
      purchaser_existing_user_id: user?.id ?? '',
      purchaser_email: purchaserEmail,
      purchaser_name: purchaserName,
      buddy_email: buddyEmail,
      buddy_name: buddyName,
      personal_note: personalNote,
      amount_paid_cents: totalCents.toString(),
    },
    success_url: `${origin}/account?checkout=buddy_pair`,
    cancel_url: `${origin}/?checkout=canceled`,
  };

  if (couponName && couponAmountOffCents) {
    const couponId = await ensureDiscount(stripe, couponName, couponAmountOffCents);
    sessionParams.discounts = [{ coupon: couponId }];
  }

  if (mode === 'add_buddy' && user) {
    sessionParams.customer_email = user.email;
  }

  const session = await stripe.checkout.sessions.create(sessionParams);

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
