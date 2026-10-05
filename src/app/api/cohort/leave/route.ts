// POST /api/cohort/leave
//
// Soft-deletes the user's live membership in a cohort. The
// status flips to 'left' so the partial unique index releases
// the user (they can join a different cohort immediately) and so
// the historical row is preserved for analytics ("how many of
// the November 2025 starters bailed by day 7?"). challenge_started_at
// is NOT reset here — leaving the cohort doesn't restart the
// challenge; the user keeps their day number. Re-joining a new
// cohort later will reset it.

import { NextRequest, NextResponse } from 'next/server';
import { authedUserFromRequest } from '@/lib/auth-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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

  // RLS scopes the UPDATE to the user's own row, so the
  // service-role key isn't strictly required here. Use the admin
  // client anyway for symmetry with the other cohort routes.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin.from('cohort_memberships') as any)
    .update({ status: 'left' })
    .eq('cohort_id', cohortId)
    .eq('user_id', user.id)
    .in('status', ['upcoming', 'active'])
    .select('id')
    .maybeSingle();
  if (error) {
    return NextResponse.json(
      { error: error.message || 'Could not leave the cohort.' },
      { status: 500 }
    );
  }
  if (!data) {
    // Nothing to leave — they weren't a live member. Treat as a
    // no-op success so the UI can fire this on cohort-id changes
    // without worrying about state.
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ ok: true });
}
