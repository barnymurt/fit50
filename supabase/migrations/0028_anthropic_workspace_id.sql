-- Optional Anthropic workspace ID for identity-linked API keys.
-- Anthropic's new identity-linked keys return 400 unless you also
-- send `anthropic-workspace-id: <id>`. We store this next to the
-- LLM key so the extract route can attach the header on every call.
--
-- Optional — most users won't have an identity-linked key and leave
-- this NULL. Falls back to the standard header set when absent.

alter table public.profiles
  add column if not exists anthropic_workspace_id text;

comment on column public.profiles.anthropic_workspace_id is
  'Optional Anthropic workspace id. Required when using an
   identity-linked Anthropic API key — Anthropic returns 400
   otherwise. NULL means use the standard header set.';