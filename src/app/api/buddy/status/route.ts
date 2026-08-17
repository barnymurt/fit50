// GET /api/buddy/status
//
// Returns the current buddy purchase state for the authenticated
// purchaser. Used by the /account/buddy dashboard card.

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseAnon || !supabaseServiceKey) {
    return NextResponse.json({ error: 'supabase not configured' }, { status: 503 });
  }

  const cookieStore = cookies();
  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnon, {
    cookies: {
      getAll() { return cookieStore.getAll(); },
      setAll(toSet) {
        try {
          toSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // ignored
        }
      },
    },
  });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id) {
    return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
  }

  const admin = createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: row, error } = await (admin.from('buddy_purchases') as any)
    .select('id, buddy_email, buddy_name, status, created_at, expires_at, activated_at')
    .eq('purchaser_user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('buddy status lookup failed:', error);
    return NextResponse.json({ error: 'lookup failed' }, { status: 500 });
  }

  if (!row) {
    return NextResponse.json({ has_buddy: false });
  }

  return NextResponse.json({
    has_buddy: true,
    id: row.id,
    buddy_email: row.buddy_email,
    buddy_name: row.buddy_name,
    status: row.status,
    created_at: row.created_at,
    expires_at: row.expires_at,
    activated_at: row.activated_at,
  });
}
