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

// 1. Check .env.local exists
console.log('1. .env.local file');
const envPath = path.join(__dirname, '..', '.env.local');
if (!fs.existsSync(envPath)) {
  fail('.env.local not found');
  console.log('    Run: node scripts/setup-supabase.js');
  allPassed = false;
} else {
  ok('Found .env.local');
  const envContent = fs.readFileSync(envPath, 'utf8');

  // Check required vars
  const requiredVars = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'];
  requiredVars.forEach((varName) => {
    if (envContent.includes(varName + '=') && !envContent.includes(varName + '=your-')) {
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
      console.log(`    Update .env.local with a real value`);
      allPassed = false;
    }
  });
}

// 2. Check migration file exists
console.log('\n2. Migration file');
const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '0001_init.sql');
if (fs.existsSync(migrationPath)) {
  ok('Found supabase/migrations/0001_init.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');

  const expectedTables = ['profiles', 'tracker_progress', 'streak_protections'];
  expectedTables.forEach((table) => {
    if (sql.includes(`CREATE TABLE IF NOT EXISTS public.${table}`)) {
      ok(`Migration includes CREATE TABLE for ${table}`);
    } else {
      fail(`Migration is missing CREATE TABLE for ${table}`);
      allPassed = false;
    }
  });

  if (sql.includes('ALTER TABLE') && sql.includes('ENABLE ROW LEVEL SECURITY')) {
    ok('Migration includes RLS policies');
  } else {
    fail('Migration is missing RLS policies');
    allPassed = false;
  }

  if (sql.includes('handle_new_user')) {
    ok('Migration includes auto-create-profile trigger');
  } else {
    fail('Migration is missing auto-create-profile trigger');
    allPassed = false;
  }
} else {
  fail('Migration file not found');
  allPassed = false;
}

// 3. Check Supabase packages installed
console.log('\n3. Supabase packages');
try {
  const pkg = require('../package.json');
  if (pkg.dependencies['@supabase/supabase-js'] && pkg.dependencies['@supabase/ssr']) {
    ok('@supabase/supabase-js and @supabase/ssr installed');
  } else {
    fail('Missing Supabase packages. Run: npm install @supabase/supabase-js @supabase/ssr');
    allPassed = false;
  }
} catch (e) {
  fail('Could not read package.json');
  allPassed = false;
}

// 4. Check code is wired up
console.log('\n4. Code wiring');
const authContextPath = path.join(__dirname, '..', 'src', 'contexts', 'AuthContext.tsx');
const supabaseLibPath = path.join(__dirname, '..', 'src', 'lib', 'supabase.ts');
const syncHookPath = path.join(__dirname, '..', 'src', 'hooks', 'useSyncTracker.ts');
const accountPath = path.join(__dirname, '..', 'src', 'app', 'account', 'page.tsx');

[authContextPath, supabaseLibPath, syncHookPath, accountPath].forEach((p) => {
  if (fs.existsSync(p)) {
    ok(`Found ${path.relative(path.join(__dirname, '..'), p)}`);
  } else {
    fail(`Missing ${path.relative(path.join(__dirname, '..'), p)}`);
    allPassed = false;
  }
});

// 5. Check Vercel guidance (we can't verify Vercel env vars from CLI, but we can remind)
console.log('\n5. Vercel environment variables');
console.log('  ! Cannot verify remotely. Make sure these are set in Vercel:');
console.log('    - NEXT_PUBLIC_SUPABASE_URL');
console.log('    - NEXT_PUBLIC_SUPABASE_ANON_KEY');
console.log('  Vercel → Project Settings → Environment Variables');

// Summary
console.log('\n' + '─'.repeat(50));
if (allPassed) {
  console.log('✓ All checks passed. Ready to go.');
  console.log('\nNext: npm run dev → test the tracker → deploy\n');
} else {
  console.log('✗ Some checks failed. Fix the issues above and re-run.');
  process.exit(1);
}
