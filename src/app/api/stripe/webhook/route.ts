import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { randomBytes } from 'crypto';
import { sendEmail } from '@/lib/email';
import { renderBuddyInviteEmail } from '@/email/buddy-invite';
import type { Database } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BUDDY_WINDOW_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

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
    console.error(`Failed to set is_premium=${isPremium} for ${userId}:`, error);
    return false;
  }
  console.log(`✓ Premium ${isPremium ? 'granted' : 'revoked'} for ${email} (${source})`);
  return true;
}

async function ensureProfileExists(
  supabase: ReturnType<typeof createClient<Database>>,
  userId: string,
  email: string
) {
  // Don't set challenge_started_at here — let the schema default
  // (NULL after migration 0014) apply. If a row already exists, the
  // ignoreDuplicates flag preserves whatever challenge_started_at it
  // already has.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('profiles') as any).upsert(
    {
      id: userId,
      email,
      is_premium: false,
    },
    { onConflict: 'id', ignoreDuplicates: true }
  );
  if (error) {
    console.error(`Failed to ensure profile for ${userId}:`, error);
  }
}

async function isEventProcessed(
  supabase: ReturnType<typeof createClient<Database>>,
  eventId: string
): Promise<boolean> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('webhook_events') as any)
    .select('id, processed_at')
    .eq('id', eventId)
    .maybeSingle();
  if (error) {
    console.error('webhook_events lookup failed:', error);
    return false; // fail open: process and record
  }
  return !!(data && data.processed_at);
}

async function markEventProcessed(
  supabase: ReturnType<typeof createClient<Database>>,
  eventId: string,
  type: string
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('webhook_events') as any)
    .upsert(
      { id: eventId, type, processed_at: new Date().toISOString() },
      { onConflict: 'id', ignoreDuplicates: true }
    );
  if (error) {
    console.error('webhook_events insert failed:', error);
  }
}

function activationUrl(origin: string, token: string): string {
  return `${origin}/activate/buddy/${token}`;
}

function newToken(): string {
  return randomBytes(24).toString('hex');
}

interface HandleBuddyPurchaseResult {
  ok: boolean;
  error?: string;
}

