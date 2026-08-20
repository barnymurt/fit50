-- Paste into Supabase Dashboard → SQL → New query → run.
-- Creates a test buddy (barnabymurtagh@yahoo.co.uk) with a fresh
-- 14-day activation token. After running, visit the printed URL
-- to set the password and exercise the activation flow.
--
-- The purchaser (barnabymurtagh@me.com) is also created so the
-- buddy_purchases row has a valid FK target.

-- 1. Create the purchaser auth user (via auth.users — Supabase
--    GoTrue tolerates inserts with no password yet).
insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) values (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'barnabymurtagh@me.com',
  '',
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"display_name":"B"}',
  now(),
  now(),
  '',
  '',
  '',
  ''
)
on conflict (email) do nothing
returning id into temp_buyer;

-- Fallback: if the row already existed, fetch it.
do $$
declare bid uuid;
begin
  select id into bid from auth.users where email = 'barnabymurtagh@me.com' limit 1;
  if bid is null then
    raise exception 'purchaser row not found and could not be inserted';
  end if;
  create temp table if not exists _buyer_id(b id) on commit drop;
  truncate _buyer_id;
  insert into _buyer_id values (bid);
end$$;
select id as purchaser_user_id from _buyer_id;

-- 2. Create the buddy auth user.
insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) values (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'barnabymurtagh@yahoo.co.uk',
  '',
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"display_name":"Barnaby Murtagh"}',
  now(),
  now(),
  '',
  '',
  '',
  ''
)
on conflict (email) do update set raw_user_meta_data = excluded.raw_user_meta_data
returning id into temp_buddy_id;

-- 3. Upsert the buddy profile (pending_activation, is_premium true,
--    14-day activation token).
do $$
declare bid uuid;
declare pid uuid;
declare aid text;
begin
  select id into bid from auth.users where email = 'barnabymurtagh@yahoo.co.uk' limit 1;
  select id into pid from _buyer_id limit 1;
  aid := encode(gen_random_bytes(24), 'hex');

  insert into profiles (
    id,
    email,
    display_name,
    is_premium,
    premium_purchased_at,
    challenge_started_at,
    activation_status,
    activation_token,
    activation_expires_at,
    purchased_by_user_id
  ) values (
    bid,
    'barnabymurtagh@yahoo.co.uk',
    'Barnaby Murtagh',
    true,
    now(),
    current_date::text,
    'pending_activation',
    aid,
    now() + interval '14 days',
    pid
  ) on conflict (id) do update set
    email = excluded.email,
    display_name = excluded.display_name,
    is_premium = excluded.is_premium,
    premium_purchased_at = excluded.premium_purchased_at,
    challenge_started_at = excluded.challenge_started_at,
    activation_status = excluded.activation_status,
    activation_token = excluded.activation_token,
    activation_expires_at = excluded.activation_expires_at,
    purchased_by_user_id = excluded.purchased_by_user_id;

  insert into buddy_purchases (
    purchaser_user_id,
    purchaser_email,
    buddy_email,
    buddy_name,
    personal_note,
    stripe_session_id,
    amount_paid_cents,
    status,
    expires_at
  ) values (
    pid,
    'barnabymurtagh@me.com',
    'barnabymurtagh@yahoo.co.uk',
    'Barnaby Murtagh',
    'Test invite for activation-flow QA',
    'test_' || encode(gen_random_bytes(8), 'hex'),
    999,
    'pending',
    now() + interval '14 days'
  );

  raise notice 'Activation link (paste into your preview URL):';
  raise notice 'https://fit50-hpgvdtd5w-hazelrigg-projects.vercel.app/activate/buddy/%',
    aid;
  raise notice '';
  raise notice 'Or substitute your current preview host in place of fit50-hpgvdtd5w-hazelrigg-projects.vercel.app';
end$$;
