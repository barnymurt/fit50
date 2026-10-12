-- 0053_content_icons.sql
--
-- Phase 5 — the icon library. The 9 originals are seeded as
-- 'approved' rows; the approval_status + svg_path + tags fields
-- let the editor's approval queue approve / reject candidates
-- from Phase 6's generation step. RLS is enabled with full
-- access for the service role; Phase 6 adds per-editor policies.

create table if not exists public.content_icons (
  id text primary key,
  tags text[] not null default '{}',
  description text,
  source text not null check (source in ('live-app', 'generated')),
  approval_status text not null default 'pending' check (approval_status in ('pending', 'approved', 'rejected')),
  svg_path text,
  png_path text,
  created_at timestamptz not null default now(),
  approved_at timestamptz
);
create index if not exists content_icons_status_idx on public.content_icons(approval_status);
create index if not exists content_icons_source_idx on public.content_icons(source);
create index if not exists content_icons_tags_idx on public.content_icons using gin(tags);

alter table public.content_icons enable row level security;

-- Seed the 9 originals from the live app. The Phase 0 manifest
-- already lists them; the SQL seed keeps the DB in sync with
-- the git-tracked files. If you add a new SVG, insert another
-- row here.
insert into public.content_icons (id, tags, description, source, approval_status, svg_path, png_path, approved_at) values
  ('chill-out',      array['ice','cold','chill','water'],            'Three stacked ice cubes with a small motion line indicating a fresh chill.', 'live-app', 'approved', 'chill-out.svg',      'chill-out.webp',      now()),
  ('crispy-clarity', array['ice','cold','clarity','shower','water'], 'A single ice cube dripping into a few droplet lines, suggesting a cold shower.', 'live-app', 'approved', 'crispy-clarity.svg', 'crispy-clarity.webp', now()),
  ('feed-brain',     array['book','read','brain','learn'],           'Three stacked books with one slightly off-centre, ready to be picked up.', 'live-app', 'approved', 'feed-brain.svg',     'feed-brain.webp',     now()),
  ('fresh-lungs',    array['lungs','breath','fresh','air'],           'A pair of lungs with a small breath line above, suggesting fresh air in.', 'live-app', 'approved', 'fresh-lungs.svg',    'fresh-lungs.webp',    now()),
  ('fuel-right',     array['fuel','food','eat','pump'],               'A fuel pump nozzle with a single drip, no fuel type shown.', 'live-app', 'approved', 'fuel-right.svg',     'fuel-right.webp',     now()),
  ('move-body',      array['run','body','workout','move','exercise'], 'A figure mid-stride, arms pumping, no face detail.', 'live-app', 'approved', 'move-body.svg',      'move-body.webp',      now()),
  ('open-mind',      array['brain','mind','meditate','open'],         'A brain with a small sparkle above the top, suggesting an open mind.', 'live-app', 'approved', 'open-mind.svg',      'open-mind.webp',      now()),
  ('step-it-up',     array['feet','steps','walk','run'],             'A pair of feet mid-step, with small motion lines behind the back foot.', 'live-app', 'approved', 'step-it-up.svg',     'step-it-up.webp',     now()),
  ('wet-lips',       array['lips','water','drink','hydration'],      'A pair of lips around a straw, a small droplet line above.', 'live-app', 'approved', 'wet-lips.svg',       'wet-lips.webp',       now())
on conflict (id) do update set
  svg_path = excluded.svg_path,
  png_path = excluded.png_path,
  description = excluded.description,
  tags = excluded.tags,
  approval_status = 'approved',
  approved_at = now();
