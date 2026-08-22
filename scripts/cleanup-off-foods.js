#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Wipe OFF-sourced rows from `foods` (id is purely numeric, i.e.
 * OFF barcode-style). Lets us re-promote a clean run after fixing
 * the seed script without the previous unfiltered leftovers.
 *
 * Curated rows have an id prefix (cur-…) so they're not touched.
 */

const SUPABASE_URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

async function countMatching(prefix) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/foods?select=id&limit=1&id=like.${prefix}*`,
    {
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, Prefer: 'count=exact' },
    }
  );
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`count ${prefix}: ${res.status} ${body}`);
  }
  const header = res.headers.get('content-range');
  // "0-499/40000" or "*/40000" pattern
  const m = header && header.match(/\/(\d+)$/);
  return m ? parseInt(m[1], 10) : 0;
}

async function deleteMatching(prefix) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/foods?id=like.${prefix}*`,
    {
      method: 'DELETE',
      headers: {
        apikey: KEY,
        Authorization: `Bearer ${KEY}`,
        Prefer: 'count=exact',
      },
    }
  );
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`delete ${prefix}: ${res.status} ${body}`);
  }
  const header = res.headers.get('content-range');
  const m = header && header.match(/\/(\d+)$/);
  return m ? parseInt(m[1], 10) : 0;
}

async function main() {
  let totalDeleted = 0;
  for (const digit of '0123456789') {
    const before = await countMatching(digit);
    if (before === 0) continue;
    const deleted = await deleteMatching(digit);
    totalDeleted += deleted;
    console.log(`  id LIKE "${digit}*": ${deleted} deleted (was ${before})`);
  }
  console.log(`Total OFF rows deleted: ${totalDeleted}`);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});