-- One-shot script. Run in Supabase Dashboard → SQL → New query.
-- Provisions a test buddy + purchaser so the activation flow can be
-- exercised end-to-end. Re-runnable: existing rows are upserted.
--
-- After this runs, look at the bottom of the SQL result — the
-- activation link is printed via raise notice. Visit it on the
-- cohort-buddies preview to set the password and complete the
-- activation flow (profile flips pending_activation → active,
-- activation_token cleared, buddy_purchases.status → activated).

-- 1. Purchaser: barnabymurtagh@me.com
insert into auth.users (
  instance_id, id, aud, role,
  email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
) values (
  '00000000-0000-0000-0000-000000000000', gen_random_uuid(),
  'authenticated', 'authenticated',
  'barnabymurtagh@me.com', '', now(),
  '{"provider":"email","providers":["email"]}',
  '{"display_name":"B"}',
  now(), now(),
  '', '', '', ''
)
on conflict (email) do update set raw_user_meta_data = excluded.raw_user_meta_data
returning id;

-- Capture the purchaser id for use later.
do $$ declare b uuid; begin
  select id into b from auth.users where email = 'barnabymurtagh@me.com' limit 1;
  create temp table if not exists _bid(id) on commit drop;
  delete from _bid; insert into _bid values(b);
end $$;
select 'purchaser id' as label, id::text from _bid;

-- 2. Buddy: barnabymurtagh@yahoo.co.uk
insert into auth.users (
  instance_id, id, aud, role,
  email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
) values (
  '00000000-0000-0000-0000-000000000000', gen_random_uuid(),
  'authenticated', 'authenticated',
  'barnabymurtagh@yahoo.co.uk', '', now(),
  '{"provider":"email","providers":["email"]}',
  '{"display_name":"Barnaby Murtagh"}',
  now(), now(),
  '', '', '', ''
)
on conflict (email) do update set raw_user_meta_data = excluded.raw_user_meta_data
returning id;

-- Capture the buddy id and generate a fresh activation token.
do $$ declare b uuid; declare t text; begin
  select id into b from auth.users where email = 'barnabymurtagh@yahoo.co.uk' limit 1;
  t := encode(gen_random_bytes(24), 'hex');
  create temp table if not exists _bt(id uuid, aid text) on commit drop;
  delete from _bt; insert into _bt values(b, t);
end $$;
select 'buddy id' as label, id::text, 'activation token' as lbl, aid from _bt;

-- 3. Profile: pending_activation, 14-day token, is_premium = true.
insert into profiles (
  id, email, display_name, is_premium, premium_purchased_at,
  challenge_started_at, activation_status, activation_token,
  activation_expires_at, purchased_by_user_id
)
select
  b.id, 'barnabymurtagh@yahoo.co.uk', 'Barnaby Murtagh',
  true, now(), current_date::text,
  'pending_activation', b.aid, now() + interval '14 days',
  (select id from _bid)
from _bt b
on conflict (id) do update set
  email = excluded.email,
  display_name = excluded.display_name,
  is_premium = excluded.is_premium,
  premium_purchased_at = excluded.premium_purchased_at,
  challenge_started_at = excluded.challenge_started_at,
  activation_status = excluded.activation_status,
  activation_token = excluded.activation_token,
  activation_expires_at = excluded.activation_expires_at,
  purchased_by_user_id = excluded.purchased_by_user_id;

-- 4. buddy_purchases audit row in 'pending' status.
insert into buddy_purchases (
  purchaser_user_id, purchaser_email, buddy_email, buddy_name,
  personal_note, stripe_session_id, amount_paid_cents,
  status, expires_at
)
select
  (select id from _bid),
  'barnabymurtagh@me.com',
  'barnabymurtagh@yahoo.co.uk',
  'Barnaby Murtagh',
  'Test invite for activation-flow QA',
  'test_' || encode(gen_random_bytes(8), 'hex'),
  999, 'pending', now() + interval '14 days';

-- 5. Print the activation link with the freshly-minted token.
do $$
declare t text;
begin
  select aid into t from _bt;
  raise notice '────────────────────────────────────────';
  raise notice 'Activation link (substitute your preview host):';
  raise notice 'https://fit50-hpgvdtd5w-hazelrigg-projects.vercel.app/activate/buddy/%', t;
  raise notice '────────────────────────────────────────';
end $$;
