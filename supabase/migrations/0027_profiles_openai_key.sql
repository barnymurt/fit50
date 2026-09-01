-- Per-user API key for the LLM auto-fill feature. Brought-your-own-
-- key (BYOK) so each user pays their own OpenAI bill and the server
-- never holds a tenant-wide secret.
--
-- Storage: plain text in profiles.openai_api_key. Acceptable for
-- v1 because (a) the user owns the key and accepts the trust model,
-- (b) the server only uses it to call OpenAI, and (c) the column
-- never leaves the server (the Profile type in src/contexts doesn't
-- include it, so it's never sent to the browser).
--
-- Future: rotate to Supabase Vault or pgsodium if the threat model
-- changes. For now: keep it simple, log no key material server-
-- side, and gate all reads with RLS.

alter table public.profiles
  add column if not exists openai_api_key text;

-- The key is treated as the most sensitive column on the row. The
-- existing per-user RLS on profiles already gates everything to
-- auth.uid() = id, so no additional policy is needed — but we
-- explicitly note that the SELECT policy (which the browser hits)
-- should NOT expose this column. The server-side API endpoints
-- access it via the service-role admin client, which bypasses RLS
-- for that user. The /api/account/me client select deliberately
-- does NOT include this column.

comment on column public.profiles.openai_api_key is
  'User-provided OpenAI API key (BYOK) for the LLM auto-fill
   feature. Server-only — never returned by /api/account/me.
   Format: sk-...';