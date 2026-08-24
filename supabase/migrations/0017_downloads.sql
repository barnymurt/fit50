-- Download analytics. Logs every PDF download from the email
-- gates (fridge checklist, workout) so we can see how many people
-- actually pull the PDFs across the site. RLS is deny-all; inserts
-- only happen from the service-role path in the API route.

create table if not exists public.downloads (
  id uuid primary key default gen_random_uuid(),
  file text not null,
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_downloads_file
  on public.downloads (file, created_at desc);
create index if not exists idx_downloads_created
  on public.downloads (created_at desc);

alter table public.downloads enable row level security;

drop policy if exists "deny all on downloads" on public.downloads;
create policy "deny all on downloads"
  on public.downloads for all
  using (false) with check (false);