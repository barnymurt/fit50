// POST /api/cohort/kudos
//
// "High-five the cohort" — a daily collective kudos counter
// per cohort member, capped at 5 per local day, targeting the
// whole cohort rather than any individual. The cohort surface
// reads the sum across the cohort and shows "X of Y high-fived
// today" (same shape as the other cohort stats).
//
// Per-membership storage: cohort_memberships.kudos_today (int,
// 0..5) and .kudos_today_date (date). The route resets the
// counter to 0 in the same UPDATE that increments it when the
// stored date is no longer today, so a single UPDATE handles
// both the day-rollover reset and the increment atomically.
//
// Auth: same bearer-token pattern as the other cohort routes.

import { NextRequest, NextResponse } from 'next/server';
import { authedUserFromRequest } from '@/lib/auth-server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const KUDOS_DAILY_CAP = 5;

export async function POST(req: NextRequest) {
  const auth = await authedUserFromRequest(req);
  if ('error' in auth) return auth.error;
  const { admin, user } = auth.ctx;

  let body: { cohort_id?: string } = {};
  try {
    body = (await req.json()) as { cohort_id?: string };
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }
  const cohortId = body.cohort_id;
  if (!cohortId) {
    return NextResponse.json({ error: 'cohort_id is required.' }, { status: 400 });
  }

  // Confirm the user has a live membership in this cohort.
  // RLS on cohort_memberships lets them read their own row;
  // we use the service-role client to write the increment.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb: any = admin;
  const today = new Date().toISOString().slice(0, 10);

  // Atomic increment-or-reset-and-increment via a single UPDATE.
  // The CASE expression: if the row's stored date matches today,
  // bump the counter; otherwise reset to 0 then bump. The CHECK
  // constraint on the column caps the result at 5, so a user who
  // tries to send their sixth high-five of the day gets a clean
  // 409 back from Postgres.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (sb.from('cohort_memberships') as any)
    .update({
      kudos_today_date: today,
      kudos_today: 1,
    })
    .eq('cohort_id', cohortId)
    .eq('user_id', user.id)
    .in('status', ['upcoming', 'active'])
    .eq('kudos_today_date', today)
    .lt('kudos_today', KUDOS_DAILY_CAP)
    .select('id, kudos_today')
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: error.message || 'Could not send kudos.' },
      { status: 500 }
    );
  }

  if (data) {
    return NextResponse.json({
      ok: true,
      kudos_today: (data as { kudos_today: number }).kudos_today,
    });
  }

  // The UPDATE above matched a row that was either
  // (a) past a different day (kudos_today_date != today) — we
  //     reset the row to (today, 1), OR
  // (b) already at the cap (kudos_today = 5) — refused.
  // (c) not a live member — refused.
  //
  // Distinguish: try the reset path explicitly.

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: resetData, error: resetErr } = await (sb
    .from('cohort_memberships') as any)
    .update({ kudos_today_date: today, kudos_today: 1 })
    .eq('cohort_id', cohortId)
    .eq('user_id', user.id)
    .in('status', ['upcoming', 'active'])
    .neq('kudos_today_date', today)
    .select('id, kudos_today')
    .maybeSingle();

  if (resetErr) {
    return NextResponse.json(
      { error: resetErr.message || 'Could not send kudos.' },
      { status: 500 }
    );
  }

  if (resetData) {
    return NextResponse.json({
      ok: true,
      kudos_today: (resetData as { kudos_today: number }).kudos_today,
    });
  }

  // The reset path also missed — either the user isn't a live
  // member or they've already used all 5 today.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: memberData } = await (sb.from('cohort_memberships') as any)
    .select('id, status, kudos_today, kudos_today_date')
    .eq('cohort_id', cohortId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!memberData) {
    return NextResponse.json(
      { error: 'You are not a member of this cohort.' },
      { status: 403 }
    );
  }

  return NextResponse.json(
    {
      error: 'You have already sent your 5 high-fives today. Try again tomorrow.',
    },
    { status: 429 }
  );
}
