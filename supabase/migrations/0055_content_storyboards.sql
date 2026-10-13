-- 0055_content_storyboards.sql
--
-- Phase 7c — storyboard review before video generation.
-- The new-video form creates a content_storyboards row
-- (brief + heuristic-generated beat table). The user reviews
-- the storyboard at /editor/new-video/[id]/storyboard,
-- edits it, then approves. Approval creates the post +
-- first version + the queued animation row. The animation
-- then runs in the background as before.

create table if not exists public.content_storyboards (
  id uuid primary key default gen_random_uuid(),
  idea text not null,
  message_goal text not null check (message_goal in ('reach', 'saves', 'signups', 'link-clicks')),
  platforms text[] not null default '{}',
  beats jsonb not null default '[]',
  pillar text not null default 'animated-reel',
  format text not null default '9:16',
  post_id text references public.content_posts(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'edited')),
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists content_storyboards_post_id_idx on public.content_storyboards(post_id);
create index if not exists content_storyboards_status_idx on public.content_storyboards(status);
create index if not exists content_storyboards_created_at_idx on public.content_storyboards(created_at desc);

alter table public.content_storyboards enable row level security;
