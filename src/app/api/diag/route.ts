// GET /api/_diag
//
// Read-only diagnostic for the cohort preview. Returns JSON
// showing the env vars present in the current build, whether the
// anon key works against the Supabase project, and what the
// cohort query returns.
//
// Lives outside /api/cohort/* so it has no security surface
// besides the Vercel Authentication wall (which protects the
// whole preview deploy). On production deployments
// (VERCEL_ENV === 'production'), this route returns a 404 to
// avoid leaking config to real visitors.
//
// This file ships ONCE for diagnosis and gets removed once the
// preview works. Like every temporary affordance in this
// codebase, it's named with a leading underscore so it's
// visually obvious.
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  if (process.env.VERCEL_ENV === 'production') {
    return NextResponse.json({ hidden: true }, { status: 404 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? null;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? null;
  const svcKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? null;

  const keyTail = anonKey ? `…${anonKey.slice(-12)}` : null;
  const claims = anonKey ? jwtClaims(anonKey) : null;

  // 1. anon key — auth health
  let anonHealth: { status: number; ok: boolean } | null = null;
  let anonRest: { status: number; ok: boolean; bodySample?: string } | null = null;
  if (url && anonKey) {
    try {
      const hr = await fetch(`${url}/auth/v1/health`, {
        headers: { apikey: anonKey },
      });
      anonHealth = { status: hr.status, ok: hr.ok };
      const rr = await fetch(`${url}/rest/v1/cohorts?select=id,name,start_date&limit=2`, {
        headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
      });
      const txt = await rr.text();
      anonRest = {
        status: rr.status,
        ok: rr.ok,
        bodySample: txt.slice(0, 200),
      };
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'unknown';
      anonRest = { status: 0, ok: false, bodySample: msg };
    }
  }

  // 2. service-role — what the actual data looks like
  let svcCohorts: { ok: boolean; count: number; sample?: Array<{ name: string; start_date: string; signups_open_at: string }> } | null = null;
  if (url && svcKey) {
    try {
      const sb = createClient();
      const { data, error } = await (sb as any)
        .from('cohorts')
        .select('name,start_date,signups_open_at')
        .order('start_date', { ascending: true })
        .limit(4);
      svcCohorts = {
        ok: !error,
        count: data?.length ?? 0,
        sample: data,
      };
    } catch (e) {
      svcCohorts = { ok: false, count: 0 };
    }
  }

  return NextResponse.json({
    env: {
      VERCEL_ENV: process.env.VERCEL_ENV ?? null,
      NODE_ENV: process.env.NODE_ENV ?? null,
      NEXT_PUBLIC_SUPABASE_URL_present: !!url,
      NEXT_PUBLIC_SUPABASE_ANON_KEY_present: !!anonKey,
      SUPABASE_SERVICE_ROLE_KEY_present: !!svcKey,
      anonKeyTail: keyTail,
      anonKeyClaims: claims,
    },
    probes: {
      anonHealth,
      anonRest,
      svcCohorts,
    },
    timestamp: new Date().toISOString(),
  });
}

function jwtClaims(jwt: string): Record<string, unknown> | null {
  const parts = jwt.split('.');
  if (parts.length < 2) return null;
  try {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    return {
      iss: payload.iss,
      ref: payload.ref,
      role: payload.role,
      iat: payload.iat ? new Date(payload.iat * 1000).toISOString() : null,
      exp: payload.exp ? new Date(payload.exp * 1000).toISOString() : null,
    };
  } catch {
    return null;
  }
}
