// POST /api/weight
//
// Upsert a single weight reading for the calling user. The
// (user_id, day_key) primary key on weight_log means re-weighing
// the same day replaces the prior reading — useful for when a user
// mistypes 70.5 instead of 75.0.
//
// Body: { day_key: 'YYYY-MM-DD', weight_kg: number, notes?: string }
// Response on success: { ok, reading: { day_key, weight_kg, notes } }
//
// Used by the analytics "Weight progress" quick-add form. We
// intentionally don't return any other readings — the analytics
// tab pulls the full series through useFoodAnalytics so we don't
// double-fetch.

import { NextRequest, NextResponse } from 'next/server';
import { authedUserFromRequest } from '@/lib/auth-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface WeightBody {
  day_key?: unknown;
  weight_kg?: unknown;
  notes?: unknown;
}

const DAY_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;
const NOTES_MAX = 280;

function validateDayKey(s: string): string | null {
  if (!DAY_KEY_RE.test(s)) return null;
  // Reject impossible calendar dates like 2025-13-40 that the regex
  // admits but Date rejects. Round-tripping through Date in UTC is
  // enough for a YYYY-MM-DD string check.
  const [y, m, d] = s.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (
    dt.getUTCFullYear() !== y ||
    dt.getUTCMonth() !== m - 1 ||
    dt.getUTCDate() !== d
  ) {
    return null;
  }
  return s;
}

export async function POST(req: NextRequest) {
  const auth = await authedUserFromRequest(req);
  if ('error' in auth) return auth.error;
  const { admin, user } = auth.ctx;

  let body: WeightBody;
  try {
    body = (await req.json()) as WeightBody;
  } catch {
    return NextResponse.json({ error: 'Body must be JSON.' }, { status: 400 });
  }

  if (typeof body.day_key !== 'string') {
    return NextResponse.json(
      { error: 'day_key is required.' },
      { status: 400 }
    );
  }
  const day_key = validateDayKey(body.day_key);
  if (!day_key) {
    return NextResponse.json(
      { error: 'day_key must be a valid YYYY-MM-DD date.' },
      { status: 400 }
    );
  }

  const weightNum =
    typeof body.weight_kg === 'string'
      ? Number(body.weight_kg)
      : (body.weight_kg as number);
  if (!Number.isFinite(weightNum) || weightNum <= 0 || weightNum >= 500) {
    return NextResponse.json(
      { error: 'weight_kg must be a positive number under 500.' },
      { status: 400 }
    );
  }
  // Two decimals of precision — sub-100g fluctuation is meaningful
  // for the projection chart, but three decimals becomes noise.
  const weight_kg = Math.round(weightNum * 100) / 100;

  const notes =
    typeof body.notes === 'string' && body.notes.trim().length > 0
      ? body.notes.trim().slice(0, NOTES_MAX)
      : null;

  // Upsert via the (user_id, day_key) primary key. Returning the
  // updated row so the client can refresh the local state without
  // a follow-up GET.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin.from('weight_log') as any)
    .upsert(
      {
        user_id: user.id,
        day_key,
        weight_kg,
        notes,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,day_key' }
    )
    .select('day_key, weight_kg, notes')
    .single();

  if (error) {
    console.error('weight upsert failed', error);
    return NextResponse.json(
      {
        error:
          err_message(error) ?? 'Could not save the weight reading.',
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, reading: data });
}

function err_message(err: unknown): string | null {
  if (err && typeof err === 'object' && 'message' in err) {
    const msg = (err as { message: unknown }).message;
    if (typeof msg === 'string' && msg.length > 0) return msg;
  }
  return null;
}
