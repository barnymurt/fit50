-- 0052_content_submissions.sql
--
-- Phase 4 — member submissions. Each submission is the source
-- of truth for any post that comes out of it. The intake form
-- records explicit consent (which content, which channels, the
-- right to withdraw at any time) with a timestamp. Withdrawn
-- submissions flag every post using them so the editor can
-- take them down.
--
-- RLS is enabled with full access for the service role (v1 is
-- single-user behind an env-var password; Phase 6 swaps in
-- per-member RLS).

create table if not exists public.content_submissions (
  id uuid primary key default gen_random_uuid(),
  member_id text not null,
  type text not null check (type in ('progress', 'book', 'project')),
  answers jsonb not null,
  photo_paths text[] not null default '{}',
  credit_as text not null check (credit_as in ('full_name', 'first_name', 'anonymous')),
  consent_scope text not null,
  consent_at timestamptz not null,
  withdrawn_at timestamptz,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists content_submissions_status_idx on public.content_submissions(status);
create index if not exists content_submissions_member_id_idx on public.content_submissions(member_id);
create index if not exists content_submissions_type_idx on public.content_submissions(type);
create index if not exists content_submissions_withdrawn_at_idx on public.content_submissions(withdrawn_at) where withdrawn_at is not null;

-- Add submission_id to content_posts so withdrawal can find
-- every post using a submission. Nullable so the bulk of
-- posts (not from submissions) keep working.
alter table public.content_posts
  add column if not exists submission_id uuid references public.content_submissions(id) on delete set null;
create index if not exists content_posts_submission_id_idx on public.content_posts(submission_id) where submission_id is not null;

alter table public.content_submissions enable row level security;
alter table public.content_posts enable row level security;
