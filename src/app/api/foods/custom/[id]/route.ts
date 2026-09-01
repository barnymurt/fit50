// PATCH / DELETE /api/foods/custom/[id]
//
// PATCH — edit fields, submit/withdraw a community submission. RLS
// already enforces `auth.uid() = user_id` for UPDATE, so the admin
// client (below) is safe.
//
// DELETE — hard-delete the caller's own custom food.

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_NAME = 120;
const MAX_BRAND = 80;
const MAX_CATEGORY = 60;
const MAX_SUBCATEGORY = 60;
const MAX_LABEL = 40;
const MAX_ALIASES = 12;
const ALIAS_MAX = 60;
const UUID_RE = /^[0-9a-f-]{36}$/i;

function asStringOrNull(v: unknown, max: number, field: string): string | null | undefined {
  if (v === undefined) return undefined;
  if (v === null || v === '') return null;
  if (typeof v !== 'string') throw new Error(`${field} must be a string.`);
  const s = v.trim();
  if (s.length === 0) return null;
  if (s.length > max) throw new Error(`${field} too long (max ${max}).`);
  return s;
}
function asNumberOpt(
  v: unknown,
  min: number,
  max: number,
  field: string
): number | undefined {
  if (v === undefined) return undefined;
  if (v === null || v === '') return 0;
  const n = typeof v === 'string' ? Number(v) : (v as number);
  if (!Number.isFinite(n)) throw new Error(`${field} must be a number.`);
  if (n < min || n > max) throw new Error(`${field} out of range (${min}–${max}).`);
  return n;
}
function asAliasesOpt(v: unknown): string[] | undefined {
  if (v === undefined) return undefined;
  if (!Array.isArray(v)) throw new Error('aliases must be an array of strings.');
  const cleaned = v
    .map((x) => (typeof x === 'string' ? x.trim() : ''))
    .filter((s) => s.length > 0)
    .map((s) => (s.length > ALIAS_MAX ? s.slice(0, ALIAS_MAX) : s));
  if (cleaned.length > MAX_ALIASES) {
    throw new Error(`Too many aliases (max ${MAX_ALIASES}).`);
  }
  return cleaned;
}
function asSubmissionStatus(v: unknown): 'pending_review' | 'private' {
  if (v === 'pending_review') return 'pending_review';
  return 'private';
}

interface PatchBody {
  name?: unknown;
  brand?: unknown;
  category?: unknown;
  subcategory?: unknown;
  preparation?: unknown;
  state?: unknown;
  type?: unknown;
  kcal?: unknown;
  protein?: unknown;
  carbs?: unknown;
  fat?: unknown;
  fiber?: unknown;
  serving_basis?: unknown;
  standard_serving_grams?: unknown;
  standard_serving_label?: unknown;
  aliases?: unknown;
  submission_status?: unknown;
}

