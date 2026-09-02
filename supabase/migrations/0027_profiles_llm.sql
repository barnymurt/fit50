-- Per-user LLM credentials for the auto-fill feature. BYOK
-- (Bring Your Own Key) so each user pays their own bill and the
-- server never holds a tenant-wide secret.
--
-- `llm_api_key` is treated as the most sensitive column on the row.
-- The existing per-user RLS on profiles already gates everything to
-- auth.uid() = id, so no additional policy is needed — but we
-- explicitly note that the SELECT policy (which the browser hits)
-- should NOT expose this column. The server-side API endpoints
-- access it via the service-role admin client, which bypasses RLS
-- for that user. The /api/account/me client select deliberately
-- does NOT include this column.
--
-- `llm_provider` is the matching provider id (one of the
-- LLMProvider enum in src/lib/llm/types.ts). Default is 'openai'
-- for the most common key shape (`sk-...`); other shapes are
-- detected by prefix at save time and on the extract call.
--
-- Future: rotate to Supabase Vault or pgsodium if the threat model
-- changes. For now: keep it simple, log no key material server-
-- side, and gate all reads with RLS.

alter table public.profiles
  add column if not exists llm_api_key text;

alter table public.profiles
  add column if not exists llm_provider text not null default 'openai'
    check (llm_provider in ('openai', 'anthropic', 'gemini', 'deepseek', 'minimax', 'perplexity'));

comment on column public.profiles.llm_api_key is
  'User-provided LLM API key (BYOK) for the auto-fill feature.
   Server-only — never returned by /api/account/me. Format
   depends on provider (sk-… for OpenAI-compat, sk-ant-… for
   Anthropic, AIza… for Gemini, pplx-… for Perplexity).';

comment on column public.profiles.llm_provider is
  'Which provider the LLM key above belongs to. Drives the
   adapter dispatch in src/lib/llm/extract.ts. Default ''openai''
   for sk-… keys; other shapes are auto-detected at save time.';