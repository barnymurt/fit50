-- 0034_photo_extract_temp_bucket.sql
--
-- Public-read bucket for short-lived LLM photo extraction.
-- The server uploads via the service-role key (which bypasses
-- RLS); the user's chosen LLM provider fetches the URL over
-- HTTPS to read the image bytes back. We lock down writes to
-- service_role only so anonymous clients can't dump arbitrary
-- images into our bucket.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'photo_extract_temp',
  'photo_extract_temp',
  true,                                  -- public read for the LLM fetch
  10 * 1024 * 1024,                     -- 10 MB cap; photos are sharp()'d
                                          -- to ≤1024 px JPEG so well under
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

create policy "photo_extract_temp server-only insert"
  on storage.objects
  for insert
  to service_role
  with check (bucket_id = 'photo_extract_temp');

create policy "photo_extract_temp server-only update"
  on storage.objects
  for update
  to service_role
  using (bucket_id = 'photo_extract_temp');

create policy "photo_extract_temp server-only delete"
  on storage.objects
  for delete
  to service_role
  using (bucket_id = 'photo_extract_temp');
