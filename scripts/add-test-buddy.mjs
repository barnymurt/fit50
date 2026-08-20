// One-off script to add a test buddy so we can exercise the activation
// flow on the cohort-buddies preview. Run with:
//   node --env-file=.env.local scripts/add-test-buddy.mjs
//
// Creates:
//  - auth.users row (via admin API with email_confirm: true)
//  - profiles row (pending_activation, is_premium: true, with a
//    fresh activation token + 14-day expiry)
//  - buddy_purchases row (status: pending, so the cron won't
//    immediately sweep this one)

import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';

// Parse .env.local manually so we don't rely on --env-file behaviour
// (which is the latest Node, but explicit parsing avoids any flag
// issues across versions).
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

const BUDDY_EMAIL = 'barnabymurtagh@yahoo.co.uk';
const BUDDY_NAME = 'Barnaby Murtagh';
const PURCHASER_EMAIL = 'barnabymurtagh@me.com';
const PURCHASER_NAME = 'B';
const NOTE = 'Test invite for activation-flow QA';

const admin = createClient(URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const token = randomBytes(24).toString('hex');
const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

async function main() {
  console.log(`URL: ${URL}`);
  console.log(`SERVICE_KEY length: ${SERVICE_KEY.length}`);
  console.log(`SERVICE_KEY starts: ${SERVICE_KEY.slice(0, 30)}...`);

  // 1. Find or create the purchaser.
  const buyerRes = await admin
    .from('profiles')
    .select('id, display_name')
    .eq('email', PURCHASER_EMAIL)
    .maybeSingle();
  if (buyerRes.error) throw buyerRes.error;

  let buyerId;
  if (buyerRes.data) {
    buyerId = buyerRes.data.id;
    console.log(`✓ Found existing purchaser ${PURCHASER_EMAIL} (${buyerId})`);
  } else {
    const createdBuyer = await admin.auth.admin.createUser({
      email: PURCHASER_EMAIL,
      email_confirm: true,
      user_metadata: { display_name: PURCHASER_NAME },
    });
    if (createdBuyer.error) throw createdBuyer.error;
    buyerId = createdBuyer.data.user.id;
    const pp = await admin.from('profiles').upsert(
      {
        id: buyerId,
        email: PURCHASER_EMAIL,
        display_name: PURCHASER_NAME,
        is_premium: true,
        premium_purchased_at: new Date().toISOString(),
        challenge_started_at: new Date().toISOString().slice(0, 10),
        activation_status: 'active',
      },
      { onConflict: 'id' }
    );
    if (pp.error) throw pp.error;
    console.log(`✓ Created purchaser ${PURCHASER_EMAIL} (${buyerId})`);
  }

  // 2. Find or create the buddy auth user.
  const existingAuth = await admin.auth.admin.listUsers({ perPage: 200 });
  if (existingAuth.error) throw existingAuth.error;
  let buddyId;
  const found = (existingAuth.data?.users ?? []).find(
    (u) => (u.email ?? '').toLowerCase() === BUDDY_EMAIL.toLowerCase()
  );
  if (found) {
    buddyId = found.id;
    console.log(`✓ Found existing auth user ${BUDDY_EMAIL} (${buddyId})`);
  } else {
    const createdBuddy = await admin.auth.admin.createUser({
      email: BUDDY_EMAIL,
      email_confirm: true,
      user_metadata: { display_name: BUDDY_NAME },
    });
    if (createdBuddy.error) throw createdBuddy.error;
    buddyId = createdBuddy.data.user.id;
    console.log(`✓ Created auth user ${BUDDY_EMAIL} (${buddyId})`);
  }

  // 3. Upsert the profile for the buddy as pending_activation.
  const up = await admin.from('profiles').upsert(
    {
      id: buddyId,
      email: BUDDY_EMAIL,
      display_name: BUDDY_NAME,
      is_premium: true,
      premium_purchased_at: new Date().toISOString(),
      challenge_started_at: new Date().toISOString().slice(0, 10),
      activation_status: 'pending_activation',
      activation_token: token,
      activation_expires_at: expiresAt,
      purchased_by_user_id: buyerId,
    },
    { onConflict: 'id' }
  );
  if (up.error) throw up.error;
  console.log(`✓ Profile upserted for ${BUDDY_EMAIL} (pending_activation, 14d)`);

  // 4. Insert the buddy_purchases audit row.
  const bp = await admin.from('buddy_purchases').insert({
    purchaser_user_id: buyerId,
    purchaser_email: PURCHASER_EMAIL,
    buddy_email: BUDDY_EMAIL,
    buddy_name: BUDDY_NAME,
    personal_note: NOTE,
    stripe_session_id: `test_${token.slice(0, 16)}`,
    amount_paid_cents: 999,
    status: 'pending',
    expires_at: expiresAt,
  });
  if (bp.error) throw bp.error;
  console.log(`✓ buddy_purchases audit row inserted (status: pending)`);

  // 5. Output the activation URL so the user can open it directly.
  const host = URL.replace(/^https?:\/\//, '').replace(/\.supabase\.co$/, '.vercel.app');
  const url = `https://${host}/activate/buddy/${token}`;
  console.log(`\nActivation link: ${url}\n`);
  console.log('— Visit that link to set the password and complete the flow.');
}

main().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});
