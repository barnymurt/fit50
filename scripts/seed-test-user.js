#!/usr/bin/env node
/* eslint-disable */
/**
 * Create a test user via the Supabase admin API. Useful for:
 *  - Testing login/logout without going through the sign-up form
 *  - Seeding a premium user to test gated features
 *  - Resetting your test account if you forgot the password
 *
 * Usage:
 *   node scripts/seed-test-user.js you@example.com yourpassword
 *   node scripts/seed-test-user.js you@example.com yourpassword --premium
 *
 * Reads NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from
 * .env.local automatically. Falls back to process.env if running in CI.
 */

const fs = require('fs');
const path = require('path');

// Load .env.local into process.env so the Supabase client picks them up
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
  if (args.length < 2) {
    console.error('Usage: node scripts/seed-test-user.js <email> <password> [--premium]');
    process.exit(1);
  }

  const email = args[0];
  const password = args[1];
  const makePremium = args.includes('--premium');

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

  console.log(`Creating user ${email}…`);

  // 1. Create or update the auth user
  const { data: userData, error: userError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (userError && !userError.message.includes('already registered')) {
    console.error('Failed to create user:', userError.message);
    process.exit(1);
  }

  let userId;
  if (userData?.user) {
    userId = userData.user.id;
  } else {
    // Already exists — look it up
    const { data: listData } = await supabase.auth.admin.listUsers();
    const existing = listData?.users?.find((u) => u.email === email);
    if (!existing) {
      console.error('User exists but could not be looked up');
      process.exit(1);
    }
    userId = existing.id;
  }

  console.log(`✓ User created: ${userId}`);

  // 2. Update password (in case the user already existed with a different one)
  const { error: pwError } = await supabase.auth.admin.updateUserById(userId, {
    password,
  });
  if (pwError) {
    console.error('Failed to update password:', pwError.message);
  } else {
    console.log(`✓ Password set`);
  }

  // 3. Upsert the profile row
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      email,
      is_premium: makePremium,
      premium_purchased_at: makePremium ? new Date().toISOString() : null,
    });

  if (profileError) {
    console.error('Failed to upsert profile:', profileError.message);
    process.exit(1);
  }

  console.log(`✓ Profile ${makePremium ? 'created (premium)' : 'created (free)'}`);
  console.log('');
  console.log('You can now sign in with:');
  console.log(`  Email:    ${email}`);
  console.log(`  Password: ${password}`);
  if (makePremium) {
    console.log('  Status:   ✓ Premium (streak protection unlocked)');
  }
}

main().catch((e) => {
  console.error('Failed:', e.message);
  process.exit(1);
});
