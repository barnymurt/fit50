// PATCH /api/cohort/preferences
//
// Updates per-cohort preferences on the user's own
// cohort_memberships row. Today the only preference is
// show_display_name, but the route is shaped to accept more
// keys in the future without breaking clients.
//
// RLS scopes the UPDATE to the user's own row, and the column
// list is whitelisted so callers can't sneak in a status
// change or anonymous_handle swap via this route.

import { NextRequest, NextResponse } from 'next/server';
import { authedUserFromRequest } from '@/lib/auth-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Whitelisted columns the user is allowed to update. Anything
// not in this list is silently dropped — this route is for
// preferences, not membership mutations.
const ALLOWED_COLUMNS = new Set(['show_display_name']);

export async function PATCH(req: NextRequest) {
  const auth = await authedUserFromRequest(req);
  if ('error' in auth) return auth.error;
  const { admin, user } = auth.ctx;

  let body: { cohort_id?: string; show_display_name?: boolean } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }
  const cohortId = body.cohort_id;
  if (!cohortId) {
    return NextResponse.json({ error: 'cohort_id is required.' }, { status: 400 });
  }
  if (typeof body.show_display_name !== 'boolean') {
    return NextResponse.json(
      { error: 'show_display_name must be a boolean.' },
      { status: 400 }
    );
  }

  // Build the update payload from the whitelisted keys.
  const update: Record<string, unknown> = {};
  for (const k of Object.keys(body)) {
    if (ALLOWED_COLUMNS.has(k)) update[k] = (body as Record<string, unknown>)[k];
  }
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No updatable fields.' }, { status: 400 });
  }

  // Only update live memberships — you can't change preferences
  // on a cohort you've left or completed (the row is preserved
  // for analytics).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin.from('cohort_memberships') as any)
    .update(update)
    .eq('cohort_id', cohortId)
    .eq('user_id', user.id)
    .in('status', ['upcoming', 'active'])
    .select('id')
    .maybeSingle();
  if (error) {
    return NextResponse.json(
      { error: error.message || 'Could not update preference.' },
      { status: 500 }
    );
  }
  if (!data) {
    return NextResponse.json(
      { error: 'No active membership for that cohort.' },
      { status: 404 }
    );
  }
  return NextResponse.json({ ok: true });
}
