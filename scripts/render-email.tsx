// Render a single FIT50 email template to an output directory.
//
// Usage:
//   npx tsx scripts/render-email.tsx <renderer-name> <args-json> <out-dir>
//
// Example:
//   npx tsx scripts/render-email.tsx \
//     renderWelcomeEmail \
//     '{"displayName":"Bob","email":"bob@example.com","signInUrl":"http://localhost:3000/account"}' \
//     /tmp/email-preview/welcome
//
// Writes three files to <out-dir>:
//   subject.txt   — the subject line
//   body.html     — open this in a browser to preview the rendered email
//   body.txt      — the plain-text fallback
//
// Available renderers: see src/email/*.tsx. Names are the exported
// function names (renderWelcomeEmail, renderDayFiftyEmail, etc.).
// Args schema is the Args interface at the top of each file.

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

import * as onboarding from '../src/email/onboarding';
import * as milestones from '../src/email/milestones';
import * as bananaDays from '../src/email/banana-days';
import * as buddy from '../src/email/buddy';
import * as welcome from '../src/email/welcome';
import * as buddyInvite from '../src/email/buddy-invite';

interface Rendered {
  subject: string;
  html: string;
  text: string;
  replyTo: string;
}

const RENDERERS: Record<string, (args: unknown) => Rendered> = {
  // Transactional
  renderWelcomeEmail: welcome.renderWelcomeEmail as (a: unknown) => Rendered,
  renderActivatedEmail: welcome.renderActivatedEmail as (a: unknown) => Rendered,
  renderBuddyInviteEmail: buddyInvite.renderBuddyInviteEmail as (a: unknown) => Rendered,

  // Outreach
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

const PLACEHOLDER_ARGS: Record<string, unknown> = {
  renderWelcomeEmail: {
    displayName: 'Bob Tester',
    email: 'bob@example.com',
    signInUrl: 'http://localhost:3000/account',
  },
  renderActivatedEmail: {
    displayName: 'Alice Newbie',
    email: 'alice@example.com',
    purchaserName: 'Bob',
    accountUrl: 'http://localhost:3000/account',
  },
  renderBuddyInviteEmail: {
    buddyName: 'Alice Newbie',
    purchaserName: 'Bob',
    purchaserEmail: 'bob@example.com',
    personalNote: 'Doing this together makes it stick. Pick me as your buddy.',
    activationUrl: 'http://localhost:3000/activate/buddy/sample-token',
  },
  renderFirstTapNudgeEmail: {
    displayName: 'Bob Tester',
    email: 'bob@example.com',
    trackerUrl: 'http://localhost:3000/account#tracker',
    unsubscribeUrl: 'http://localhost:3000/api/email/unsubscribe?token=sample',
  },
  renderDayThreeCheckInEmail: {
    displayName: 'Bob Tester',
    email: 'bob@example.com',
    trackerUrl: 'http://localhost:3000/account#tracker',
    unsubscribeUrl: 'http://localhost:3000/api/email/unsubscribe?token=sample',
  },
  renderDayOneStartedEmail: {
    displayName: 'Bob Tester',
    email: 'bob@example.com',
    trackerUrl: 'http://localhost:3000/account#tracker',
    certificateUrl: 'http://localhost:3000/certificate',
    unsubscribeUrl: 'http://localhost:3000/api/email/unsubscribe?token=sample',
  },
  renderDaySevenEmail: {
    displayName: 'Bob Tester',
    email: 'bob@example.com',
    trackerUrl: 'http://localhost:3000/account#tracker',
    certificateUrl: 'http://localhost:3000/certificate',
    unsubscribeUrl: 'http://localhost:3000/api/email/unsubscribe?token=sample',
  },
  renderDayTwentyFiveEmail: {
    displayName: 'Bob Tester',
    email: 'bob@example.com',
    trackerUrl: 'http://localhost:3000/account#tracker',
    certificateUrl: 'http://localhost:3000/certificate',
    unsubscribeUrl: 'http://localhost:3000/api/email/unsubscribe?token=sample',
  },
  renderDayFortyEmail: {
    displayName: 'Bob Tester',
    email: 'bob@example.com',
    trackerUrl: 'http://localhost:3000/account#tracker',
    certificateUrl: 'http://localhost:3000/certificate',
    unsubscribeUrl: 'http://localhost:3000/api/email/unsubscribe?token=sample',
  },
  renderDayFortyNineEmail: {
    displayName: 'Bob Tester',
    email: 'bob@example.com',
    trackerUrl: 'http://localhost:3000/account#tracker',
    certificateUrl: 'http://localhost:3000/certificate',
    unsubscribeUrl: 'http://localhost:3000/api/email/unsubscribe?token=sample',
  },
  renderDayFiftyEmail: {
    displayName: 'Bob Tester',
    email: 'bob@example.com',
    trackerUrl: 'http://localhost:3000/account#tracker',
    certificateUrl: 'http://localhost:3000/certificate',
    unsubscribeUrl: 'http://localhost:3000/api/email/unsubscribe?token=sample',
  },
  renderBananaDayPremiumEmail: {
    displayName: 'Bob Tester',
    email: 'bob@example.com',
    trackerUrl: 'http://localhost:3000/account#tracker',
    isPremium: true,
    hasBuddy: false,
    currentDay: 5,
    hasProtectionForWeek: false,
    unsubscribeUrl: 'http://localhost:3000/api/email/unsubscribe?token=sample',
  },
  renderBananaDayFreeEmail: {
    displayName: 'Bob Tester',
    email: 'bob@example.com',
    trackerUrl: 'http://localhost:3000/account#tracker',
    isPremium: false,
    hasBuddy: false,
    currentDay: 5,
    unsubscribeUrl: 'http://localhost:3000/api/email/unsubscribe?token=sample',
  },
  renderThreeDayQuietEmail: {
    displayName: 'Bob Tester',
    email: 'bob@example.com',
    trackerUrl: 'http://localhost:3000/account#tracker',
    isPremium: false,
    hasBuddy: false,
    currentDay: 5,
    unsubscribeUrl: 'http://localhost:3000/api/email/unsubscribe?token=sample',
  },
  renderSevenDayQuietEmail: {
    displayName: 'Bob Tester',
    email: 'bob@example.com',
    trackerUrl: 'http://localhost:3000/account#tracker',
    isPremium: false,
    hasBuddy: false,
    currentDay: 5,
    unsubscribeUrl: 'http://localhost:3000/api/email/unsubscribe?token=sample',
  },
  renderFourteenDayQuietEmail: {
    displayName: 'Bob Tester',
    email: 'bob@example.com',
    trackerUrl: 'http://localhost:3000/account#tracker',
    isPremium: false,
    hasBuddy: false,
    currentDay: 5,
    unsubscribeUrl: 'http://localhost:3000/api/email/unsubscribe?token=sample',
  },
  renderBuddyStartedEmail: {
    displayName: 'Bob',
    email: 'bob@example.com',
    buddyName: 'Alice',
    trackerUrl: 'http://localhost:3000/account#tracker',
    unsubscribeUrl: 'http://localhost:3000/api/email/unsubscribe?token=sample',
  },
  renderBuddyFinishedEmail: {
    displayName: 'Bob',
    email: 'bob@example.com',
    buddyName: 'Alice',
    trackerUrl: 'http://localhost:3000/account#tracker',
    unsubscribeUrl: 'http://localhost:3000/api/email/unsubscribe?token=sample',
  },
};

function printUsage(): void {
  const names = Object.keys(RENDERERS).sort().join('\n  ');
  console.error(`Usage:
  tsx scripts/render-email.tsx <renderer-name> <args-json> <out-dir>

Renderers:
  ${names}

If <args-json> is omitted, sensible placeholders are used (handy for
visual review). <out-dir> is created if it doesn't exist.

Examples:
  tsx scripts/render-email.tsx renderWelcomeEmail \\
    '{"displayName":"Bob","email":"bob@example.com","signInUrl":"http://localhost:3000/account"}' \\
    /tmp/email-preview/welcome

  tsx scripts/render-email.tsx renderDayFiftyEmail '' /tmp/d50
`);
}

function main(): void {
  const [, , rendererName, argsJsonRaw, outDir] = process.argv;
  if (!rendererName || rendererName === '--help' || rendererName === '-h') {
    printUsage();
    process.exit(rendererName ? 0 : 1);
  }
  const render = RENDERERS[rendererName];
  if (!render) {
    console.error(`Unknown renderer: ${rendererName}\n`);
    printUsage();
    process.exit(1);
  }
  if (!outDir) {
    console.error('Missing <out-dir>\n');
    printUsage();
    process.exit(1);
  }

  let args: unknown;
  if (argsJsonRaw && argsJsonRaw.trim() !== '') {
    try {
      args = JSON.parse(argsJsonRaw);
    } catch (err) {
      console.error(`Failed to parse args JSON: ${(err as Error).message}`);
      process.exit(1);
    }
  } else {
    args = PLACEHOLDER_ARGS[rendererName] ?? {};
    console.error(`Using placeholder args for ${rendererName}:`);
    console.error(`  ${JSON.stringify(args)}\n`);
  }

  let rendered: Rendered;
  try {
    rendered = render(args);
  } catch (err) {
    console.error(`Renderer threw: ${(err as Error).message}`);
    process.exit(1);
  }

  mkdirSync(outDir, { recursive: true });
  writeFileSync(`${outDir}/subject.txt`, rendered.subject + '\n', 'utf8');
  writeFileSync(`${outDir}/body.html`, rendered.html, 'utf8');
  writeFileSync(`${outDir}/body.txt`, rendered.text + '\n', 'utf8');

  console.log(`Subject: ${rendered.subject}`);
  console.log(`Reply-to: ${rendered.replyTo}`);
  console.log(`Wrote:`);
  console.log(`  ${outDir}/subject.txt`);
  console.log(`  ${outDir}/body.html`);
  console.log(`  ${outDir}/body.txt`);
}

main();