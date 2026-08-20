import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';

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

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

const EM = {
  buyer: 'barnabymurtagh16@gmail.com',
  buddy: 'barnabymurtagh@yahoo.co.uk',
};

async function getProfile(email) {
  const { data } = await admin.from('profiles').select('*').eq('email', email).single();
  return data;
}

const buyer = await getProfile(EM.buyer);
const buddy = await getProfile(EM.buddy);

console.log('Buyer profile:');
console.log(JSON.stringify(buyer, null, 2));
console.log();
console.log('Buddy profile:');
console.log(JSON.stringify(buddy, null, 2));
console.log();

const { data: tps } = await admin
  .from('tracker_progress')
  .select('day, completed')
  .eq('user_id', buyer.id)
  .order('day');
const completedByDay = {};
for (const r of tps ?? []) {
  if (r.completed) completedByDay[r.day] = (completedByDay[r.day] ?? 0) + 1;
}
console.log('Buyer tracker_progress (completed habits per day):');
console.log(JSON.stringify(completedByDay, null, 2));

const bp = await admin
  .from('buddy_purchases')
  .select('*')
  .eq('purchaser_user_id', buyer.id)
  .order('created_at', { ascending: false })
  .limit(3);
console.log();
console.log('Recent buddy_purchases for buyer:');
console.log(JSON.stringify(bp.data, null, 2));
