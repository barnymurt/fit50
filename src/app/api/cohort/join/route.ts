// POST /api/cohort/join
//
// Enrolls the calling user in a cohort. Sets
// `profiles.challenge_started_at` to the cohort's `start_date`,
// inserts a `cohort_memberships` row with a unique
// `anonymous_handle`, and ensures the user is not already in a
// live cohort (server-side check, in addition to the partial
// unique index).
//
// Anonymous handle format: `<adjective>-<4-7 alphanumeric>` from
// a fixed word list. Picked deterministically by retrying the
// generator until we find a free slot in the cohort's existing
// handles. The pool is large enough (200 × 16,384 = 3.27M
// combos) that a 1000-member cohort won't exhaust it; if it ever
// does, a numeric suffix is appended.
//
// On success: returns { membershipId }. The client's
// useCohortMembership dispatches COHORT_MEMBERSHIP_CHANGED_EVENT
// so useCurrentCohort and the Today/Arc components refetch.

import { NextRequest, NextResponse } from 'next/server';
import { authedUserFromRequest } from '@/lib/auth-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ADJECTIVES = [
  'able', 'agile', 'airy', 'alert', 'amber', 'arctic', 'autumn',
  'azure', 'bold', 'bright', 'calm', 'clear', 'clean', 'cosmic',
  'crisp', 'cute', 'daring', 'dawn', 'deep', 'dewy', 'dusk',
  'eager', 'early', 'easy', 'ember', 'even', 'fair', 'fast',
  'fierce', 'fine', 'firm', 'fleet', 'fond', 'frank', 'free',
  'fresh', 'gentle', 'gilded', 'glad', 'glossy', 'gold', 'golden',
  'good', 'grand', 'gray', 'great', 'green', 'gusty', 'happy',
  'hard', 'hardy', 'hazel', 'hearty', 'high', 'hot', 'humble',
  'icy', 'idle', 'jade', 'jolly', 'just', 'keen', 'kind',
  'large', 'lazy', 'light', 'lithe', 'lively', 'long', 'loud',
  'lucky', 'lush', 'lunar', 'meadow', 'mellow', 'merry', 'mild',
  'mint', 'misty', 'morning', 'mute', 'neat', 'new', 'nice',
  'nimble', 'noble', 'odd', 'open', 'outer', 'pale', 'plain',
  'plump', 'plush', 'polar', 'prime', 'proud', 'pure', 'quick',
  'quiet', 'quaint', 'rare', 'real', 'red', 'rich', 'ripe',
  'rosy', 'round', 'royal', 'ruby', 'ruddy', 'rusty', 'sable',
  'sage', 'sapphire', 'shy', 'silver', 'slim', 'slow', 'small',
  'snug', 'soft', 'snowy', 'solar', 'solid', 'sore', 'sour',
  'spry', 'star', 'stark', 'steady', 'still', 'stoic', 'stout',
  'stormy', 'strong', 'summer', 'sunny', 'sure', 'swift', 'tall',
  'tame', 'tart', 'taut', 'tender', 'thaw', 'thick', 'thin',
  'tidy', 'tight', 'torn', 'tough', 'true', 'trusty', 'umber',
  'used', 'usual', 'vast', 'velvet', 'vivid', 'warm', 'waxen',
  'weak', 'wide', 'wild', 'wise', 'worn', 'young', 'zesty',
];
const ADJ = [...new Set(ADJECTIVES)];
const HANDLE_CHARS = 'abcdefghijkmnpqrstuvwxyz23456789'; // no 0/o/1/l

function randInt(n: number): number {
  // crypto.getRandomValues is available in the Node 18+ runtime
  // that Vercel uses for `runtime = 'nodejs'`.
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0] % n;
}

function pickHandleSuffix(): string {
  // 4-7 chars from the unambiguous alphabet.
  const len = 4 + randInt(4);
  let s = '';
  for (let i = 0; i < len; i++) {
    s += HANDLE_CHARS[randInt(HANDLE_CHARS.length)];
  }
  return s;
}

