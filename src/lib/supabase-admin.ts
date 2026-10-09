// supabase-admin.ts — service-role Supabase client for the
// content engine. Used by all /api/ce/* routes. The editor is
// single-user (env-var password) in v1; the API routes always
// run as the service role. Phase 6 swaps in real Supabase auth
// + per-user RLS.

import { createClient } from '@supabase/supabase-js';
import type { Database } from './supabase';

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      'Supabase admin client requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY. ' +
        'Add them to .env.local and to Vercel env vars for production.'
    );
  }
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
