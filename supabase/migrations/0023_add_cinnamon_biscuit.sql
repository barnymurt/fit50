-- Add one Portuguese / EU food item sourced from nutripedia.pt:
-- the cinnamon biscuits from Continente (EAN 5601312062028).
-- Per-100g macros only, no creative content. The `foods_set_search_text`
-- trigger from 0008_foods_and_buddy.sql populates the tsvector on insert,
-- so the new row is immediately searchable.
--
-- Idempotent: ON CONFLICT (id) DO NOTHING so re-running this migration
-- is safe.

INSERT INTO public.foods (
  id,
  name,
  category,
  subcategory,
  preparation,
  state,
  type,
  kcal,
  protein,
  carbs,
  fat,
  fiber,
  serving_basis,
  standard_serving_grams,
  standard_serving_label,
  aliases
) VALUES (
  'cinnamon-biscuit-continente',
  'Cinnamon biscuit',
  'Sweets & Desserts',
  'Cookies',
  'Baked',
  'Ready-to-eat',
  'ingredient',
  472.0,
  6.4,
  70.0,
  18.0,
  2.2,
  '100g',
  NULL,
  NULL,
  ARRAY[
    'Bolachas de Canela',
    'Bolacha canela',
    'Bolachas canela',
    'Cinnamon cookies',
    'Continente cinnamon biscuit',
    'Continente bolachas canela'
  ]
)
ON CONFLICT (id) DO NOTHING;