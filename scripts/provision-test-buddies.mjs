// Provision a real buyer + buddy pair so the MyMotivator and BuddyCard
// views can be exercised end-to-end. Unlike scripts/add-test-buddy.mjs
// (which creates a pending_activation buddy that has to be activated
// through the email link), this script:
//   - Sets a known password on both accounts so the user can sign in
//     directly with either one
//   - Links them bidirectionally (buyer.buddy_user_id <-> buddy.purchased_by_user_id)
//   - Seeds tracker_progress for the buyer so the buddy sees day/streak data
//
// Re-runnable. Prints the credentials at the end.
//
//   node scripts/provision-test-buddies.mjs
//
// Reads NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from
// .env.local.

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';

const BUYER_EMAIL = 'barnabymurtagh16@gmail.com';
const BUYER_NAME = 'B';
const BUYER_PASSWORD = 'fit50buyer!';

const BUDDY_EMAIL = 'barnabymurtagh@yahoo.co.uk';
const BUDDY_NAME = 'Barnz';
const BUDDY_PASSWORD = 'fit50buddy!';

function loadEnv(path) {
  const text = readFileSync(path, 'utf8');
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
}
loadEnv('.env.local');

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const admin = createClient(URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const HABIT_IDS = [
  'feed-brain',
  'move-body',
  'fuel-right',
  'crispy-clarity',
  'fresh-lungs',
  'open-mind',
  'step-it-up',
  'wet-lips',
  'chill-out',
];

async function ensureUser(email, password, displayName) {
  const list = await admin.auth.admin.listUsers({ perPage: 200 });
  if (list.error) throw list.error;
  let userId;
  const found = (list.data?.users ?? []).find(
    (u) => (u.email ?? '').toLowerCase() === email.toLowerCase()
  );
  if (found) {
    userId = found.id;
    console.log(`  ✓ Found existing auth user ${email} (${userId})`);
  } else {
    const created = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { display_name: displayName },
    });
    if (created.error) throw created.error;
    userId = created.data.user.id;
    console.log(`  ✓ Created auth user ${email} (${userId})`);
  }

  // Always (re)set the password so the user can sign in directly with
  // the known one — this is the whole point of this script.
  const upd = await admin.auth.admin.updateUserById(userId, {
    password,
    email_confirm: true,
    user_metadata: { display_name: displayName },
  });
  if (upd.error) throw upd.error;
  console.log(`  ✓ Password set for ${email}`);

  return userId;
}

async function main() {
  console.log(`URL: ${URL}`);
  console.log();

  // 1. Ensure both auth users exist with known passwords.
  console.log('1. Ensuring auth users…');
  const buyerId = await ensureUser(BUYER_EMAIL, BUYER_PASSWORD, BUYER_NAME);
  const buddyId = await ensureUser(BUDDY_EMAIL, BUDDY_PASSWORD, BUDDY_NAME);
  console.log();

  // 2. Buyer profile: active, premium, challenge started, points to buddy.
  console.log('2. Upserting buyer profile…');
  const buyerProfile = await admin.from('profiles').upsert(
    {
      id: buyerId,
      email: BUYER_EMAIL,
      display_name: BUYER_NAME,
      is_premium: true,
      premium_purchased_at: new Date().toISOString(),
      challenge_started_at: new Date(Date.now() - 6 * 86_400_000).toISOString(),
      activation_status: 'active',
      buddy_user_id: buddyId,
    },
    { onConflict: 'id' }
  );
  if (buyerProfile.error) throw buyerProfile.error;
  console.log(`  ✓ Buyer profile (B) → buddy ${buddyId}`);
  console.log();

  // 3. Buddy profile: active, premium, points to buyer.
  console.log('3. Upserting buddy profile…');
  const buddyProfile = await admin.from('profiles').upsert(
    {
      id: buddyId,
      email: BUDDY_EMAIL,
      display_name: BUDDY_NAME,
      is_premium: true,
      premium_purchased_at: new Date().toISOString(),
      challenge_started_at: new Date(Date.now() - 3 * 86_400_000).toISOString(),
      activation_status: 'active',
      activation_token: null,
      activation_expires_at: null,
      purchased_by_user_id: buyerId,
      buddy_user_id: null,
    },
    { onConflict: 'id' }
  );
  if (buddyProfile.error) throw buddyProfile.error;
  console.log(`  ✓ Buddy profile (Barnz) → buyer ${buyerId}`);
  console.log();

  // 4. Seed tracker_progress for the buyer so the MyMotivator card has
  //    day / streak data. We backdate challenge_started_at 6 days ago
  //    and put completed rows on days 1–5 plus a couple on day 6.
  console.log('4. Seeding tracker_progress for buyer…');
  const dayRows = [
    { day: 1, completed: true },
    { day: 2, completed: true },
    { day: 3, completed: true },
    { day: 4, completed: true },
    { day: 5, completed: true },
    { day: 6, completed: true },
  ];
  const rows = [];
  for (const d of dayRows) {
    for (const habitId of HABIT_IDS) {
      rows.push({
        user_id: buyerId,
        day: d.day,
        habit_id: habitId,
        completed: true,
        completed_at: new Date(Date.now() - (6 - d.day) * 86_400_000).toISOString(),
      });
    }
  }
  const seed = await admin
    .from('tracker_progress')
    .upsert(rows, { onConflict: 'user_id,day,habit_id' });
  if (seed.error) throw seed.error;
  console.log(`  ✓ Seeded ${rows.length} tracker_progress rows across 6 days`);
  console.log();

  // 5. buddy_purchases audit row (pending or activated — doesn't affect
  //    the card rendering, but keep it for completeness).
  const bp = await admin.from('buddy_purchases').insert({
    purchaser_user_id: buyerId,
    purchaser_email: BUYER_EMAIL,
    buddy_email: BUDDY_EMAIL,
    buddy_name: BUDDY_NAME,
    personal_note: 'Test pair for cohort-buddies QA',
    stripe_session_id: `test_provision_${Date.now()}`,
    amount_paid_cents: 999,
    status: 'activated',
    expires_at: new Date(Date.now() + 365 * 86_400_000).toISOString(),
  });
  if (bp.error && !bp.error.message.includes('duplicate')) {
    console.warn(`  ! buddy_purchases insert: ${bp.error.message}`);
  } else {
    console.log('  ✓ buddy_purchases audit row inserted');
  }
  console.log();

  console.log('=== Done. Sign in with either account: ===');
  console.log();
  console.log(`  Buyer (B):         ${BUYER_EMAIL}    password: ${BUYER_PASSWORD}`);
  console.log(`  Buddy  (Barnz):    ${BUDDY_EMAIL}    password: ${BUDDY_PASSWORD}`);
  console.log();
  console.log('Both should see the other on /account once the cohort-buddies');
  console.log('preview is redeployed with the AuthContext fix.');
}

main().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});