async function getAuthedContext() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseService = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseAnon || !supabaseService) {
    return { error: NextResponse.json({ error: 'Supabase env vars missing.' }, { status: 503 }) };
  }
  const cookieStore = cookies();
  const ssr = createServerClient<Database>(supabaseUrl, supabaseAnon, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
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
  const { data: { user } } = await ssr.auth.getUser();
  if (!user?.id) {
    return { error: NextResponse.json({ error: 'Not signed in.' }, { status: 401 }) };
  }
  const admin = createClient<Database>(supabaseUrl, supabaseService, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return { admin, user };
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  if (!id || !UUID_RE.test(id)) {
    return NextResponse.json({ error: 'Invalid id.' }, { status: 400 });
  }

  let body: PatchBody;
  try {
    body = (await req.json()) as PatchBody;
  } catch {
    return NextResponse.json({ error: 'Body must be JSON.' }, { status: 400 });
  }

  const ctx = await getAuthedContext();
  if ('error' in ctx) return ctx.error;
  const { admin, user } = ctx;

  const update: Record<string, unknown> = {};
  try {
    if ('name' in body) {
      const n = asStringOrNull(body.name, MAX_NAME, 'name');
      if (n !== undefined && !n) {
        return NextResponse.json({ error: 'name cannot be empty.' }, { status: 400 });
      }
      if (n !== undefined) update.name = n;
    }
    if ('brand' in body) {
      const v = asStringOrNull(body.brand, MAX_BRAND, 'brand');
      if (v !== undefined) update.brand = v;
    }
    if ('category' in body) {
      const c = asStringOrNull(body.category, MAX_CATEGORY, 'category');
      update.category = c ?? 'Other';
    }
    if ('subcategory' in body) {
      const v = asStringOrNull(body.subcategory, MAX_SUBCATEGORY, 'subcategory');
      if (v !== undefined) update.subcategory = v;
    }
    if ('preparation' in body) {
      const v = asStringOrNull(body.preparation, MAX_LABEL, 'preparation');
      if (v !== undefined) update.preparation = v;
    }
    if ('state' in body) {
      const v = asStringOrNull(body.state, MAX_LABEL, 'state');
      if (v !== undefined) update.state = v;
    }
    if ('type' in body) {
      const t = asStringOrNull(body.type, MAX_LABEL, 'type');
      update.type = t ?? 'ingredient';
    }
    if ('kcal' in body) {
      const v = asNumberOpt(body.kcal, 0, 9999, 'kcal');
      if (v !== undefined) update.kcal = v;
    }
    if ('protein' in body) {
      const v = asNumberOpt(body.protein, 0, 999, 'protein');
      if (v !== undefined) update.protein = v;
    }
    if ('carbs' in body) {
      const v = asNumberOpt(body.carbs, 0, 999, 'carbs');
      if (v !== undefined) update.carbs = v;
    }
    if ('fat' in body) {
      const v = asNumberOpt(body.fat, 0, 999, 'fat');
      if (v !== undefined) update.fat = v;
    }
    if ('fiber' in body) {
      const v = asNumberOpt(body.fiber, 0, 999, 'fiber');
      if (v !== undefined) update.fiber = v;
    }
    if ('serving_basis' in body) {
      const v = asStringOrNull(body.serving_basis, 16, 'serving_basis');
      if (v !== undefined) update.serving_basis = v ?? '100g';
    }
    if ('standard_serving_grams' in body) {
      const v = asNumberOpt(body.standard_serving_grams, 0, 9999, 'standard_serving_grams');
      if (v !== undefined) update.standard_serving_grams = v > 0 ? v : 100;
    }
    if ('standard_serving_label' in body) {
      const v = asStringOrNull(body.standard_serving_label, MAX_LABEL, 'standard_serving_label');
      if (v !== undefined) update.standard_serving_label = v ?? '100 g';
    }
    if ('aliases' in body) {
      const v = asAliasesOpt(body.aliases);
      if (v !== undefined) update.aliases = v;
    }
    if ('submission_status' in body) {
      const status = asSubmissionStatus(body.submission_status);
      update.submission_status = status;
      update.submitted_at = status === 'pending_review' ? new Date().toISOString() : null;
    }
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No fields to update.' }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: row, error } = await (admin.from('user_custom_foods') as any)
    .update(update)
    .eq('id', id)
    .eq('user_id', user.id)
    .select('*')
    .single();

  if (error) {
    console.error('user_custom_foods update failed:', error);
    return NextResponse.json(
      { error: 'Could not update the custom food. Try again.' },
      { status: 500 }
    );
  }
  if (!row) {
    return NextResponse.json(
      { error: 'No custom food with that id.' },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true, food: row });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  if (!id || !UUID_RE.test(id)) {
    return NextResponse.json({ error: 'Invalid id.' }, { status: 400 });
  }

  const ctx = await getAuthedContext();
  if ('error' in ctx) return ctx.error;
  const { admin, user } = ctx;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin.from('user_custom_foods') as any)
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error('user_custom_foods delete failed:', error);
    return NextResponse.json(
      { error: 'Could not delete the custom food. Try again.' },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}