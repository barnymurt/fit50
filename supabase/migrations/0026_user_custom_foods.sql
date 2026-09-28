-- Per-user custom foods. Three states for the community-submit flow:
--   'private'         – only the owner sees it (default)
--   'pending_review'  – submitted to community; awaiting admin approval
--   'published'       – approved by admin; visible to all users
--   'rejected'        – admin declined; stays owner-only
--
-- When 'published', the row is meant to be copied into public.foods
-- by the moderation flow (out of scope for this PR — the search
-- integration here only surfaces 'private' rows to the owner).
--
-- Editable while 'pending_review': per product decision, the user can
-- tweak a submission before it lands. Toggling the submission off
-- reverts to 'private'.

create table if not exists public.user_custom_foods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  name text not null,
  brand text,
  subcategory text null,
  category text not null default 'Other',
  preparation text,
  state text,
  type text not null default 'ingredient',

  -- Per 100g macros. Caps enforced at the API layer; CHECK
  -- constraints here are a defence-in-depth so a buggy client can't
  -- write nonsense.
  kcal real not null default 0 check (kcal >= 0 and kcal <= 9999),
  protein real not null default 0 check (protein >= 0 and protein <= 999),
  carbs real not null default 0 check (carbs >= 0 and carbs <= 999),
  fat real not null default 0 check (fat >= 0 and fat <= 999),
  fiber real not null default 0 check (fiber >= 0 and fiber <= 999),

  -- Standard serving is auto-filled at the API layer to {100, '100 g'}
  -- but the user can override.
  serving_basis text not null default '100g',
  standard_serving_grams real,
  standard_serving_label text,

  -- Search aids — comma-separated terms, search-text trigger, etc.
  aliases text[] not null default '{}',
  source text not null default 'manual' check (source in ('manual', 'llm')),

  -- Community-submit lifecycle
  submission_status text not null default 'private'
    check (submission_status in ('private', 'pending_review', 'published', 'rejected')),
  submitted_at timestamptz,
  reviewed_at timestamptz,
  reviewer_id uuid references auth.users(id),
  review_note text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_user_custom_foods_user
  on public.user_custom_foods (user_id);

create index if not exists idx_user_custom_foods_user_private
  on public.user_custom_foods (user_id)
  where submission_status = 'private';

create index if not exists idx_user_custom_foods_user_pending
  on public.user_custom_foods (user_id)
  where submission_status = 'pending_review';

-- Keep updated_at honest.
create or replace function public.user_custom_foods_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_user_custom_foods_touch on public.user_custom_foods;
create trigger trg_user_custom_foods_touch
  before update on public.user_custom_foods
  for each row execute function public.user_custom_foods_touch_updated_at();

alter table public.user_custom_foods enable row level security;

-- A user can read their own custom foods. The community visibility
-- ('published' for everyone) is a follow-up: the search_foods RPC
-- and any admin read paths need to opt in. For now, even a 'published'
-- row is only readable by its owner — the moderation flow (out of
-- scope) will copy the row to public.foods and delete it here.
drop policy if exists "Users can read own custom foods" on public.user_custom_foods;
create policy "Users can read own custom foods"
  on public.user_custom_foods for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own custom foods" on public.user_custom_foods;
create policy "Users can insert own custom foods"
  on public.user_custom_foods for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own custom foods" on public.user_custom_foods;
create policy "Users can update own custom foods"
  on public.user_custom_foods for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own custom foods" on public.user_custom_foods;
create policy "Users can delete own custom foods"
  on public.user_custom_foods for delete
  using (auth.uid() = user_id);

comment on table public.user_custom_foods is
  'Per-user custom foods. Private by default, optionally submitted
   for community review (submission_status tracks the lifecycle).';

comment on column public.user_custom_foods.submission_status is
  'private = owner-only (default). pending_review = submitted to
   community, awaiting admin. published = admin-approved, copied to
   public.foods (TODO). rejected = admin declined, stays owner-only.';