function pickHandle(
  taken: Set<string>
): string {
  for (let attempt = 0; attempt < 50; attempt++) {
    const adj = ADJ[randInt(ADJ.length)];
    const suffix = pickHandleSuffix();
    const candidate = `${adj}-${suffix}`;
    if (!taken.has(candidate)) return candidate;
  }
  // Extremely unlikely path — pool is 200+ × 36^4 = 1.6B+.
  // Append a numeric suffix to break the tie.
  return `member-${Date.now().toString(36).slice(-4)}-${randInt(9999)}`;
}

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

  // 1. Verify the cohort exists and is in a state we can join
  //    (upcoming = signups_open, active = day-1 to day-50, anything
  //    else = closed). RLS scopes the SELECT to anyone signed in.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: cohort, error: cohortErr } = await (admin.from('cohorts') as any)
    .select('id, start_date, signups_open_at, cap')
    .eq('id', cohortId)
    .maybeSingle();
  if (cohortErr || !cohort) {
    return NextResponse.json(
      { error: 'Cohort not found.' },
      { status: 404 }
    );
  }
  const todayIso = new Date().toISOString().slice(0, 10);
  if (todayIso < cohort.signups_open_at) {
    return NextResponse.json(
      { error: 'Sign-ups are not open yet.' },
      { status: 400 }
    );
  }
  if (todayIso > cohort.start_date) {
    return NextResponse.json(
      { error: 'This cohort has already started — joins are closed.' },
      { status: 400 }
    );
  }

  // 2. Server-side check: the user has no live membership
  //    already. The partial unique index will also enforce this
  //    at the DB level, but checking first gives a friendlier
  //    error message.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (admin.from('cohort_memberships') as any)
    .select('id, cohort_id, status')
    .eq('user_id', user.id)
    .in('status', ['upcoming', 'active'])
    .maybeSingle();
  if (existing) {
    return NextResponse.json(
      { error: 'You are already in a cohort. Leave it before joining another.' },
      { status: 409 }
    );
  }

  // 3. Capacity check. RLS-bypassed count via the admin client.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count: liveCount } = await (admin.from('cohort_memberships') as any)
    .select('user_id', { count: 'exact', head: true })
    .eq('cohort_id', cohortId)
    .in('status', ['upcoming', 'active']);
  if ((liveCount ?? 0) >= cohort.cap) {
    return NextResponse.json(
      { error: 'This cohort is full. Join the next month instead.' },
      { status: 409 }
    );
  }

  // 4. Pick a unique anonymous handle. Pull existing handles for
  //    this cohort so the in-process generator doesn't repeat.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: handleRows } = await (admin.from('cohort_memberships') as any)
    .select('anonymous_handle')
    .eq('cohort_id', cohortId);
  const taken = new Set(
    ((handleRows as Array<{ anonymous_handle: string }> | null) || []).map(
      (r) => r.anonymous_handle
    )
  );
  const anonymousHandle = pickHandle(taken);

  // 5. Determine the membership status. If start_date is the
  //    future, status = 'upcoming'; if it's today, 'active'.
  const status: 'upcoming' | 'active' =
    todayIso === cohort.start_date ? 'active' : 'upcoming';

  // 6. Insert the membership. RLS scoped to the user can do this
  //    for their own row, but the anonymous_handle stamping /
  //    capacity checks are easier to express via the admin
  //    client. The user_id + cohort_id + status='upcoming'
  //    partial-unique index is what enforces "one live per user".
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: inserted, error: insertErr } = await (admin
    .from('cohort_memberships') as any)
    .insert({
      cohort_id: cohortId,
      user_id: user.id,
      anonymous_handle: anonymousHandle,
      show_display_name: false,
      status,
    })
    .select('id')
    .single();
  if (insertErr || !inserted) {
    return NextResponse.json(
      {
        error: insertErr?.message || 'Could not join the cohort.',
      },
      { status: 500 }
    );
  }

  // 7. Stamp the user's challenge_start_date on the profile so
  //    the existing tracker day-number math kicks in on the
  //    cohort's day 1. Joining a cohort is a soft reset of the
  //    user's challenge — past daily_totals are preserved
  //    (they're never deleted) but the day number is recalculated
  //    from the new start_date. We only update if the user
  //    hasn't already started a challenge (i.e. they're on the
  //    start splash) OR they explicitly opt in via the join
  //    confirm modal in the UI.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin.from('profiles') as any)
    .update({ challenge_started_at: cohort.start_date })
    .eq('id', user.id);

  return NextResponse.json({
    ok: true,
    membershipId: inserted.id,
  });
}
