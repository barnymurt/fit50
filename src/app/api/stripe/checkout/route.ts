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
            // Server Components cannot set cookies. Will be ignored if
            // called from a Server Component. We only call this from a
            // Route Handler, so this should never throw.
          }
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return NextResponse.json({ error: 'not authenticated' }, { status: 401 });
  }

  const origin = req.nextUrl.origin;

  const stripe = new Stripe(secret);

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
            unit_amount: PRICE_EUR_CENTS,
            product_data: {
              name: PRODUCT_NAME,
              description: PRODUCT_DESCRIPTION,
            },
          },
        },
      ],
      metadata: {
        user_id: user.id,
        user_email: user.email,
      },
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