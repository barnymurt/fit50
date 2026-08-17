#!/usr/bin/env node
/* eslint-disable */
/**
 * Grant or revoke `is_premium = TRUE` on an existing user.
 *
 * Assumes the user has already signed up via the site
 * (https://fit50challenge.io/#sign-up) so the auth.users row
 * and the auto-created profiles row already exist. This script
 * just flips the flag and stamps premium_purchased_at.
 *
 * Usage:
 *   node scripts/grant-premium.js you@example.com
 *   node scripts/grant-premium.js you@example.com --revoke
 *
 * Reads NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from
 * .env.local automatically.
 */

const fs = require('fs');
const path = require('path');

const envLocal = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envLocal)) {
  const lines = fs.readFileSync(envLocal, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error('Usage: node scripts/grant-premium.js <email> [--revoke]');
    process.exit(1);
  }

  const email = args[0];
  const revoke = args.includes('--revoke');
  const setPremium = !revoke;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
  }

  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Look up the auth.users row first so we can give a useful error
  // when the user hasn't signed up yet.
  const { data: listData, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error('Failed to list users:', listError.message);
    process.exit(1);
  }
  const target = listData?.users?.find((u) => u.email === email);
  if (!target) {
    console.error(
      `No Supabase auth.users row for "${email}".\n` +
      'Have they signed up at https://fit50challenge.io/#sign-up yet?'
    );
    process.exit(1);
  }

  // profiles.id is auth.users.id, so this upsert always lands.
  const { data, error } = await supabase
    .from('profiles')
    .upsert(
      {
        id: target.id,
        email,
        is_premium: setPremium,
        premium_purchased_at: setPremium ? new Date().toISOString() : null,
      },
      { onConflict: 'id' }
    )
    .select('id, email, is_premium, premium_purchased_at')
    .single();

  if (error) {
    console.error('Failed to update profile:', error.message);
    process.exit(1);
  }

  console.log(
    `✓ ${email} (${target.id}) -> is_premium = ${data.is_premium}` +
    (data.premium_purchased_at ? ` (since ${data.premium_purchased_at})` : '')
  );
}

main().catch((e) => {
  console.error('Failed:', e.message);
  process.exit(1);
});
