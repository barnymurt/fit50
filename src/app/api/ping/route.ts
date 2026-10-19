// GET /api/ping — minimal liveness check. Returns the current
// build SHA + timestamp. If you see this, the preview build is
// live and routing properly to API endpoints. If you see 404,
// the preview hasn't deployed the latest commit yet (or some
// other routing config is wrong).
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    pong: true,
    buildSha: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
    branch: process.env.VERCEL_GIT_COMMIT_REF ?? null,
    envName: process.env.VERCEL_ENV ?? null,
    builtAt: process.env.VERCEL_BUILD_TIME ?? null,
    now: new Date().toISOString(),
  });
}
