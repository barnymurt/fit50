// GET /api/ping — minimal liveness check. Returns the current
// build SHA + the deployment URL Vercel knows about. If you see
// this, the preview build is live and routing properly to API
// endpoints. If you see 404, the preview hasn't deployed the
// latest commit yet (or some other routing config is wrong).
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const u = new URL(req.url);
  return NextResponse.json({
    pong: true,
    requestedAt: u.toString(),
    requestHost: u.host,
    env: {
      VERCEL_ENV: process.env.VERCEL_ENV ?? null,
      VERCEL_URL: process.env.VERCEL_URL ?? null,
      VERCEL_GIT_COMMIT_SHA: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
      VERCEL_GIT_COMMIT_REF: process.env.VERCEL_GIT_COMMIT_REF ?? null,
      VERCEL_BUILD_TIME: process.env.VERCEL_BUILD_TIME ?? null,
    },
    now: new Date().toISOString(),
  });
}
