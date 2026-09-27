-- 0040_board_items_meta.sql
--
-- Expands the FIT50 project board (ProjectBoard.tsx) to mirror a
-- real working kanban: each card now carries description, due date,
-- completion status, and priority. Subtasks, tags, and attachments
-- live in their own tables so they can be queried and updated
-- independently of the card itself.
--
-- Why this migration: the existing board_items schema (0010) only
-- stored {column_id, text, order_idx}. A card was just a title in a
-- column. The user asked for the board to echo Trello / Jira / Asana
-- in abilities — that needs more than a title string.
--
-- All new tables follow the same per-user RLS pattern as
-- board_items / board_columns (auth.uid() = user_id for SELECT,
-- INSERT, UPDATE, DELETE).

ALTER TABLE public.board_items
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS due_date DATE,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS priority SMALLINT NOT NULL DEFAULT 0
    CHECK (priority BETWEEN 0 AND 4);

-- Subtasks: an ordered checklist inside a card.
CREATE TABLE IF NOT EXISTS public.board_item_subtasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES public.board_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  order_idx INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_board_subtasks_item
  ON public.board_item_subtasks (item_id, order_idx);

ALTER TABLE public.board_item_subtasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own board subtasks" ON public.board_item_subtasks;
CREATE POLICY "Users can read their own board subtasks"
  ON public.board_item_subtasks FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own board subtasks" ON public.board_item_subtasks;
CREATE POLICY "Users can insert their own board subtasks"
  ON public.board_item_subtasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own board subtasks" ON public.board_item_subtasks;
CREATE POLICY "Users can update their own board subtasks"
  ON public.board_item_subtasks FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own board subtasks" ON public.board_item_subtasks;
CREATE POLICY "Users can delete their own board subtasks"
  ON public.board_item_subtasks FOR DELETE
  USING (auth.uid() = user_id);

-- Tags: colour-coded labels attached to a card.
CREATE TABLE IF NOT EXISTS public.board_item_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES public.board_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT 'paper'
    CHECK (color IN ('paper','teal','coral','cream','lavender','ink')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_board_tags_item
  ON public.board_item_tags (item_id);

ALTER TABLE public.board_item_tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own board tags" ON public.board_item_tags;
CREATE POLICY "Users can read their own board tags"
  ON public.board_item_tags FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own board tags" ON public.board_item_tags;
CREATE POLICY "Users can insert their own board tags"
  ON public.board_item_tags FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own board tags" ON public.board_item_tags;
CREATE POLICY "Users can update their own board tags"
  ON public.board_item_tags FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own board tags" ON public.board_item_tags;
CREATE POLICY "Users can delete their own board tags"
  ON public.board_item_tags FOR DELETE
  USING (auth.uid() = user_id);

-- Attachments: free-form references (URLs to docs / images / links).
-- Real file uploads would need a Supabase Storage bucket + signed
-- URLs; we keep this as URL references for now so the card can
-- carry context without requiring a media-upload pipeline.
CREATE TABLE IF NOT EXISTS public.board_item_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES public.board_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'link'
    CHECK (kind IN ('link','image','doc','other')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_board_attachments_item
  ON public.board_item_attachments (item_id);

ALTER TABLE public.board_item_attachments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own board attachments" ON public.board_item_attachments;
CREATE POLICY "Users can read their own board attachments"
  ON public.board_item_attachments FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own board attachments" ON public.board_item_attachments;
CREATE POLICY "Users can insert their own board attachments"
  ON public.board_item_attachments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own board attachments" ON public.board_item_attachments;
CREATE POLICY "Users can update their own board attachments"
  ON public.board_item_attachments FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own board attachments" ON public.board_item_attachments;
CREATE POLICY "Users can delete their own board attachments"
  ON public.board_item_attachments FOR DELETE
  USING (auth.uid() = user_id);
