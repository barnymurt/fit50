// GET /api/cron/cohort-join-closes
//
// Daily Vercel Cron (configured in vercel.json). Walks the
// `cohorts` table and:
//   1. Flips any `upcoming` cohort whose `start_date <= today` to
//      `active` so the UI knows to render the day-1 milestone
//      email and the active-state UI.
//   2. Flips any `active` cohort whose day-50 has ended (i.e.
//      start_date + 50 days <= today) to `completed` for every
//      active member. This is the "you're done" signal — the
//      cohort-arc panel hides its future cells and the milestone
//      cron's day-50 email fires once.
//
// Idempotent. Re-running on a day that's already been processed
// is a no-op (the status filters and the day-50 cutoff are
// re-checked).
//
// Auth: same shared-secret pattern as the existing
// /api/cron/buddy-expiry.

import { NextRequest, NextResponse } from 'next/server';
import { authedUserFromRequest } from '@/lib/auth-server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CRON_SECRET = process.env.CRON_SECRET || process.env.BUDDY_CRON_SECRET;

function authOk(req: NextRequest): boolean {
  if (!CRON_SECRET) return false;
  const qsSecret = new URL(req.url).searchParams.get('secret');
  if (qsSecret && qsSecret === CRON_SECRET) return true;
  const header = req.headers.get('authorization') ?? '';
  if (header === `Bearer ${CRON_SECRET}`) return true;
  return false;
}

export async function GET(req: NextRequest) {
  if (!authOk(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json(
      { error: 'Supabase env vars missing.' },
      { status: 503 }
    );
  }
  const admin = createClient<Database>(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const today = new Date();
  const todayIso = today.toISOString().slice(0, 10);
  const todayPlus50 = new Date(today);
  todayPlus50.setDate(todayPlus50.getDate() - 49); // start_date + 50 days <= today
  const todayPlus50Iso = todayPlus50.toISOString().slice(0, 10);

  // (1) Upcoming -> Active: cohorts whose start_date is today or
  //     earlier. We update the membership rows (set status =
  //     'active') so useCurrentCohort's filter still matches.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const upcomingRes = await (admin.from('cohort_memberships') as any)
    .update({ status: 'active' })
    .eq('status', 'upcoming')
    .lte('cohort:cohorts.start_date', todayIso);

  // (2) Active -> Completed: cohorts whose start_date + 50 days
  //     is on or before today.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doneRes = await (admin.from('cohort_memberships') as any)
    .update({ status: 'completed' })
    .eq('status', 'active')
    .lte('cohort:cohorts.start_date', todayPlus50Iso);

  return NextResponse.json({
    activated: upcomingRes.data ? (upcomingRes.data as unknown[]).length : 0,
    completed: doneRes.data ? (doneRes.data as unknown[]).length : 0,
  });
}
