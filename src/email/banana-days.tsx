// Banana-day emails — the platform's framing for "you slipped".
// We don't say "you missed a day". We say "you earned a banana
// day." 🍌 is the streak-protection icon (see Tracker.tsx) and the
// underlying feature is the one free pass a week that premium users
// get (see useStreakProtection.ts).
//
// Five emails in this file:
//   1. day slip — premium  ("you have a banana to spend")
//   2. day slip — free     ("tomorrow's a clean slate")
//   3. 3-day quiet         ("still on for day X?")
//   4. 7-day quiet         ("we saved your seat")
//   5. 14-day quiet        ("fresh start")
//
// (The 30-day quiet email is the soft win-back — separate file
// would be a stretch, so it lives here too as renderThirtyDayQuiet.)

import {
  EMAIL_STYLES,
  ctaButton,
  emailShell,
  escapeHtml,
  mutedParagraph,
  paragraph,
  signature,
  emailSignature,
} from './_shared';

interface Args {
  displayName: string | null;
  email: string;
  trackerUrl: string;
  isPremium: boolean;
  hasBuddy: boolean;
  buddyName?: string | null;
  currentDay: number; // the day they're on when this fires
  hasProtectionForWeek?: boolean; // optional, for premium path
}

function nameOrLocal(args: Args): string {
  return args.displayName || args.email.split('@')[0];
}

const SHARED_PREHEADER =
  'You earned a banana day. Tomorrow is yours — same as always.';

// ---------------------------------------------------------------------------
// 1. Day slip — premium.  Use the streak protection pass.
// ---------------------------------------------------------------------------

export function renderBananaDayPremiumEmail(args: Args): {
  subject: string;
  html: string;
  text: string;
} {
  const name = nameOrLocal(args);
  const subject = '🍌 Banana day. Use the pass.';
  const preheader =
    'You earned a banana day. Tap it before midnight Sunday and the streak holds.';

  const body = `
    <p style="margin:0 0 16px 0;font-family:${EMAIL_STYLES.displayFamily};font-size:24px;line-height:1.2;">
      Hi ${escapeHtml(name)},
    </p>
    ${paragraph(
      `Day ${args.currentDay - 1} slipped. That's a banana day — and you have a banana to spend.`
    )}
    ${paragraph(
      `Tap the streak protection card on your tracker before midnight Sunday and the streak holds. You'll see the week reset on Monday as if nothing happened.`
    )}
    ${paragraph(
      `If you've already used this week's pass, the link will tell you so — no need to remember.`
    )}
    ${ctaButton(args.trackerUrl, 'Use my streak protection')}
    ${mutedParagraph(
      `Banana days exist so a bad day doesn't end the whole run. Use them.`
    )}
    ${signature()}
  `;

  const text = `Hi ${name},

Day ${args.currentDay - 1} slipped. That's a banana day — and you have a banana to spend.

Tap the streak protection card on your tracker before midnight Sunday and the streak holds. You'll see the week reset on Monday as if nothing happened.

If you've already used this week's pass, the link will tell you so — no need to remember.

Use my streak protection: ${args.trackerUrl}

Banana days exist so a bad day doesn't end the whole run. Use them.

${emailSignature}`;

  return {
    subject,
    html: emailShell({ subject, preheader, bodyHtml: body }),
    text,
  };
}

// ---------------------------------------------------------------------------
// 2. Day slip — free user.  No streak protection, just a clean slate.
// ---------------------------------------------------------------------------

export function renderBananaDayFreeEmail(args: Args): {
  subject: string;
  html: string;
  text: string;
} {
  const name = nameOrLocal(args);
  const subject = '🍌 Banana day. Tomorrow is yours.';
  const preheader = SHARED_PREHEADER;

  const body = `
    <p style="margin:0 0 16px 0;font-family:${EMAIL_STYLES.displayFamily};font-size:24px;line-height:1.2;">
      Hi ${escapeHtml(name)},
    </p>
    ${paragraph(
      `You missed a day. That's a banana day. Premium members can spend a banana to keep the streak — you don't have that, so the streak resets and that's fine.`
    )}
    ${paragraph(
      `The thing to remember is that this isn't a failure. It's a Tuesday. Tap the same nine habits tomorrow and the run continues from a fresh line.`
    )}
    ${paragraph(
      `If you'd like the protection pass, it's a one-time €5.99 — yours forever, one banana a week for the rest of the challenge. No subscription, no renewal nonsense.`
    )}
    ${ctaButton(args.trackerUrl, 'Open my tracker')}
    ${mutedParagraph(
      `Banana days exist so a bad day doesn't end the whole run. Even without the pass, tomorrow is still day one.`
    )}
    ${signature()}
  `;

  const text = `Hi ${name},

You missed a day. That's a banana day. Premium members can spend a banana to keep the streak — you don't have that, so the streak resets and that's fine.

The thing to remember is that this isn't a failure. It's a Tuesday. Tap the same nine habits tomorrow and the run continues from a fresh line.

If you'd like the protection pass, it's a one-time €5.99 — yours forever, one banana a week for the rest of the challenge. No subscription, no renewal nonsense.

Open my tracker: ${args.trackerUrl}

Banana days exist so a bad day doesn't end the whole run. Even without the pass, tomorrow is still day one.

