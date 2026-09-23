// DELETE /api/weight?day_key=YYYY-MM-DD
//
// Remove a weight reading. Used when a user accidentally logs the
// wrong value and wants a clean slate.

import { NextRequest, NextResponse } from 'next/server';
import { authedUserFromRequest } from '@/lib/auth-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function DELETE(req: NextRequest) {
  const auth = await authedUserFromRequest(req);
  if ('error' in auth) return auth.error;
  const { admin, user } = auth.ctx;

  const day_key = req.nextUrl.searchParams.get('day_key');
  if (!day_key || !/^\d{4}-\d{2}-\d{2}$/.test(day_key)) {
    return NextResponse.json(
      { error: 'day_key query param (YYYY-MM-DD) is required.' },
      { status: 400 }
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin.from('weight_log') as any)
    .delete()
    .eq('user_id', user.id)
    .eq('day_key', day_key);

  if (error) {
    console.error('weight delete failed', error);
    return NextResponse.json(
      { error: 'Could not delete the weight reading.' },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
