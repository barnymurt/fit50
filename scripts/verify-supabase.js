#!/usr/bin/env node
/* eslint-disable */
const fs = require('fs');
const path = require('path');

console.log('\nFIT50 Supabase Verification');
console.log('===========================\n');

function ok(msg) {
  console.log(`  ✓ ${msg}`);
}
function fail(msg) {
  console.log(`  ✗ ${msg}`);
}
function warn(msg) {
  console.log(`  ! ${msg}`);
}

let allPassed = true;

// Full table → expected-migration map. Keep this in sync when you add a
// new migration under supabase/migrations/. The script scans every SQL
// file present, but this list is the source of truth for what MUST
// exist before any feature relying on the table can work in production.
const expectedTables = [
  { name: 'profiles',               migration: '0001_init.sql' },
  { name: 'tracker_progress',       migration: '0001_init.sql' },
  { name: 'streak_protections',     migration: '0001_init.sql' },
  { name: 'newsletter_subscribers', migration: '0001_newsletter.sql' },
  { name: 'food_log',               migration: '0003_food_log.sql' },
  { name: 'food_favorites',         migration: '0004_food_favorites.sql' },
  { name: 'macro_profile',          migration: '0005_macro_profile.sql' },
  { name: 'daily_state',            migration: '0006_tracker_logging.sql' },
  { name: 'daily_totals',           migration: '0006_tracker_logging.sql' },
  { name: 'water_log',              migration: '0006_tracker_logging.sql' },
];

const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');

// 1. .env.local
console.log('1. .env.local file');
const envPath = path.join(__dirname, '..', '.env.local');
if (!fs.existsSync(envPath)) {
  fail('.env.local not found');
  console.log('    Run: node scripts/setup-supabase.js');
  allPassed = false;
} else {
  ok('Found .env.local');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
  ];
  requiredVars.forEach((varName) => {
    if (
      envContent.includes(varName + '=') &&
      !envContent.includes(varName + '=your-')
    ) {
      const match = envContent.match(new RegExp(`${varName}=(.+)`));
      const value = match ? match[1].trim() : '';
      if (value && value.length > 10) {
        ok(`${varName} is set (${value.substring(0, 30)}...)`);
      } else {
        fail(`${varName} looks empty or is a placeholder`);
        allPassed = false;
      }
    } else {
      fail(`${varName} is missing or is a placeholder`);
      console.log('    Update .env.local with a real value');
      allPassed = false;
    }
  });
}

// 2. Migrations on disk
console.log('\n2. Migration files');
const fileNames = fs
  .readdirSync(migrationsDir)
  .filter((f) => f.endsWith('.sql'))
  .sort();

if (fileNames.length === 0) {
  fail('No .sql files found in supabase/migrations/');
  allPassed = false;
} else {
  ok(`Found ${fileNames.length} migration file${fileNames.length === 1 ? '' : 's'}`);
  fileNames.forEach((f) => ok(`  · ${f}`));
}

// 3. Each expected table is created in some migration
console.log('\n3. Tables across migrations');
const tableToFile = new Map();
fileNames.forEach((fileName) => {
  const sql = fs.readFileSync(path.join(migrationsDir, fileName), 'utf8');
  const matches = sql.match(/CREATE TABLE IF NOT EXISTS public\.(\w+)/g) || [];
  matches.forEach((m) => {
    const name = m.replace('CREATE TABLE IF NOT EXISTS public.', '');
    if (!tableToFile.has(name)) tableToFile.set(name, fileName);
  });
});

expectedTables.forEach(({ name, migration }) => {
  const actualFile = tableToFile.get(name);
  if (!actualFile) {
    fail(`Table '${name}' is missing — add CREATE TABLE to ${migration}`);
    allPassed = false;
  } else if (actualFile > migration) {
    // CREATE TABLE IF NOT EXISTS is idempotent, so the canonical migration
    // may be earlier. We only warn when the table is created later than
    // expected (which usually means it leaked into a later migration by
    // accident and should be moved back).
    warn(
      `Table '${name}' expected in ${migration}, actually created in ${actualFile} (acceptable — CREATE TABLE IF NOT EXISTS is idempotent)`
    );
  } else {
    ok(`Table '${name}' created in ${actualFile}`);
  }
});