${emailSignature}`;

  return {
    subject,
    html: emailShell({ subject, preheader, bodyHtml: body }),
    text,
  };
}

// ---------------------------------------------------------------------------
// 3. Three days quiet.  Still on for day X?
// ---------------------------------------------------------------------------

export function renderThreeDayQuietEmail(args: Args): {
  subject: string;
  html: string;
  text: string;
} {
  const name = nameOrLocal(args);
  const subject = `Day ${args.currentDay}. Still in?`;
  const preheader =
    "Three days since you tapped a habit. Want to pick it back up?";

  const body = `
    <p style="margin:0 0 16px 0;font-family:${EMAIL_STYLES.displayFamily};font-size:24px;line-height:1.2;">
      Hi ${escapeHtml(name)},
    </p>
    ${paragraph(
      `Three days since you've tapped a habit. That's not a streak yet — it's a quiet patch. We've all had them.`
    )}
    ${paragraph(
      `If you want to come back, the easiest on-ramp is the same one as day one: tap the smallest habit tomorrow. Just one. The rest of the row tends to follow when the smallest one is done.`
    )}
    ${ctaButton(args.trackerUrl, 'Open my tracker')}
    ${mutedParagraph(
      args.hasBuddy
        ? `Your buddy is still going — pop in and see how they're doing.`
        : `No judgment. The streak resets when you tap again, not before.`
    )}
    ${signature()}
  `;

  const text = `Hi ${name},

Three days since you've tapped a habit. That's not a streak yet — it's a quiet patch. We've all had them.

If you want to come back, the easiest on-ramp is the same one as day one: tap the smallest habit tomorrow. Just one. The rest of the row tends to follow when the smallest one is done.

Open my tracker: ${args.trackerUrl}

${
  args.hasBuddy
    ? `Your buddy is still going — pop in and see how they're doing.`
    : `No judgment. The streak resets when you tap again, not before.`
}

${emailSignature}`;

  return {
    subject,
    html: emailShell({ subject, preheader, bodyHtml: body }),
    text,
  };
}

// ---------------------------------------------------------------------------
// 4. Seven days quiet.  We saved your seat.
// ---------------------------------------------------------------------------

export function renderSevenDayQuietEmail(args: Args): {
  subject: string;
  html: string;
  text: string;
} {
  const name = nameOrLocal(args);
  const subject = `We saved your seat. Day ${args.currentDay}.`;
  const preheader =
    "A week's been quiet on your end. Nothing's been deleted — pick up where you left off.";

  const body = `
    <p style="margin:0 0 16px 0;font-family:${EMAIL_STYLES.displayFamily};font-size:24px;line-height:1.2;">
      Hi ${escapeHtml(name)},
    </p>
    ${paragraph(
      `A week of silence on your end. We held the seat — your progress from day 1 through day ${args.currentDay - 1} is still in your tracker, your streak is still counted up to where it broke, your buddies still see your card. Nothing's been deleted.`
    )}
    ${paragraph(
      `If you want to come back, the door is open. Tap any habit today and the run resumes from a fresh day-one line.`
    )}
    ${paragraph(
      `If you don't — that's okay too. We'll stop nudging after this one.`
    )}
    ${ctaButton(args.trackerUrl, 'Open my tracker')}
    ${signature()}
  `;

  const text = `Hi ${name},

A week of silence on your end. We held the seat — your progress from day 1 through day ${args.currentDay - 1} is still in your tracker, your streak is still counted up to where it broke, your buddies still see your card. Nothing's been deleted.

If you want to come back, the door is open. Tap any habit today and the run resumes from a fresh day-one line.

If you don't — that's okay too. We'll stop nudging after this one.

Open my tracker: ${args.trackerUrl}

${emailSignature}`;

  return {
    subject,
    html: emailShell({ subject, preheader, bodyHtml: body }),
    text,
  };
}

// ---------------------------------------------------------------------------
// 5. Fourteen days quiet.  Fresh start.
// ---------------------------------------------------------------------------

export function renderFourteenDayQuietEmail(args: Args): {
  subject: string;
  html: string;
  text: string;
} {
  const name = nameOrLocal(args);
  const subject = 'Fresh start if you want one.';
  const preheader =
    'Two weeks since the last tap. The old streak is gone but you can start a new one today.';

  const body = `
    <p style="margin:0 0 16px 0;font-family:${EMAIL_STYLES.displayFamily};font-size:24px;line-height:1.2;">
      Hi ${escapeHtml(name)},
    </p>
    ${paragraph(
      `Two weeks since the last tap. The old run is over. We won't say "you failed" — you didn't, you just stopped, and that's different.`
    )}
    ${paragraph(
      `If you want a fresh start, today is as good a day as any. Tap one habit. Day one starts again, fresh.`
    )}
    ${paragraph(
      `If you're done — that's also fine. We're not going to keep emailing. This is the last one unless you sign in.`
    )}
    ${ctaButton(args.trackerUrl, 'Start again')}
    ${signature()}
  `;

  const text = `Hi ${name},

Two weeks since the last tap. The old run is over. We won't say "you failed" — you didn't, you just stopped, and that's different.

If you want a fresh start, today is as good a day as any. Tap one habit. Day one starts again, fresh.

If you're done — that's also fine. We're not going to keep emailing. This is the last one unless you sign in.

Start again: ${args.trackerUrl}

${emailSignature}`;

  return {
    subject,
    html: emailShell({ subject, preheader, bodyHtml: body }),
    text,
  };
}