-- Fix 0023: the cinnamon biscuit insert left `tier` and `brand` null.
-- The search_foods RPC (0018) requires tier IN (1, 2) for the default
-- search; tier 3 is hidden behind the "Branded on" toggle. NULL tier
-- silently excluded the row from the default search.
--
-- Promote the row to tier 1 so it shows alongside the curated staples,
-- and populate `brand` so the result line shows "Continente". Idempotent
-- on rerun (the WHERE clause is a no-op once tier/brand are set).

update public.foods
   set tier = 1,
       brand = 'Continente'
 where id = 'cinnamon-biscuit-continente';

-- Also update the original 0023 migration file so anyone re-running
-- migrations from scratch gets the correct row shape.