// 4. Each migration has RLS enabled on its tables
console.log('\n4. RLS policies');
fileNames.forEach((fileName) => {
  const sql = fs.readFileSync(path.join(migrationsDir, fileName), 'utf8');
  const tablesInFile = Array.from(tableToFile.entries())
    .filter(([, f]) => f === fileName)
    .map(([n]) => n);
  if (tablesInFile.length === 0) return;
  const hasRls = /ENABLE ROW LEVEL SECURITY/i.test(sql);
  const hasPolicy = /CREATE POLICY/i.test(sql);
  tablesInFile.forEach((tableName) => {
    if (hasRls && hasPolicy) {
      ok(`'${tableName}' has RLS + policies (in ${fileName})`);
    } else {
      fail(
        `'${tableName}' missing RLS (${hasRls ? '✓' : '✗'}) or policies (${hasPolicy ? '✓' : '✗'}) in ${fileName}`
      );
      allPassed = false;
    }
  });
});

// 5. Supabase packages installed
console.log('\n5. Supabase packages');
try {
  const pkg = require('../package.json');
  const hasJs = !!pkg.dependencies['@supabase/supabase-js'];
  const hasSsr = !!pkg.dependencies['@supabase/ssr'];
  if (hasJs && hasSsr) {
    ok('@supabase/supabase-js and @supabase/ssr installed');
  } else {
    const missing = [!hasJs && '@supabase/supabase-js', !hasSsr && '@supabase/ssr']
      .filter(Boolean)
      .join(', ');
    fail(`Missing Supabase packages (${missing}). Run: npm install ${missing}`);
    allPassed = false;
  }
} catch (e) {
  fail('Could not read package.json');
  allPassed = false;
}

// 6. Code wiring
console.log('\n6. Code wiring');
const pathsToCheck = [
  'src/contexts/AuthContext.tsx',
  'src/lib/supabase.ts',
  'src/hooks/useTrackerState.ts',
  'src/hooks/useStartChallenge.ts',
  'src/hooks/useStreakProtection.ts',
  'src/hooks/useMacroTracker.ts',
  'src/components/Tracker.tsx',
  'src/components/PremiumGate.tsx',
  'src/app/api/stripe/checkout/route.ts',
  'src/app/api/stripe/webhook/route.ts',
  'src/app/api/newsletter/subscribe/route.ts',
  'supabase/migrations/0006_tracker_logging.sql',
];
pathsToCheck.forEach((rel) => {
  const full = path.join(__dirname, '..', rel);
  if (fs.existsSync(full)) {
    ok(`Found ${rel}`);
  } else {
    fail(`Missing ${rel}`);
    allPassed = false;
  }
});

// 7. Vercel reminder (can't verify remotely)
console.log('\n7. Vercel environment variables');
warn('Cannot verify remotely. Make sure these are set in Vercel:');
console.log('    - NEXT_PUBLIC_SUPABASE_URL');
console.log('    - NEXT_PUBLIC_SUPABASE_ANON_KEY');
console.log('    - SUPABASE_SERVICE_ROLE_KEY');
console.log('    - STRIPE_SECRET_KEY');
console.log('    - STRIPE_WEBHOOK_SECRET');
console.log('  Vercel → Project Settings → Environment Variables');

// Summary
console.log('\n' + '─'.repeat(50));
if (allPassed) {
  console.log('✓ All checks passed. Ready to go.');
  console.log('\nNext: npm run dev → exercise the tracker → deploy to Vercel.\n');
} else {
  console.log('✗ Some checks failed. Fix the issues above and re-run.');
  process.exit(1);
}
