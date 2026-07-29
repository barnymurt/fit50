#!/usr/bin/env node
/* eslint-disable */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => resolve(answer.trim()));
  });
}

function exec(cmd, opts = {}) {
  console.log(`  $ ${cmd}`);
  try {
    return execSync(cmd, { stdio: 'pipe', encoding: 'utf8', ...opts });
  } catch (e) {
    if (e.stdout) console.log(e.stdout.toString());
    if (e.stderr) console.log(e.stderr.toString());
    throw e;
  }
}

function step(num, title) {
  console.log(`\n${num}. ${title}`);
  console.log('─'.repeat(50));
}

function ok(msg) {
  console.log(`  ✓ ${msg}`);
}

function fail(msg) {
  console.log(`  ✗ ${msg}`);
}

async function main() {
  console.log('\nFIT50 Supabase Setup');
  console.log('====================\n');
  console.log('This script will:');
  console.log('  1. Log in to Supabase (opens browser)');
  console.log('  2. Link your FIT50 project');
  console.log('  3. Push the database migration');
  console.log('  4. Write your API keys to .env.local\n');

  // Step 1: Check for supabase CLI
  step(1, 'Check Supabase CLI');
  try {
    const version = execSync('npx --yes supabase --version', { stdio: 'pipe', encoding: 'utf8' });
    ok(`Found: ${version.trim()}`);
  } catch {
    fail('Supabase CLI not available via npx');
    console.log('  Try: npm install -g supabase');
    console.log('  Then re-run this script.');
    rl.close();
    process.exit(1);
  }

  // Step 2: Login
  step(2, 'Log in to Supabase');
  console.log('  A browser window will open for authentication.');
  console.log('  After you approve, return here and press Enter.\n');
  try {
    exec('npx --yes supabase login', { stdio: 'inherit' });
    ok('Logged in');
  } catch {
    fail('Login failed. Run `npx supabase login` manually first, then re-run this script.');
    rl.close();
    process.exit(1);
  }

  // Step 3: Get project ref
  step(3, 'Project reference');
  console.log('  Find this in your Supabase project URL after creating it:');
  console.log('  https://supabase.com/dashboard/project/<PROJECT-REF>');
  console.log('  Example: xyzabcde\n');
  const projectRef = await question('  Enter project reference: ');
  if (!projectRef) {
    fail('Project reference is required.');
    rl.close();
    process.exit(1);
  }
  ok(`Using project: ${projectRef}`);

  // Step 4: Link project
  step(4, 'Link to remote project');
  try {
    exec(`npx --yes supabase link --project-ref ${projectRef}`, { stdio: 'inherit' });
    ok('Project linked');
  } catch {
    fail('Failed to link project. Check the project reference and try again.');
    rl.close();
    process.exit(1);
  }

  // Step 5: Push migration
  step(5, 'Push migration to database');
  try {
    exec('npx --yes supabase db push', { stdio: 'inherit' });
    ok('Migration applied — tables, RLS, triggers created');
  } catch {
    fail('Failed to push migration.');
    console.log('  You can run it manually: npx supabase db push');
    rl.close();
    process.exit(1);
  }

  // Step 6: Get API keys
  step(6, 'Get your API keys');
  console.log('  From Supabase dashboard → Project Settings → API');
  console.log('  Copy the Project URL and the anon/public key.\n');
  const supabaseUrl = await question('  Project URL: ');
  const anonKey = await question('  anon/public key: ');

  if (!supabaseUrl || !anonKey) {
    fail('Both URL and key are required.');
    rl.close();
    process.exit(1);
  }

  if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('.supabase.co')) {
    fail('URL doesn\'t look like a Supabase URL. Should be https://xxx.supabase.co');
    rl.close();
    process.exit(1);
  }

  // Step 7: Write .env.local
  step(7, 'Write .env.local');
  const envContent =
    `NEXT_PUBLIC_SUPABASE_URL=${supabaseUrl}\n` +
    `NEXT_PUBLIC_SUPABASE_ANON_KEY=${anonKey}\n` +
    `NEXT_PUBLIC_SITE_URL=${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}\n`;
  const envPath = path.join(__dirname, '..', '.env.local');
  fs.writeFileSync(envPath, envContent);
  ok(`Written to ${envPath}`);

  // Step 8: Next steps
  step(8, 'Next steps');
  console.log('  1. Run `npm run dev` to test locally');
  console.log('  2. Visit the tracker and try the magic-link sign-in');
  console.log('  3. Add the same env vars to Vercel:');
  console.log('     - NEXT_PUBLIC_SUPABASE_URL');
  console.log('     - NEXT_PUBLIC_SUPABASE_ANON_KEY');
  console.log('  4. Deploy and test in production\n');

  console.log('✓ Setup complete!\n');

  // Offer to run verification
  const verify = await question('Run verification script now? (y/n): ');
  if (verify.toLowerCase() === 'y') {
    console.log('');
    try {
      exec('node scripts/verify-supabase.js', { stdio: 'inherit' });
    } catch {
      fail('Verification failed. Check the output above.');
    }
  }

  rl.close();
}

main().catch((e) => {
  console.error('\nSetup failed:', e.message);
  rl.close();
  process.exit(1);
});