async function handleBuddyPurchase(
  supabase: ReturnType<typeof createClient<Database>>,
  session: Stripe.Checkout.Session,
  origin: string
): Promise<HandleBuddyPurchaseResult> {
  const meta = session.metadata || {};
  const existingPurchaserUserId =
    (meta.purchaser_existing_user_id as string) ||
    (meta.purchaser_user_id as string) || // legacy field
    '';
  const purchaserName = (meta.purchaser_name as string) || '';
  const purchaserEmail = (
    (meta.purchaser_email as string) ||
    session.customer_details?.email ||
    session.customer_email ||
    ''
  ).toLowerCase();
  const buddyEmail = ((meta.buddy_email as string) || '').toLowerCase();
  const buddyName = (meta.buddy_name as string) || 'Your buddy';
  const personalNote = (meta.personal_note as string) || '';
  const buddyResolution = (meta.buddy_resolution as string) || 'new';
  const purchaserWasPremium = (meta.purchaser_was_premium as string) === 'true';

  if (!purchaserEmail || !buddyEmail) {
    console.error('buddy_pair missing required metadata', {
      purchaserEmail,
      buddyEmail,
    });
    return { ok: false, error: 'missing metadata' };
  }

  // 1. Resolve the purchaser. If the buyer was anonymous at
  //    checkout, create the account now. If the buyer was signed
  //    in, use their existing id and grant premium (skipped if
  //    they were already premium and using the loyalty path).
  let purchaserUserId = existingPurchaserUserId;
  let purchaserActivationToken: string | null = null;

  if (!purchaserUserId) {
    // Anonymous checkout — create the buyer.
    const { data: created, error: createError } = await supabase.auth.admin.createUser({
      email: purchaserEmail,
      email_confirm: true,
      user_metadata: {
        display_name: purchaserName,
        created_by_buddy_purchase: true,
      },
    });
    if (createError || !created?.user?.id) {
      console.error('Failed to create purchaser user:', createError);
      return { ok: false, error: 'createUser (purchaser) failed' };
    }
    purchaserUserId = created.user.id;
    purchaserActivationToken = newToken();
    // The buyer is also pending_activation — they need to set a
    // password via the magic link in their welcome email.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('profiles') as any).upsert(
      {
        id: purchaserUserId,
        email: purchaserEmail,
        display_name: purchaserName,
        is_premium: true,
        premium_purchased_at: new Date().toISOString(),
        activation_status: 'pending_activation',
        activation_token: purchaserActivationToken,
        activation_expires_at: new Date(
          Date.now() + BUDDY_WINDOW_MS
        ).toISOString(),
      },
      { onConflict: 'id' }
    );
    console.log(`✓ Purchaser (anonymous checkout) created: ${purchaserEmail}`);
  } else {
    // Signed-in checkout — use the existing profile.
    await ensureProfileExists(supabase, purchaserUserId, purchaserEmail);
    if (!purchaserWasPremium) {
      const purchaserOk = await setPremium(
        supabase,
        purchaserUserId,
        true,
        purchaserEmail,
        'checkout.session.completed (buddy_pair, purchaser)'
      );
      if (!purchaserOk) {
        return { ok: false, error: 'purchaser premium update failed' };
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('profiles') as any)
      .update({ activation_status: 'active' })
      .eq('id', purchaserUserId);
  }

  // 2. Resolve the buddy. The buyer email is always a new user at
  //    this point (we blocked existing FIT50 users at purchase
  //    time). If the API-route check missed an edge case, fall
  //    through to handling the buddy as new.
  let buddyUserId: string | null = null;
  let status: 'pending' | 'activated' = 'pending';

  if (buddyResolution === 'free') {
    // Buyer is a non-premium existing user who tried to gift a
    // buddy pair. The API route should have rejected this in the
    // strictest check, but we handle the leftover case gracefully.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingBuddy } = await (supabase.from('profiles') as any)
      .select('id')
      .eq('email', buddyEmail)
      .maybeSingle();
    if (!existingBuddy) {
      console.warn('buddy_resolution=free but buddy profile missing at webhook time');
    } else {
      buddyUserId = existingBuddy.id;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('profiles') as any)
        .update({
          is_premium: true,
          premium_purchased_at: new Date().toISOString(),
          activation_status: 'active',
        })
        .eq('id', buddyUserId);
      // Pair both sides via the buddy_pairs table. Each side gets its
      // own row so they can hide independently. Skip if a pair row
      // already exists for either direction (idempotent on webhook
      // retry).
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('buddy_pairs') as any)
        .insert([
          { user_id: purchaserUserId, buddy_user_id: buddyUserId },
          { user_id: buddyUserId, buddy_user_id: purchaserUserId },
        ])
        .select()
        .then(({ error }: { error: unknown }) => {
          // 42P10 = unique_violation — already paired, fine.
          if (error && (error as { code?: string }).code !== '42P10') {
            console.error('buddy_pairs insert failed:', error);
          }
        });
      status = 'activated';
      console.log(`✓ Buddy (existing free user) auto-upgraded: ${buddyEmail}`);
    }
  }

  if (!buddyUserId) {
    // New buddy — create a pending account via admin API.
    const { data: createdUser, error: createError } =
      await supabase.auth.admin.createUser({
        email: buddyEmail,
        email_confirm: true,
        user_metadata: {
          display_name: buddyName,
          created_by_buddy_purchase: true,
        },
      });

    if (createError || !createdUser?.user?.id) {
      console.error('Failed to create pending buddy user:', createError);
      return { ok: false, error: 'createUser failed' };
    }

    buddyUserId = createdUser.user.id;
    const token = newToken();
    const expiresAt = new Date(Date.now() + BUDDY_WINDOW_MS).toISOString();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('profiles') as any)
      .upsert(
        {
          id: buddyUserId,
          email: buddyEmail,
          display_name: buddyName,
          is_premium: true,
          premium_purchased_at: new Date().toISOString(),
          activation_status: 'pending_activation',
          activation_token: token,
          activation_expires_at: expiresAt,
        },
        { onConflict: 'id' }
      );

    // Pair rows are NOT created yet — wait for activation so the
    // giftee's challenge_started_at is set before showing them in
    // the buyer's MyMotivator.

    // Send the invite email.
    const url = activationUrl(origin, token);
    const emailContent = renderBuddyInviteEmail({
      buddyName,
      purchaserName: purchaserName || purchaserEmail.split('@')[0] || 'A friend',
      purchaserEmail,
      personalNote,
      activationUrl: url,
    });

    const emailResult = await sendEmail({
      to: buddyEmail,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
      tags: [{ name: 'kind', value: 'buddy-invite' }],
    });

    if (!emailResult.ok) {
      console.error('Buddy invite email failed:', emailResult.error);
    } else {
      console.log(`✓ Buddy invite sent to ${buddyEmail} (Resend id ${emailResult.id})`);
    }
  }

  // 3. If the buyer was created anonymously in this webhook,
  //    email them a welcome with their magic link so they can set
  //    a password. The link is the same activation flow the buddy
  //    uses (existing /activate/buddy/[token] page).
  if (purchaserActivationToken) {
    const url = activationUrl(origin, purchaserActivationToken);
    const emailContent = renderBuddyInviteEmail({
      buddyName: 'your mate',
      purchaserName: purchaserName || 'You',
      purchaserEmail,
      personalNote: `Your buddy is ${buddyName}. ${personalNote}`.trim(),
      activationUrl: url,
    });
    const buyerMail = await sendEmail({
      to: purchaserEmail,
      subject: 'Your buddy pair is live — set your password',
      html: emailContent.html,
      text: emailContent.text,
      tags: [{ name: 'kind', value: 'purchaser-welcome' }],
    });
    if (!buyerMail.ok) {
      console.error('Purchaser welcome email failed:', buyerMail.error);
    } else {
      console.log(`✓ Purchaser welcome sent to ${purchaserEmail} (Resend id ${buyerMail.id})`);
    }
  }

  // 4. Audit log.
  const expiresAt = new Date(Date.now() + BUDDY_WINDOW_MS).toISOString();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: bpError } = await (supabase.from('buddy_purchases') as any).upsert(
    {
      purchaser_user_id: purchaserUserId,
      purchaser_email: purchaserEmail,
      buddy_email: buddyEmail,
      buddy_name: buddyName,
      personal_note: personalNote || null,
      stripe_session_id: session.id,
      stripe_payment_intent_id:
        typeof session.payment_intent === 'string'
          ? session.payment_intent
          : session.payment_intent?.id || null,
      amount_paid_cents: (session.amount_total ?? 999) as number,
      status,
      expires_at: status === 'pending' ? expiresAt : null,
      activated_at: status === 'activated' ? new Date().toISOString() : null,
      source: 'cohort-buddies-v1',
    },
    { onConflict: 'stripe_session_id' }
  );
  if (bpError) {
    console.error('buddy_purchases insert failed:', bpError);
  }

  return { ok: true };
}

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!secret || !webhookSecret) {
    return NextResponse.json({ error: 'stripe env vars not set' }, { status: 500 });
  }
  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: 'supabase env vars not set' }, { status: 500 });
  }

  const stripe = new Stripe(secret);
  const rawBody = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error('Invalid Stripe webhook signature:', err);
    return NextResponse.json({ error: 'invalid signature' }, { status: 401 });
  }

  const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Idempotency: dedupe by Stripe event id.
  if (await isEventProcessed(supabase, event.id)) {
    console.log(`Skipping duplicate webhook event ${event.id} (${event.type})`);
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const meta = session.metadata || {};
        const metaType = (meta.type as string) || 'solo';

        if (metaType === 'buddy_pair') {
          const origin = (req.headers.get('origin') || new URL(req.url).origin).replace(/\/$/, '');
          const result = await handleBuddyPurchase(supabase, session, origin);
          if (!result.ok) {
            return NextResponse.json({ error: result.error }, { status: 500 });
          }
          break;
        }

        // Solo purchase (existing path).
        const metadataUserId = (meta.user_id as string | undefined) ?? '';
        const customerEmail =
          (meta.user_email as string | undefined) ??
          session.customer_details?.email ??
          session.customer_email ??
          '';

        let userId = metadataUserId;

        if (!userId) {
          if (!customerEmail) {
            console.error('checkout.session.completed without user_id or email; cannot grant');
            break;
          }
          const { data: userList, error: listError } =
            await supabase.auth.admin.listUsers();
          if (listError) {
            console.error('Failed to list users for email match:', listError);
            return NextResponse.json({ error: 'list failed' }, { status: 500 });
          }
          const match = userList.users.find(
            (u) => u.email?.toLowerCase() === customerEmail.toLowerCase()
          );
          if (!match) {
            console.error(`No Supabase user for guest checkout email ${customerEmail}; manual reconciliation needed`);
            break;
          }
          userId = match.id;
        }

        await ensureProfileExists(supabase, userId, customerEmail);
        const ok = await setPremium(supabase, userId, true, customerEmail, event.type);
        if (!ok) return NextResponse.json({ error: 'update failed' }, { status: 500 });
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        const userId = ((charge.metadata?.user_id as string | undefined) ?? '') || '';
        const userEmail = charge.billing_details?.email ?? '';
        if (!userId) {
          console.error('charge.refunded without user_id metadata; cannot auto-revoke');
          break;
        }
        const ok = await setPremium(supabase, userId, false, userEmail, event.type);
        if (!ok) return NextResponse.json({ error: 'update failed' }, { status: 500 });
        break;
      }

      default:
        console.log(`Skipping Stripe event ${event.type}`);
    }

    await markEventProcessed(supabase, event.id, event.type);
  } catch (err) {
    console.error('Stripe webhook handler error:', err);
    return NextResponse.json({ error: 'handler failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
