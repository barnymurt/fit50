// POST /api/foods/custom
//
// Body: full food fields + an optional `submit_to_community` boolean.
// On submit: validates ranges, applies the standard serving default
// (100g) if the caller left it blank, stamps `submission_status`
// ('private' or 'pending_review'), and inserts.
//
// The body shape matches what FoodSearch.onPickFood consumes, so a
// freshly-created custom food plugs straight into the food log,
// favourites, and meal-bundle flows without translation.
//
// Source field is `'manual'` by default; the LLM-extraction hook
// (`'llm'`) is reserved for a follow-up.

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import type { Database } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface CreateBody {
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
  source?: unknown;
  submit_to_community?: unknown;
}

const MAX_NAME = 120;
const MAX_BRAND = 80;
const MAX_CATEGORY = 60;
const MAX_SUBCATEGORY = 60;
const MAX_LABEL = 40;
const MAX_ALIASES = 12;
const ALIAS_MAX = 60;

function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function asString(v: unknown, max: number, field: string): string | null {
  if (v === undefined || v === null || v === '') return null;
  if (typeof v !== 'string') throw new Error(`${field} must be a string.`);
  const s = v.trim();
  if (s.length === 0) return null;
  if (s.length > max) throw new Error(`${field} too long (max ${max}).`);
  return s;
}

function asNumber(v: unknown, min: number, max: number, field: string): number {
  if (v === undefined || v === null || v === '') return 0;
  const n = typeof v === 'string' ? Number(v) : (v as number);
  if (!Number.isFinite(n)) throw new Error(`${field} must be a number.`);
  if (n < min || n > max) throw new Error(`${field} out of range (${min}–${max}).`);
  return n;
}

function asBool(v: unknown): boolean {
  return v === true || v === 'true' || v === 1 || v === '1';
}

function asAliases(v: unknown): string[] {
  if (v === undefined || v === null) return [];
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

export async function POST(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnon) {
    return NextResponse.json(
      { error: 'Supabase env vars missing.' },
      { status: 503 }
    );
  }

  let body: CreateBody;
  try {
    body = (await req.json()) as CreateBody;
  } catch {
    return bad('Body must be JSON.');
  }

  let name: string;
  let brand: string | null;
  let category: string;
  let subcategory: string | null;
  let preparation: string | null;
  let state: string | null;
  let type: string;
  let kcal: number;
  let protein: number;
  let carbs: number;
  let fat: number;
  let fiber: number;
  let serving_basis: string;
  let standard_serving_grams: number | null;
  let standard_serving_label: string;
  let aliases: string[];
  let source: 'manual' | 'llm';
  let submitToCommunity: boolean;

  try {
    const n = asString(body.name, MAX_NAME, 'name');
    if (!n) return bad('name is required.');
    name = n;
    brand = asString(body.brand, MAX_BRAND, 'brand');
    category = asString(body.category, MAX_CATEGORY, 'category') ?? 'Other';
    subcategory = asString(body.subcategory, MAX_SUBCATEGORY, 'subcategory');
    preparation = asString(body.preparation, MAX_LABEL, 'preparation');
    state = asString(body.state, MAX_LABEL, 'state');
    type = asString(body.type, MAX_LABEL, 'type') ?? 'ingredient';
    kcal = asNumber(body.kcal, 0, 9999, 'kcal');
    protein = asNumber(body.protein, 0, 999, 'protein');
    carbs = asNumber(body.carbs, 0, 999, 'carbs');
    fat = asNumber(body.fat, 0, 999, 'fat');
    fiber = asNumber(body.fiber, 0, 999, 'fiber');
    serving_basis = asString(body.serving_basis, 16, 'serving_basis') ?? '100g';
    const ssg = asNumber(body.standard_serving_grams, 0, 9999, 'standard_serving_grams');
    standard_serving_grams = ssg > 0 ? ssg : 100;
    standard_serving_label =
      asString(body.standard_serving_label, MAX_LABEL, 'standard_serving_label') ??
      '100 g';
    aliases = asAliases(body.aliases);
    source = body.source === 'llm' ? 'llm' : 'manual';
    submitToCommunity = asBool(body.submit_to_community);
  } catch (err) {
    return bad((err as Error).message);
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
    return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
  }

  const submission_status = submitToCommunity ? 'pending_review' : 'private';
  const submitted_at = submitToCommunity ? new Date().toISOString() : null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: row, error } = await (ssr.from('user_custom_foods') as any)
    .insert({
      user_id: user.id,
      name,
      brand,
      category,
      subcategory,
      preparation,
      state,
      type,
      kcal,
      protein,
      carbs,
      fat,
      fiber,
      serving_basis,
      standard_serving_grams,
      standard_serving_label,
      aliases,
      source,
      submission_status,
      submitted_at,
    })
    .select('*')
    .single();

  if (error) {
    console.error('user_custom_foods insert failed:', error);
    return NextResponse.json(
      { error: 'Could not save the custom food. Try again.' },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, food: row });
}

// GET — list the caller's custom foods (used by FoodSearch to merge
// custom results into the search panel).
export async function GET(_req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnon) {
    return NextResponse.json(
      { error: 'Supabase env vars missing.' },
      { status: 503 }
    );
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
    return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rows, error } = await (ssr.from('user_custom_foods') as any)
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(500);

  if (error) {
    console.error('user_custom_foods list failed:', error);
    return NextResponse.json(
      { error: 'Could not load custom foods. Try again.' },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, foods: rows ?? [] });
}