-- 0054_content_animations.sql
--
-- Phase 7 — animated content. One row per (post, animation
-- attempt). The render subprocesses write MP4s + frames to
-- disk under tools/animate/pieces/<post_id>/renders/; the
-- paths are recorded here so the editor's "Animate" modal
-- and the existing export route can pick them up.
--
-- RLS is enabled with full access for the service role (single-
-- user editor in v1; Phase 6 swaps in per-editor policies).

create table if not exists public.content_animations (
  id uuid primary key default gen_random_uuid(),
  post_id text not null references public.content_posts(id) on delete cascade,
  status text not null default 'idle' check (status in ('idle', 'building', 'ready', 'failed')),
  piece_dir text,
  style text,
  formats text[] not null default '{}',
  mp4_paths jsonb not null default '{}',
  frames_dir text,
  duration_ms int,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists content_animations_post_id_idx on public.content_animations(post_id);
create index if not exists content_animations_status_idx on public.content_animations(status);
create index if not exists content_animations_updated_at_idx on public.content_animations(updated_at desc);

alter table public.content_animations enable row level security;
