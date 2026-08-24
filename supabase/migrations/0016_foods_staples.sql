-- Curated "common foods" tier. A small set of staples that always
-- surfaces at the top of the search panel so the user has
-- instant results before typing. Region-scoped: each row lists
-- the regions it belongs to, e.g. '{uk-ie,us,worldwide}'.
--
-- Public read; only service_role writes (via the seed script).

CREATE TABLE IF NOT EXISTS public.foods_staples (
  id text PRIMARY KEY,
  name text NOT NULL,
  category text NOT NULL,
  regions text[] NOT NULL DEFAULT '{uk-ie,us,worldwide}',
  kcal integer NOT NULL,
  protein real NOT NULL,
  carbs real NOT NULL,
  fat real NOT NULL,
  fiber real NOT NULL,
  serving_basis text NOT NULL DEFAULT '100g',
  standard_serving_label text,
  aliases text[] NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_foods_staples_regions
  ON public.foods_staples USING gin (regions);

ALTER TABLE public.foods_staples ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public read staples" ON public.foods_staples;
CREATE POLICY "public read staples" ON public.foods_staples
  FOR SELECT USING (true);