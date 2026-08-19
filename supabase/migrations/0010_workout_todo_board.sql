-- Cross-device sync for the per-user data that used to live only
-- in localStorage. RLS: per-user only.
--
-- Tables:
--   workout_log   : AccountWorkouts (A/B/C/D × 5 exercises × 5 sets)
--   todo_items    : ProjectBoard to-do list
--   board_columns : ProjectBoard columns
--   board_items   : ProjectBoard cards

CREATE TABLE IF NOT EXISTS public.workout_log (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date_key TEXT NOT NULL,
  line TEXT NOT NULL CHECK (line IN ('A', 'B', 'C', 'D')),
  sets JSONB NOT NULL DEFAULT '{}'::jsonb,  -- { exercise_name: sets_count }
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, date_key, line)
);

ALTER TABLE public.workout_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own workouts" ON public.workout_log;
CREATE POLICY "Users can read their own workouts" ON public.workout_log
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own workouts" ON public.workout_log;
CREATE POLICY "Users can insert their own workouts" ON public.workout_log
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own workouts" ON public.workout_log;
CREATE POLICY "Users can update their own workouts" ON public.workout_log
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own workouts" ON public.workout_log;
CREATE POLICY "Users can delete their own workouts" ON public.workout_log
  FOR DELETE USING (auth.uid() = user_id);


CREATE TABLE IF NOT EXISTS public.todo_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  order_idx INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_todo_items_user
  ON public.todo_items (user_id, order_idx);

ALTER TABLE public.todo_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own todos" ON public.todo_items;
CREATE POLICY "Users can read their own todos" ON public.todo_items
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own todos" ON public.todo_items;
CREATE POLICY "Users can insert their own todos" ON public.todo_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own todos" ON public.todo_items;
CREATE POLICY "Users can update their own todos" ON public.todo_items
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own todos" ON public.todo_items;
CREATE POLICY "Users can delete their own todos" ON public.todo_items
  FOR DELETE USING (auth.uid() = user_id);


CREATE TABLE IF NOT EXISTS public.board_columns (
  id TEXT NOT NULL,  -- e.g. "todo", "in_progress", "done" — or user-defined
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT 'paper',
  order_idx INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, id)
);

ALTER TABLE public.board_columns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own board columns" ON public.board_columns;
CREATE POLICY "Users can read their own board columns" ON public.board_columns
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own board columns" ON public.board_columns;
CREATE POLICY "Users can insert their own board columns" ON public.board_columns
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own board columns" ON public.board_columns;
CREATE POLICY "Users can update their own board columns" ON public.board_columns
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own board columns" ON public.board_columns;
CREATE POLICY "Users can delete their own board columns" ON public.board_columns
  FOR DELETE USING (auth.uid() = user_id);


CREATE TABLE IF NOT EXISTS public.board_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  column_id TEXT NOT NULL,
  text TEXT NOT NULL,
  order_idx INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_board_items_user_col
  ON public.board_items (user_id, column_id, order_idx);

ALTER TABLE public.board_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own board items" ON public.board_items;
CREATE POLICY "Users can read their own board items" ON public.board_items
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own board items" ON public.board_items;
CREATE POLICY "Users can insert their own board items" ON public.board_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own board items" ON public.board_items;
CREATE POLICY "Users can update their own board items" ON public.board_items
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own board items" ON public.board_items;
CREATE POLICY "Users can delete their own board items" ON public.board_items
  FOR DELETE USING (auth.uid() = user_id);
