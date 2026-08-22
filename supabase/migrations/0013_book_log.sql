-- Books read during the 50-day challenge. One row per (user, day)
-- so the daily input is cheap and the certificate can derive the
-- distinct-titles list by simple SELECT DISTINCT title.
--
-- The same book may appear on many days (it's the book they're
-- reading RIGHT NOW) — that doesn't matter, only distinct titles
-- get rendered on the certificate.

CREATE TABLE IF NOT EXISTS public.book_log (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date_key TEXT NOT NULL,
  title TEXT NOT NULL,
  format TEXT NOT NULL CHECK (format IN ('read', 'listen')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, date_key, title, format)
);

CREATE INDEX IF NOT EXISTS idx_book_log_user_date
  ON public.book_log (user_id, date_key);

ALTER TABLE public.book_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own book log" ON public.book_log;
CREATE POLICY "Users can read their own book log"
  ON public.book_log FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own book log" ON public.book_log;
CREATE POLICY "Users can insert their own book log"
  ON public.book_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own book log" ON public.book_log;
CREATE POLICY "Users can update their own book log"
  ON public.book_log FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own book log" ON public.book_log;
CREATE POLICY "Users can delete their own book log"
  ON public.book_log FOR DELETE
  USING (auth.uid() = user_id);