-- Buddy pairs (bidirectional).
--
-- Replaces the scalar profiles.buddy_user_id and
-- profiles.purchased_by_user_id columns, which only allowed ONE buddy
-- per user. Each pair creates two rows — one in each direction — so
-- each side can independently hide via hidden_at.
--
-- Soft delete: hidden_at on the row the user controls. The reciprocal
-- row stays active until its owner hides too, so hiding from one
-- side doesn't silently hide from the other.

CREATE TABLE IF NOT EXISTS public.buddy_pairs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  buddy_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  purchase_id UUID REFERENCES public.buddy_purchases(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  hidden_at TIMESTAMPTZ,
  UNIQUE (user_id, buddy_user_id)
);

CREATE INDEX IF NOT EXISTS idx_buddy_pairs_user_active
  ON public.buddy_pairs (user_id) WHERE hidden_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_buddy_pairs_buddy_active
  ON public.buddy_pairs (buddy_user_id) WHERE hidden_at IS NULL;

ALTER TABLE public.buddy_pairs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own buddy pairs" ON public.buddy_pairs;
CREATE POLICY "Users can read own buddy pairs"
  ON public.buddy_pairs FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = buddy_user_id);

-- Update hidden_at is the soft-delete action. Only the side that owns
-- the row can change it.
DROP POLICY IF EXISTS "Users can hide own buddy pairs" ON public.buddy_pairs;
CREATE POLICY "Users can hide own buddy pairs"
  ON public.buddy_pairs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Hard delete — only the row's owner. Rarely used (soft delete is the
-- default), but available.
DROP POLICY IF EXISTS "Users can delete own buddy pairs" ON public.buddy_pairs;
CREATE POLICY "Users can delete own buddy pairs"
  ON public.buddy_pairs FOR DELETE
  USING (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- Migrate existing pairs from the scalar profile columns.
-- ----------------------------------------------------------------------------

-- (buyer, buddy) row
INSERT INTO public.buddy_pairs (user_id, buddy_user_id, created_at)
SELECT p.id, p.buddy_user_id, NOW()
FROM public.profiles p
WHERE p.buddy_user_id IS NOT NULL
ON CONFLICT (user_id, buddy_user_id) DO NOTHING;

-- Reciprocal (buddy, buyer) row so each side can independently hide.
-- Skip the self-pair case defensively.
INSERT INTO public.buddy_pairs (user_id, buddy_user_id, created_at)
SELECT p.buddy_user_id, p.id, NOW()
FROM public.profiles p
WHERE p.buddy_user_id IS NOT NULL
  AND p.buddy_user_id <> p.id
ON CONFLICT (user_id, buddy_user_id) DO NOTHING;

-- Drop the now-redundant scalar columns. The pair row is source of truth.
ALTER TABLE public.profiles DROP COLUMN IF EXISTS buddy_user_id;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS purchased_by_user_id;

-- ----------------------------------------------------------------------------
-- Buddy-pair read policy on daily_totals.
--
-- Without this, daily_totals RLS only allows reading your own rows —
-- MyMotivator can't see the buddy's habit grid. That's why the
-- existing single-buddy card has always shown empty/loading since
-- the 0006 migration renamed tracker_progress → daily_totals without
-- re-attaching the buddy policy.
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "buddy pairs can read each other's daily totals" ON public.daily_totals;
CREATE POLICY "buddy pairs can read each other's daily totals"
  ON public.daily_totals FOR SELECT
  USING (user_id IN (SELECT target_id FROM public.get_buddy_pair_ids()));

-- ----------------------------------------------------------------------------
-- get_buddy_pair_ids: single source of truth for "who is the current
-- user paired with". Reads from buddy_pairs, respects hidden_at.
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_buddy_pair_ids()
RETURNS TABLE (target_id uuid)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT buddy_user_id FROM public.buddy_pairs
  WHERE user_id = auth.uid() AND hidden_at IS NULL
  UNION
  SELECT user_id FROM public.buddy_pairs
  WHERE buddy_user_id = auth.uid() AND hidden_at IS NULL
$$;