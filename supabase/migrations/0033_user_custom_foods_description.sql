-- 0033_user_custom_foods_description.sql
--
-- Add an optional `description` column to user_custom_foods so the
-- photo flow can save the OCR'd raw text alongside the structured
-- macros the LLM extracted from it. The user never sees this on
-- the food panel (it's an audit trail + a debugging aid), but it's
-- useful when a row came back with `confidence: 'low'` and the
-- user wants to see what the model actually read off the label.
--
-- Nullable: typed entries (existing path) and pre-migration
-- photo entries have nothing to put here.
--
-- Read-only from the app's perspective — never sent to the LLM
-- as a prompt. Cheap column, no index needed.

alter table public.user_custom_foods
  add column if not exists description text;
