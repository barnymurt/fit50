// POST / DELETE /api/account/scheduled-start
//
// Persists the user's chosen future start date on
// profiles.scheduled_start_at. Distinct from
// profiles.challenge_started_at, which is the actual day the
// user committed. The StartSplash writes here on a future pick
// and the cohort-milestones / day-before-reminder crons can
// also consult it for cohort day-1 nudges.
//
// The day-of the start, the StartSplash surfaces a "your
// challenge is ready" CTA that calls the regular
// useTrackerState.updateStartDate (which writes
// challenge_started_at to today) and clears this field so the
// splash doesn't keep showing "X days till you start" with X
// going negative.
//
// Account creation is free and has no subscription component;
// this route requires the user to be signed in. The StartSplash
// also offers a "create an account" path if they aren't yet —
// that part doesn't change here.
//
// Auth: Bearer-token via Authorization header (see src/lib/auth-
// server.ts). Required because the app's session lives in
// localStorage rather than cookies.

import { NextRequest, NextResponse } from 'next/server';
import { authedUserFromRequest } from '@/lib/auth-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function POST(req: NextRequest) {
  const auth = await authedUserFromRequest(req);
  if ('error' in auth) return auth.error;
  const { admin, user } = auth.ctx;

  let body: { date?: unknown };
  try {
    body = (await req.json()) as { date?: unknown };
  } catch {
    return NextResponse.json({ error: 'Body must be JSON.' }, { status: 400 });
  }
  const date = typeof body.date === 'string' ? body.date.trim() : '';
  if (!DATE_RE.test(date)) {
    return NextResponse.json(
      { error: 'date must be YYYY-MM-DD.' },
      { status: 400 }
    );
  }
  // No scheduling in the past — yesterday's date is a no-op and
  // today should use the regular "start today" path on the
  // StartSplash.
  const todayIso = new Date().toISOString().slice(0, 10);
  if (date <= todayIso) {
    return NextResponse.json(
      {
        error:
          'Pick a future date. For today, use Start today on the StartSplash.',
      },
      { status: 400 }
    );
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin.from('profiles') as any)
    .update({ scheduled_start_at: date })
    .eq('id', user.id);
  if (error) {
    console.error('scheduled_start_at update failed:', error);
    return NextResponse.json(
      { error: 'Could not save the start date. Try again.' },
      { status: 500 }
    );
  }
  return NextResponse.json({ ok: true, scheduled_start_at: date });
}

export async function DELETE(req: NextRequest) {
  const auth = await authedUserFromRequest(req);
  if ('error' in auth) return auth.error;
  const { admin, user } = auth.ctx;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin.from('profiles') as any)
    .update({ scheduled_start_at: null })
    .eq('id', user.id);
  if (error) {
    console.error('scheduled_start_at clear failed:', error);
    return NextResponse.json(
      { error: 'Could not clear the start date. Try again.' },
      { status: 500 }
    );
  }
  return NextResponse.json({ ok: true });
}
