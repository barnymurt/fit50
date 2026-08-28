// Send every FIT50 email template to EMAIL_TEST_TO so you can see
// what your subscribers see without spamming anyone. Uses the test
// override in src/lib/email.ts (which redirects every send to
// EMAIL_TEST_TO and prefixes the subject with "[→original-recipient]").
//
// Usage:
//   EMAIL_TEST_TO=you@example.com npm run email:send-test
//
// Reads RESEND_API_KEY and EMAIL_TEST_TO from the environment. Also
// loads them from .env.local if not set, so the script works
// without you exporting anything. With no RESEND_API_KEY, sends
// are logged to stdout instead of actually emailed (the lib/email.ts
// dev fallback). Useful for sanity-checking the dispatch logic
// without spamming Resend.
//
// To send just one template:
//   npm run email:send-test -- renderWelcomeEmail

import { readFileSync } from 'node:fs';
import { sendEmail } from '../src/lib/email';
import * as onboarding from '../src/email/onboarding';
import * as milestones from '../src/email/milestones';
import * as bananaDays from '../src/email/banana-days';
import * as buddy from '../src/email/buddy';
import * as welcome from '../src/email/welcome';
import * as buddyInvite from '../src/email/buddy-invite';

// Load any missing RESEND_API_KEY / EMAIL_TEST_TO from .env.local
// so you don't have to export them every time. Doesn't override
// what's already in the environment.
function loadEnvLocal(): void {
  if (process.env.RESEND_API_KEY && process.env.EMAIL_TEST_TO) return;
  try {
    const raw = readFileSync('.env.local', 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq < 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      // Strip optional surrounding quotes.
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    // .env.local is optional — silently ignore if missing.
  }
}

interface Rendered {
  subject: string;
  html: string;
  text: string;
  replyTo: string;
}

const RENDERERS: Record<string, (args: unknown) => Rendered> = {
  renderWelcomeEmail: welcome.renderWelcomeEmail as (a: unknown) => Rendered,
  renderActivatedEmail: welcome.renderActivatedEmail as (a: unknown) => Rendered,
  renderBuddyInviteEmail: buddyInvite.renderBuddyInviteEmail as (a: unknown) => Rendered,
  renderFirstTapNudgeEmail: onboarding.renderFirstTapNudgeEmail as (a: unknown) => Rendered,
  renderDayThreeCheckInEmail: onboarding.renderDayThreeCheckInEmail as (a: unknown) => Rendered,
  renderDayOneStartedEmail: milestones.renderDayOneStartedEmail as (a: unknown) => Rendered,
  renderDaySevenEmail: milestones.renderDaySevenEmail as (a: unknown) => Rendered,
  renderDayTwentyFiveEmail: milestones.renderDayTwentyFiveEmail as (a: unknown) => Rendered,
  renderDayFortyEmail: milestones.renderDayFortyEmail as (a: unknown) => Rendered,
  renderDayFortyNineEmail: milestones.renderDayFortyNineEmail as (a: unknown) => Rendered,
  renderDayFiftyEmail: milestones.renderDayFiftyEmail as (a: unknown) => Rendered,
  renderBananaDayPremiumEmail: bananaDays.renderBananaDayPremiumEmail as (a: unknown) => Rendered,
  renderBananaDayFreeEmail: bananaDays.renderBananaDayFreeEmail as (a: unknown) => Rendered,
  renderThreeDayQuietEmail: bananaDays.renderThreeDayQuietEmail as (a: unknown) => Rendered,
  renderSevenDayQuietEmail: bananaDays.renderSevenDayQuietEmail as (a: unknown) => Rendered,
  renderFourteenDayQuietEmail: bananaDays.renderFourteenDayQuietEmail as (a: unknown) => Rendered,
  renderBuddyStartedEmail: buddy.renderBuddyStartedEmail as (a: unknown) => Rendered,
  renderBuddyFinishedEmail: buddy.renderBuddyFinishedEmail as (a: unknown) => Rendered,
};

const ARGS: Record<string, unknown> = {
  renderWelcomeEmail: {
    displayName: 'Bob Tester',
    email: 'original-recipient@example.com',
    signInUrl: 'http://localhost:3000/account',
  },
  renderActivatedEmail: {
    displayName: 'Alice Newbie',
    email: 'original-recipient@example.com',
    purchaserName: 'Bob',
    accountUrl: 'http://localhost:3000/account',
  },
  renderBuddyInviteEmail: {
    buddyName: 'Alice Newbie',
    purchaserName: 'Bob',
    purchaserEmail: 'bob@example.com',
    personalNote: 'Doing this together makes it stick.',
    activationUrl: 'http://localhost:3000/activate/buddy/sample-token',
  },
  renderFirstTapNudgeEmail: {
    displayName: 'Bob Tester',
    email: 'original-recipient@example.com',
    trackerUrl: 'http://localhost:3000/account#tracker',
    unsubscribeUrl: 'http://localhost:3000/api/email/unsubscribe?token=sample',
  },
  renderDayThreeCheckInEmail: {
    displayName: 'Bob Tester',
    email: 'original-recipient@example.com',
    trackerUrl: 'http://localhost:3000/account#tracker',
    unsubscribeUrl: 'http://localhost:3000/api/email/unsubscribe?token=sample',
  },
  renderDayOneStartedEmail: {
    displayName: 'Bob Tester',
    email: 'original-recipient@example.com',
    trackerUrl: 'http://localhost:3000/account#tracker',
    certificateUrl: 'http://localhost:3000/certificate',
    unsubscribeUrl: 'http://localhost:3000/api/email/unsubscribe?token=sample',
  },
  renderDaySevenEmail: {
    displayName: 'Bob Tester',
    email: 'original-recipient@example.com',
    trackerUrl: 'http://localhost:3000/account#tracker',
    certificateUrl: 'http://localhost:3000/certificate',
    unsubscribeUrl: 'http://localhost:3000/api/email/unsubscribe?token=sample',
  },
  renderDayTwentyFiveEmail: {
    displayName: 'Bob Tester',
    email: 'original-recipient@example.com',
    trackerUrl: 'http://localhost:3000/account#tracker',
    certificateUrl: 'http://localhost:3000/certificate',
    unsubscribeUrl: 'http://localhost:3000/api/email/unsubscribe?token=sample',
  },
  renderDayFortyEmail: {
    displayName: 'Bob Tester',
    email: 'original-recipient@example.com',
    trackerUrl: 'http://localhost:3000/account#tracker',
    certificateUrl: 'http://localhost:3000/certificate',
    unsubscribeUrl: 'http://localhost:3000/api/email/unsubscribe?token=sample',
  },
  renderDayFortyNineEmail: {
    displayName: 'Bob Tester',
    email: 'original-recipient@example.com',
    trackerUrl: 'http://localhost:3000/account#tracker',
    certificateUrl: 'http://localhost:3000/certificate',
    unsubscribeUrl: 'http://localhost:3000/api/email/unsubscribe?token=sample',
  },
  renderDayFiftyEmail: {
    displayName: 'Bob Tester',
    email: 'original-recipient@example.com',
    trackerUrl: 'http://localhost:3000/account#tracker',
    certificateUrl: 'http://localhost:3000/certificate',
    unsubscribeUrl: 'http://localhost:3000/api/email/unsubscribe?token=sample',
  },
  renderBananaDayPremiumEmail: {
    displayName: 'Bob Tester',
    email: 'original-recipient@example.com',
    trackerUrl: 'http://localhost:3000/account#tracker',
    isPremium: true,
    hasBuddy: false,
    currentDay: 5,
    unsubscribeUrl: 'http://localhost:3000/api/email/unsubscribe?token=sample',
  },
  renderBananaDayFreeEmail: {
    displayName: 'Bob Tester',
    email: 'original-recipient@example.com',
    trackerUrl: 'http://localhost:3000/account#tracker',
    isPremium: false,
    hasBuddy: false,
    currentDay: 5,
    unsubscribeUrl: 'http://localhost:3000/api/email/unsubscribe?token=sample',
  },
  renderThreeDayQuietEmail: {
    displayName: 'Bob Tester',
    email: 'original-recipient@example.com',
    trackerUrl: 'http://localhost:3000/account#tracker',
    isPremium: false,
    hasBuddy: false,
    currentDay: 5,
    unsubscribeUrl: 'http://localhost:3000/api/email/unsubscribe?token=sample',
  },
  renderSevenDayQuietEmail: {
    displayName: 'Bob Tester',
    email: 'original-recipient@example.com',
    trackerUrl: 'http://localhost:3000/account#tracker',
    isPremium: false,
    hasBuddy: false,
    currentDay: 5,
    unsubscribeUrl: 'http://localhost:3000/api/email/unsubscribe?token=sample',
  },
  renderFourteenDayQuietEmail: {
    displayName: 'Bob Tester',
    email: 'original-recipient@example.com',
    trackerUrl: 'http://localhost:3000/account#tracker',
    isPremium: false,
    hasBuddy: false,
    currentDay: 5,
    unsubscribeUrl: 'http://localhost:3000/api/email/unsubscribe?token=sample',
  },
  renderBuddyStartedEmail: {
    displayName: 'Bob',
    email: 'original-recipient@example.com',
    buddyName: 'Alice',
    trackerUrl: 'http://localhost:3000/account#tracker',
    unsubscribeUrl: 'http://localhost:3000/api/email/unsubscribe?token=sample',
  },
  renderBuddyFinishedEmail: {
    displayName: 'Bob',
    email: 'original-recipient@example.com',
    buddyName: 'Alice',
    trackerUrl: 'http://localhost:3000/account#tracker',
    unsubscribeUrl: 'http://localhost:3000/api/email/unsubscribe?token=sample',
  },
};

async function main(): Promise<void> {
  loadEnvLocal();
  const filter = process.argv[2];
  const names = Object.keys(RENDERERS).filter(
    (n) => !filter || n === filter
  );
  if (filter && names.length === 0) {
    console.error(`Unknown renderer: ${filter}`);
    process.exit(1);
  }
  if (!process.env.EMAIL_TEST_TO) {
    console.error('EMAIL_TEST_TO is not set.');
    console.error('Set it to an inbox you own — every send will redirect there.');
    process.exit(1);
  }

  console.log(`Sending ${names.length} email${names.length === 1 ? '' : 's'} to ${process.env.EMAIL_TEST_TO}\n`);

  for (const name of names) {
    const args = ARGS[name];
    if (!args) {
      console.error(`No test args for ${name}, skipping`);
      continue;
    }
    const rendered = RENDERERS[name](args);
    const result = await sendEmail({
      to: (args as { email: string }).email,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      replyTo: rendered.replyTo,
      tags: [{ name: 'kind', value: name }],
    });
    if (result.ok) {
      const tag = result.redirected ? '↪ redirected' : '→ direct';
      console.log(`  ✓ ${name.padEnd(34)} ${tag} ${result.id ?? '(no id)'}`);
    } else {
      console.log(`  ✗ ${name.padEnd(34)} error: ${result.error}`);
    }
  }

  console.log('\nDone.');
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});