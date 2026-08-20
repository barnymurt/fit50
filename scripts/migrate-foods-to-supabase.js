// Migrate the bundled food-data.json into the Supabase `foods` table.
//
// Usage:
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/migrate-foods-to-supabase.js
//
// The script is idempotent: it uses `upsert` on the `id` primary key
// so it's safe to re-run. It also batches the inserts in chunks of
// 500 to stay within Supabase's request limits.

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars.');
  process.exit(1);
}

const jsonPath = path.join(__dirname, '..', 'src', 'components', 'food-database', 'food-data.json');
const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
const foods = data.foods || data;

console.log(`Found ${foods.length} foods to migrate.`);

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const CHUNK = 500;
let migrated = 0;
let failed = 0;

async function migrate() {
  for (let i = 0; i < foods.length; i += CHUNK) {
    const slice = foods.slice(i, i + CHUNK).map((f) => ({
      id: f.id,
      name: f.name,
      category: f.category || 'Unknown',
      subcategory: f.subcategory || null,
      preparation: f.preparation || null,
      state: f.state || null,
      type: f.type || 'ingredient',
      kcal: typeof f.kcal === 'number' ? f.kcal : 0,
      protein: typeof f.protein === 'number' ? f.protein : 0,
      carbs: typeof f.carbs === 'number' ? f.carbs : 0,
      fat: typeof f.fat === 'number' ? f.fat : 0,
      fiber: typeof f.fiber === 'number' ? f.fiber : 0,
      serving_basis: f.servingBasis || '100g',
      standard_serving_grams: typeof f.standardServingGrams === 'number' ? f.standardServingGrams : null,
      standard_serving_label: f.standardServingLabel || null,
      aliases: Array.isArray(f.aliases) ? f.aliases : [],
    }));

    const { error, data: inserted } = await supabase
      .from('foods')
      .upsert(slice, { onConflict: 'id' });

    if (error) {
      console.error(`Chunk ${i}/${foods.length} failed:`, error.message);
      failed += slice.length;
    } else {
      migrated += slice.length;
      console.log(`Migrated ${migrated}/${foods.length}`);
    }
  }

  console.log(`\nDone. Migrated: ${migrated}. Failed: ${failed}.`);
}

migrate().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
