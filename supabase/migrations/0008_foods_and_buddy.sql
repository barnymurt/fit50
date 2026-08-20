-- Migration: Move food database to Supabase
-- 5,591 entries, ~5MB JSON. Replaces the bundled food-data.json with a
-- searchable table. Required for scaling past a few thousand users
-- (bandwidth) and unlocks real full-text search.
--
-- search_text is maintained by a BEFORE INSERT/UPDATE trigger rather
-- than a generated column. to_tsvector is STABLE (not IMMUTABLE)
-- in PostgreSQL, which makes it ineligible for generated columns
-- (ERROR 42P17). The trigger pattern is the standard way to keep
-- a tsvector up to date on row writes.

create table if not exists foods (
  id text primary key,
  name text not null,
  category text not null,
  subcategory text,
  preparation text,
  state text,
  type text not null,
  kcal real not null,
  protein real not null,
  carbs real not null,
  fat real not null,
  fiber real not null,
  serving_basis text not null default '100g',
  standard_serving_grams real,
  standard_serving_label text,
  aliases text[] not null default '{}',
  search_text tsvector
);

create index if not exists foods_search_idx
  on foods using gin (search_text);

create or replace function foods_set_search_text() returns trigger as $$
begin
  new.search_text :=
    setweight(to_tsvector('simple', coalesce(new.name, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(array_to_string(new.aliases, ' '), '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(new.category, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(new.subcategory, '')), 'C') ||
    setweight(to_tsvector('simple', coalesce(new.preparation, '')), 'C') ||
    setweight(to_tsvector('simple', coalesce(new.state, '')), 'C');
  return new;
end;
$$ language plpgsql;

drop trigger if exists foods_search_text_update on foods;
create trigger foods_search_text_update
  before insert or update on foods
  for each row execute function foods_set_search_text();

alter table foods enable row level security;

drop policy if exists "foods are publicly readable" on foods;
create policy "foods are publicly readable" on foods
  for select using (true);

-- Add a few new columns to profiles for the buddy purchase feature.
-- The buddy columns are dependent on the initial migration set so we
-- keep them here for now.
alter table profiles
  add column if not exists activation_status text not null default 'active'
    check (activation_status in ('active', 'pending_activation', 'expired')),
  add column if not exists activation_token text,
  add column if not exists activation_expires_at timestamptz,
  add column if not exists purchased_by_user_id uuid references profiles(id),
  add column if not exists buddy_user_id uuid references profiles(id);

create unique index if not exists profiles_activation_token_idx
  on profiles(activation_token)
  where activation_token is not null;

-- Buddy purchase audit log
create table if not exists buddy_purchases (
  id uuid primary key default gen_random_uuid(),
  purchaser_user_id uuid references profiles(id) not null,
  purchaser_email text not null,
  buddy_email text not null,
  buddy_name text not null,
  personal_note text,
  stripe_session_id text unique,
  stripe_payment_intent_id text,
  amount_paid_cents integer not null,
  status text not null default 'pending'
    check (status in ('pending', 'activated', 'expired_gifted', 'expired_refunded')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  activated_at timestamptz,
  source text default 'cohort-buddies-v1'
);

create index if not exists buddy_purchases_purchaser_idx
  on buddy_purchases(purchaser_user_id);
create index if not exists buddy_purchases_email_idx
  on buddy_purchases(buddy_email);
create index if not exists buddy_purchases_status_idx
  on buddy_purchases(status);
create index if not exists buddy_purchases_expires_idx
  on buddy_purchases(expires_at)
  where status = 'pending';

alter table buddy_purchases enable row level security;

drop policy if exists "purchaser can read own buddy purchases" on buddy_purchases;
create policy "purchaser can read own buddy purchases" on buddy_purchases
  for select using (auth.uid() = purchaser_user_id);

-- Gift codes for the 14-day-expiry fallback
create table if not exists gift_codes (
  code text primary key,
  buddy_purchase_id uuid references buddy_purchases(id) not null,
  created_at timestamptz not null default now(),
  redeemed_by_user_id uuid references profiles(id),
  redeemed_at timestamptz
);

alter table gift_codes enable row level security;

drop policy if exists "anyone can read unredeemed gift codes by code" on gift_codes;
create policy "anyone can read unredeemed gift codes by code" on gift_codes
  for select using (redeemed_by_user_id is null);

-- Stripe webhook idempotency log
create table if not exists webhook_events (
  id text primary key,
  type text not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz
);

alter table webhook_events enable row level security;
-- No public read; only service role accesses it.
