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
-- Read existing id (if any) into a session-scoped variable.
select id into temp_purchaser from auth.users
  where email = 'barnabymurtagh@me.com' limit 1;

-- Insert if missing.
insert into auth.users (
  instance_id, id, aud, role,
  email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
)
select
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated', 'authenticated',
  'barnabymurtagh@me.com', '', now(),
  '{"provider":"email","providers":["email"]}',
  '{"display_name":"B"}',
  now(), now(),
  '', '', '', ''
where not exists (select 1 from auth.users where email = 'barnabymurtagh@me.com');

-- Otherwise update metadata only.
update auth.users
  set raw_user_meta_data = '{"display_name":"B"}',
      updated_at = now()
where email = 'barnabymurtagh@me.com';

-- Re-read into the session variable.
select id into temp_purchaser from auth.users
  where email = 'barnabymurtagh@me.com' limit 1;

select 'purchaser id' as label, temp_purchaser::text as id;

-- 2. Buddy: barnabymurtagh@yahoo.co.uk
select id into temp_buddy from auth.users
  where email = 'barnabymurtagh@yahoo.co.uk' limit 1;

insert into auth.users (
  instance_id, id, aud, role,
  email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
)
select
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated', 'authenticated',
  'barnabymurtagh@yahoo.co.uk', '', now(),
  '{"provider":"email","providers":["email"]}',
  '{"display_name":"Barnaby Murtagh"}',
  now(), now(),
  '', '', '', ''
where not exists (select 1 from auth.users where email = 'barnabymurtagh@yahoo.co.uk');

update auth.users
  set raw_user_meta_data = '{"display_name":"Barnaby Murtagh"}',
      updated_at = now()
where email = 'barnabymurtagh@yahoo.co.uk';

select id into temp_buddy from auth.users
  where email = 'barnabymurtagh@yahoo.co.uk' limit 1;

-- Generate a fresh activation token and stash it in a session
-- variable for the profile insert and the print at the end.
select encode(gen_random_bytes(24), 'hex') into temp_token;

select 'buddy id' as label, temp_buddy::text as id, 'token' as lbl, temp_token as aid;

-- 3. Profile: pending_activation, 14-day token, is_premium = true.
insert into profiles (
  id, email, display_name, is_premium, premium_purchased_at,
  challenge_started_at, activation_status, activation_token,
  activation_expires_at, purchased_by_user_id
)
values (
  temp_buddy,
  'barnabymurtagh@yahoo.co.uk',
  'Barnaby Murtagh',
  true,
  now(),
  current_date::text,
  'pending_activation',
  temp_token,
  now() + interval '14 days',
  temp_purchaser
)
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
values (
  temp_purchaser,
  'barnabymurtagh@me.com',
  'barnabymurtagh@yahoo.co.uk',
  'Barnaby Murtagh',
  'Test invite for activation-flow QA',
  'test_' || encode(gen_random_bytes(8), 'hex'),
  999, 'pending', now() + interval '14 days'
);

-- 5. Print the activation link with the freshly-minted token.
select '────────────────────────────────────────' as notice
union all
select 'Activation link (substitute your preview host):'
union all
select 'https://fit50-hpgvdtd5w-hazelrigg-projects.vercel.app/activate/buddy/' || temp_token
union all
select '────────────────────────────────────────';
