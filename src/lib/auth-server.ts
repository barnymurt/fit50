// Server-side auth helper. The app's browser client stores the
// Supabase session in localStorage (see src/lib/supabase.ts) rather
// than cookies. `createServerClient` from @supabase/ssr would only
// see cookies, so route handlers that depend on it can fail with
// "Not signed in" even when the user is logged in.
//
// This helper takes the NextRequest, pulls the Bearer token out of
// the Authorization header, and validates it against the Supabase
// project using the admin client. Works whether or not cookies are
// set — the browser sends the token explicitly in the fetch header.

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from './supabase';

export interface AuthedContext {
  admin: ReturnType<typeof createClient<Database>>;
  user: { id: string; email?: string | null };
}

export async function authedUserFromRequest(
  req: NextRequest
): Promise<{ error: NextResponse } | { ctx: AuthedContext }> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseService = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseService) {
    return {
      error: NextResponse.json(
        { error: 'Supabase env vars missing.' },
        { status: 503 }
      ),
    };
  }

  const authHeader = req.headers.get('authorization') ?? '';
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  const token = match ? match[1].trim() : null;
  if (!token) {
    return {
      error: NextResponse.json({ error: 'Not signed in.' }, { status: 401 }),
    };
  }

  const admin = createClient<Database>(supabaseUrl, supabaseService, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data?.user?.id) {
    return {
      error: NextResponse.json(
        { error: 'Not signed in — token invalid or expired.' },
        { status: 401 }
      ),
    };
  }
  return {
    ctx: {
      admin,
      user: { id: data.user.id, email: data.user.email ?? null },
    },
  };
}
