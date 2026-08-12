import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import Stripe from 'stripe';
import type { Database } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PRICE_EUR_CENTS = 599;
const PRODUCT_NAME = 'FIT50 Premium';
const PRODUCT_DESCRIPTION =
  'Streak protection, macro food tracker, multi-purpose timer, project board and water tracker. One payment, yours forever.';

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    return NextResponse.json(
      { error: 'stripe not configured' },
      { status: 503 }
    );
  }

  // Auth is optional. If the visitor is already signed in we attach
  // their Supabase user id as metadata so the webhook can grant
  // premium directly. Otherwise we let Stripe collect the email and
  // the webhook falls back to matching by email.
  const cookieStore = cookies();
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
            // ignored — Route Handlers can set cookies
          }
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const origin = req.nextUrl.origin;

  const stripe = new Stripe(secret);

  const metadata: Record<string, string> = {};
  if (user?.id) metadata.user_id = user.id;
  if (user?.email) metadata.user_email = user.email;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      ...(user?.email ? { customer_email: user.email } : {}),
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'eur',
            unit_amount: PRICE_EUR_CENTS,
            product_data: {
              name: PRODUCT_NAME,
              description: PRODUCT_DESCRIPTION,
            },
          },
        },
      ],
      metadata,
      success_url: `${origin}/account?checkout=success`,
      cancel_url: `${origin}/?checkout=canceled`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('Stripe checkout session creation failed:', err);
    return NextResponse.json(
      { error: 'checkout failed' },
      { status: 500 }
    );
  }
}