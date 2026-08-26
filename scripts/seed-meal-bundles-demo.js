// Apply 0020 on Supabase, then run this locally to seed two
// demo bundles so the UI has something to show on the food-ordering
// preview. Safe to run multiple times — uses unique names + wipes
// any pre-existing demo bundles first.
//
//   node scripts/seed-meal-bundles-demo.js <user_id>

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const user_id = process.argv[2];
if (!user_id) {
  console.error('Usage: node scripts/seed-meal-bundles-demo.js <user_id>');
  console.error('Pass the Supabase user id you want to seed bundles for.');
  process.exit(1);
}

const BUNDLES = [
  {
    name: 'Porridge + Berries',
    items: [
      { food_id: 'st-cottage-cheese', portion_grams: 60 },
      { food_id: 'st-banana', portion_grams: 100 },
      { food_id: 'st-raspberries', portion_grams: 60 },
      { food_id: 'st-almonds', portion_grams: 20 },
    ],
  },
  {
    name: 'Chicken + Rice + Greens',
    items: [
      { food_id: 'st-chicken-breast-raw', portion_grams: 150 },
      { food_id: 'st-white-rice-cooked', portion_grams: 200 },
      { food_id: 'st-broccoli', portion_grams: 120 },
    ],
  },
];

async function http(method, path, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    method,
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`${method} ${path} ${res.status} ${t}`);
  }
  return res.json();
}

(async () => {
  console.log(`Wiping any pre-existing demo bundles for user ${user_id}...`);
  const existing = await http(
    'GET',
    `/meal_bundles?user_id=eq.${user_id}&select=id`
  );
  if (existing.length > 0) {
    const ids = existing.map((b) => b.id).join(',');
    await http('DELETE', `/meal_bundle_items?bundle_id=in.(${ids})`);
    await http('DELETE', `/meal_bundles?id=in.(${ids})`);
  }

  for (const b of BUNDLES) {
    const inserted = await http('POST', '/meal_bundles', {
      user_id,
      name: b.name,
    });
    const id = Array.isArray(inserted) ? inserted[0]?.id : inserted?.id;
    if (!id) {
      throw new Error(`meal_bundles insert did not return an id: ${JSON.stringify(inserted)}`);
    }
    const itemRows = b.items.map((it, idx) => ({
      bundle_id: id,
      food_id: it.food_id,
      portion_grams: it.portion_grams,
      position: idx,
    }));
    await http('POST', '/meal_bundle_items', itemRows);
    console.log(`  inserted "${b.name}" (${b.items.length} items)`);
  }
  console.log('Done.');
})().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});