-- 0051_content_engine.sql
--
-- Phase 3 — the editor. Persists posts, version history, captured
-- corrections, and the generation log. Tables are namespaced
-- `content_*` so they're easy to split out into a separate
-- Supabase project later (per the Phase 1 plan: "Supabase uses
-- the existing project's URL/keys but with content-engine tables
-- namespaced `content_*`").
--
-- RLS is enabled with full access for the service role. The
-- editor is single-user (env-var password) in v1; Phase 6
-- swaps in Supabase auth and proper RLS policies.

create table if not exists public.content_posts (
  id text primary key,
  current_version_id uuid,
  pillar text not null,
  status text not null default 'draft',
  brief text,
  aspect text not null default '4:5',
  platform text not null default 'instagram',
  marquee text,
  source jsonb,
  last_rendered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists content_posts_pillar_idx on public.content_posts(pillar);
create index if not exists content_posts_status_idx on public.content_posts(status);
create index if not exists content_posts_updated_at_idx on public.content_posts(updated_at desc);

create table if not exists public.content_post_versions (
  id uuid primary key default gen_random_uuid(),
  post_id text not null references public.content_posts(id) on delete cascade,
  version int not null,
  doc jsonb not null,
  saved_by text not null,
  note text,
  created_at timestamptz not null default now(),
  unique (post_id, version)
);
create index if not exists content_post_versions_post_id_idx on public.content_post_versions(post_id);
create index if not exists content_post_versions_created_at_idx on public.content_post_versions(created_at desc);

alter table public.content_posts
  add constraint content_posts_current_version_fk
  foreign key (current_version_id) references public.content_post_versions(id)
  deferrable initially deferred;

create table if not exists public.content_corrections (
  id uuid primary key default gen_random_uuid(),
  post_id text not null references public.content_posts(id) on delete cascade,
  version_id uuid references public.content_post_versions(id) on delete set null,
  field_path text not null,
  pillar text,
  before jsonb not null,
  after jsonb not null,
  reason text,
  created_at timestamptz not null default now()
);
create index if not exists content_corrections_post_id_idx on public.content_corrections(post_id);
create index if not exists content_corrections_pillar_idx on public.content_corrections(pillar);
create index if not exists content_corrections_created_at_idx on public.content_corrections(created_at desc);

create table if not exists public.content_generations (
  id uuid primary key default gen_random_uuid(),
  post_id text references public.content_posts(id) on delete set null,
  kind text not null,
  model text not null,
  pillar text,
  tokens_in int not null default 0,
  tokens_out int not null default 0,
  est_cost_usd numeric not null default 0,
  passed_checks boolean,
  elapsed_ms int not null default 0,
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists content_generations_post_id_idx on public.content_generations(post_id);
create index if not exists content_generations_created_at_idx on public.content_generations(created_at desc);

-- RLS: service role has full access. v1 is single-user behind an
-- env-var password; the API routes use the service role client.
-- Phase 6 swaps in real Supabase auth + per-user policies.
alter table public.content_posts enable row level security;
alter table public.content_post_versions enable row level security;
alter table public.content_corrections enable row level security;
alter table public.content_generations enable row level security;

-- The service role bypasses RLS by default, so no explicit policy
-- is needed for the editor's API routes. The migration just
-- enables RLS so future per-user policies slot in cleanly.
