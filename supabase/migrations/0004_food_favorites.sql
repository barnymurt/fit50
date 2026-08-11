-- Food favourites — pinned foods the user wants quick access to.

CREATE TABLE IF NOT EXISTS public.food_favorites (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  food_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, food_id)
);

ALTER TABLE public.food_favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own favorites" ON public.food_favorites;
CREATE POLICY "Users can read their own favorites"
  ON public.food_favorites FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own favorites" ON public.food_favorites;
CREATE POLICY "Users can insert their own favorites"
  ON public.food_favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own favorites" ON public.food_favorites;
CREATE POLICY "Users can delete their own favorites"
  ON public.food_favorites FOR DELETE
  USING (auth.uid() = user_id);
