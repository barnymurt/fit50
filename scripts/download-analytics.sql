-- 30-day download analytics. Run in the Supabase SQL editor.
-- Requires migration 0017_downloads.sql.

select
  file,
  count(*) as total_downloads,
  count(*) filter (where user_id is not null) as signed_in_downloads,
  count(distinct user_id) filter (where user_id is not null) as unique_users,
  min(created_at) as first_download,
  max(created_at) as last_download
from public.downloads
where created_at > now() - interval '30 days'
group by file
order by total_downloads desc;