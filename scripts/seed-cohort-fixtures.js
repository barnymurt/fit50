#!/usr/bin/env node
/* eslint-disable */
/**
 * seed-cohort-fixtures.js
 *
 * Seeds a "preview" cohort with N fake `auth.users` plus
 * `cohort_memberships` and `daily_state` rows that mirror what a
 * real in-progress cohort looks like. Lets you sign in as one of
 * the fixture users (or join via the production join flow) and
 * preview the in-progress evolution of the cohort section (9-tile
 * grid, 50-day arc, X-of-Y hit 9/9 panel, high-fives) at any
 * chosen day number — without moving the OS clock.
 *
 * Usage:
 *   node scripts/seed-cohort-fixtures.js
 *   node scripts/seed-cohort-fixtures.js --start=YYYY-MM-DD
 *   node scripts/seed-cohort-fixtures.js --members=N
 *   node scripts/seed-cohort-fixtures.js --reset
 *   node scripts/seed-cohort-fixtures.js --start=YYYY-MM-DD --members=N
 *
 * The seed is idempotent: re-running clears prior fixture rows
 * (identified by email/handle prefix `cohort-fixture-`) before
 * recreating them. --reset clears and exits without reseeding.
 *
 * The fixture cohort is a SEPARATE row from the production seed
 * rows. It uses a distinct name suffix so the production
 * `cohorts` seed from migration 0046 is never touched.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Load .env.local into process.env
const envLocal = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envLocal)) {
  for (const line of fs.readFileSync(envLocal, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq < 0) continue;
    const k = t.slice(0, eq).trim();
    let v = t.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (!(k in process.env)) process.env[k] = v;
  }
}

const { createClient } = require('@supabase/supabase-js');

const FIXTURE_PREFIX = 'cohort-fixture-';
const FIXTURE_COHORT_NAME_PREFIX = 'Preview cohort (fixture';
const SECRETS_DIR = path.join(__dirname, '.secrets');
const SECRETS_FILE = path.join(SECRETS_DIR, 'cohort-fixtures.json');

const NAMES = [
  'Alice', 'Ben', 'Cleo', 'Dan', 'Eli', 'Finn', 'Gia', 'Hugo',
  'Iris', 'Jules', 'Kira', 'Leo', 'Mae', 'Nico', 'Omar', 'Pia',
  'Quinn', 'Rae', 'Sam', 'Tess',
];

function randomHandle() {
  // matches the format constraint in 0045_cohorts.sql
  // ^[A-Za-z]+-[A-Za-z0-9]{2,5}$
  const adj = NAMES[Math.floor(Math.random() * NAMES.length)].toLowerCase();
  const chars = 'abcdefghijkmnpqrstuvwxyz23456789';
  const suffix = Array.from(
    crypto.getRandomValues(new Uint32Array(3))
  ).map((n) => chars[n % chars.length]).join('').slice(0, 4);
  return `${adj}-${suffix}`;
}

function randomPassword() {
  // 16 chars, base36 — enough entropy for a fixture user.
  return Array.from(
    crypto.getRandomValues(new Uint32Array(8))
  ).map((n) => (n % 36).toString(36)).join('');
}

function parseArgs(argv) {
  const args = { reset: false, start: null, members: 8 };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--reset') {
      args.reset = true;
    } else if (a.startsWith('--start=')) {
      args.start = a.slice('--start='.length);
    } else if (a.startsWith('--members=')) {
      args.members = parseInt(a.slice('--members='.length), 10);
    } else if (a === '--start' || a === '--members') {
      const next = argv[++i];
      if (a === '--start') args.start = next;
      if (a === '--members') args.members = parseInt(next, 10);
    }
  }
  return args;
}

function loadSecrets() {
  try {
    if (fs.existsSync(SECRETS_FILE)) {
      return JSON.parse(fs.readFileSync(SECRETS_FILE, 'utf8'));
    }
  } catch (e) {
    console.warn('Could not read secrets file:', e.message);
  }
  return null;
}

function saveSecrets(secret) {
  if (!fs.existsSync(SECRETS_DIR)) {
    fs.mkdirSync(SECRETS_DIR, { recursive: true });
  }
  fs.writeFileSync(SECRETS_FILE, JSON.stringify(secret, null, 2), {
    mode: 0o600,
  });
  console.log('Wrote secrets to', SECRETS_FILE, '(mode 0600, gitignored)');
}

function isoDate(d) {
  return d.toISOString().slice(0, 10);
}

async function clearFixtures(sb) {
  console.log('Clearing prior fixture rows…');
  // 1. Find fixture users (anyone whose email starts with `cohort-fixture-`).
  const { data: userRows } = await sb.from('profiles').select('id, email').like('email', `${FIXTURE_PREFIX}%`);
  const ids = (userRows || []).map((u) => u.id);
  if (ids.length === 0) {
    console.log('  no prior fixture users found.');
  } else {
    // 2. Delete cohort_memberships rows owned by fixture users.
    const { error: memErr } = await sb.from('cohort_memberships').delete().in('user_id', ids);
    if (memErr) console.warn('  membership delete:', memErr.message);
    // 3. Delete any fixture-cohort daily_state rows.
    const { error: dstErr } = await sb.from('daily_state').delete().in('user_id', ids);
    if (dstErr) console.warn('  daily_state delete:', dstErr.message);
    // 4. Delete profiles rows.
    const { error: profErr } = await sb.from('profiles').delete().in('id', ids);
    if (profErr) console.warn('  profile delete:', profErr.message);
    // 5. Delete auth.users rows.
    const authAdmin = sb.auth.admin;
    if (authAdmin && typeof authAdmin.deleteUser === 'function') {
      for (const id of ids) {
        try {
          await authAdmin.deleteUser(id);
        } catch (e) {
          console.warn('  auth delete for', id, ':', e.message);
        }
      }
    }
  }
  // 6. Drop fixture cohort rows.
  const { error: cohortErr } = await sb.from('cohorts').delete().like('name', `${FIXTURE_COHORT_NAME_PREFIX}%`);
  if (cohortErr) console.warn('  cohort delete:', cohortErr.message);
  console.log('Cleared fixture users + cohort rows.');
}

async function ensureFixtureCohort(sb, startDate) {
  const name = `${FIXTURE_COHORT_NAME_PREFIX} — start ${startDate})`;
  // signup opens 30 days before start, same policy as migration 0046.
  const signupsOpenAt = isoDate(
    new Date(new Date(startDate + 'T00:00:00').getTime() - 30 * 24 * 60 * 60 * 1000)
  );
  const { data, error } = await sb.from('cohorts').insert({
    name,
    start_date: startDate,
    signups_open_at: signupsOpenAt,
    cap: 200,
  }).select('id').single();
  if (error) {
    // ON CONFLICT (start_date) — fall back to lookup.
    const { data: existing } = await sb.from('cohorts').select('id,name').eq('start_date', startDate).eq('name', name).maybeSingle();
    if (!existing) throw new Error('Could not insert or find fixture cohort: ' + error.message);
    return existing.id;
  }
  return data.id;
}

async function createFixtureUser(sb, idx) {
  const email = `${FIXTURE_PREFIX}user${idx}@fit50test.local`;
  const password = randomPassword();
  const display_name = `${NAMES[idx % NAMES.length]} #${idx}`;
  const { data, error } = await sb.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) {
    if (!error.message.toLowerCase().includes('already registered')) {
      throw new Error('createUser failed: ' + error.message);
    }
    const { data: listData } = await sb.auth.admin.listUsers();
    const existing = (listData?.users || []).find((u) => u.email === email);
    if (!existing) throw new Error('User exists but could not be looked up: ' + email);
    return { id: existing.id, email, password: existing.email?.slice(0, 8) + '…', display_name };
  }
  return { id: data.user.id, email, password, display_name };
}

async function upsertProfile(sb, user) {
  const { error } = await sb.from('profiles').upsert({
    id: user.id,
    email: user.email,
    display_name: user.display_name,
    is_premium: false,
    challenge_started_at: user.cohortStart,
  });
  if (error) throw new Error('profile upsert: ' + error.message);
}

async function insertMembership(sb, userId, cohortId, kudosToday) {
  for (let attempt = 0; attempt < 8; attempt++) {
    const handle = randomHandle();
    const { error, data } = await sb.from('cohort_memberships').insert({
      user_id: userId,
      cohort_id: cohortId,
      anonymous_handle: handle,
      show_display_name: false,
      status: 'active',
      kudos_today,
    }).select('id').single();
    if (!error) return;
    if (!error.message.toLowerCase().includes('duplicate')) {
      throw new Error('membership insert: ' + error.message);
    }
  }
  throw new Error('Could not find unique anonymous_handle after 8 attempts');
}

async function insertDailyState(sb, userId, cohortStart, dayNumber) {
  // Closed days: day 1 .. dayNumber-1 with a deterministic spread of habits.
  const tapState = {};
  const hash = crypto.createHash('sha1').update(`${userId}-${dayNumber}`).digest();
  // 6 of 9 habits "done" on average, varying 3-9.
  const numDone = 3 + (hash[0] % 7); // 3..9
  const used = new Set();
  while (used.size < numDone) used.add(hash[used.size + 1] % 9);
  for (let i = 0; i < 9; i++) tapState[`habit_${i}`] = used.has(i);
  const dateKey = isoDate(
    new Date(new Date(cohortStart + 'T00:00:00').getTime() + (dayNumber - 1) * 24 * 60 * 60 * 1000)
  );
  await sb.from('daily_state').upsert({
    user_id: userId,
    day_index: dayNumber,
    date_key: dateKey,
    tap_state: tapState,
    completed_count: numDone,
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const svc = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !svc) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
  }
  const sb = createClient(url, svc, { auth: { persistSession: false } });

  // Clear first, always — idempotency.
  await clearFixtures(sb);
  if (args.reset) {
    console.log('Reset complete. Nothing reseeded (--reset was set).');
    return;
  }

  // Default --start: 5 days ago (so a Day 5 view is the natural preview).
  let startDate = args.start;
  if (!startDate) {
    const d = new Date();
    d.setDate(d.getDate() - 5);
    startDate = isoDate(d);
  }
  // Validate format.
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
    console.error('--start must be YYYY-MM-DD, got:', startDate);
    process.exit(1);
  }

  const memberCount = Math.max(1, Math.min(20, args.members || 8));
  console.log(`Seeding cohort with start_date=${startDate}, ${memberCount} fake members…`);
  const cohortId = await ensureFixtureCohort(sb, startDate);
  console.log('  fixture cohort id:', cohortId);

  const secrets = { cohortId, startDate, members: [] };
  for (let i = 0; i < memberCount; i++) {
    const user = await createFixtureUser(sb, i);
    user.cohortStart = startDate;
    await upsertProfile(sb, user);
    const kudosToday = i % 3;
    await insertMembership(sb, user.id, cohortId, kudosToday);
    // Closed days: 1 .. 5 (Day N where N = days since start = 5).
    const daysElapsed = Math.max(0, Math.floor(
      (Date.now() - new Date(startDate + 'T00:00:00').getTime()) / (24 * 60 * 60 * 1000)
    ));
    for (let d = 1; d <= daysElapsed; d++) {
      await insertDailyState(sb, user.id, startDate, d);
    }
    secrets.members.push({
      email: user.email,
      // store full password — only persists in scripts/.secrets, gitignored.
      password: user.password,
      display_name: user.display_name,
      kudos_today: kudosToday,
    });
  }
  saveSecrets(secrets);
  console.log('Done. Fixture cohort and members ready.');
  console.log('  cohort ID:', cohortId);
  console.log('  start_date:', startDate);
  console.log('  members:', memberCount);
  console.log('  closed days per member:', Math.max(0, Math.floor(
    (Date.now() - new Date(startDate + 'T00:00:00').getTime()) / (24 * 60 * 60 * 1000)
  )));
}

main().catch((e) => {
  console.error('Failed:', e.message);
  process.exit(1);
});
