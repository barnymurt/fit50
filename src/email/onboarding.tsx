// Onboarding emails — sent to brand-new accounts.
//
// 1. First-tap nudge: fires 24h after signup if pendingTaps is still
//    empty. The streak only counts from day one — get them on the
//    board while the account is still warm.
//
// 2. Day 3 check-in: fires 72h after signup if they've completed
//    fewer than 3 habits. Surface the easiest habit to start with
//    rather than a generic "keep going".
//
// Tone: low-key, useful, not pushy. These are the first non-transactional
// outreach emails a new user gets — if they feel like marketing, we
// lose. See BRAND_VOICE.md for the rules.

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
}

function nameOrLocal(args: Args): string {
  return args.displayName || args.email.split('@')[0];
}

// ---------------------------------------------------------------------------
// 1. First-tap nudge — "Day one. Don't miss day two."
// ---------------------------------------------------------------------------

export function renderFirstTapNudgeEmail(args: Args): {
  subject: string;
  html: string;
  text: string;
} {
  const name = nameOrLocal(args);
  const subject = "Day one. Don't miss day two.";
  const preheader =
    "Your tracker is open. Tap one habit — that's all it takes to start the streak.";

  const body = `
    <p style="margin:0 0 16px 0;font-family:${EMAIL_STYLES.displayFamily};font-size:24px;line-height:1.2;">
      Hi ${escapeHtml(name)},
    </p>
    ${paragraph(
      `You signed up yesterday and haven't tapped a habit yet. That's fine — there's no rush. But the streak only counts from day one, so the longer you wait, the longer your real start line moves.`
    )}
    ${paragraph(
      `Pick the easiest one. Wet the lips. Open a window. Whatever takes ten seconds. That's day one.`
    )}
    ${ctaButton(args.trackerUrl, 'Open my tracker')}
    ${mutedParagraph(
      `Reply if anything's broken. We read every one.`
    )}
    ${signature()}
  `;

  const text = `Hi ${name},

You signed up yesterday and haven't tapped a habit yet. That's fine — there's no rush. But the streak only counts from day one, so the longer you wait, the longer your real start line moves.

Pick the easiest one. Wet the lips. Open a window. Whatever takes ten seconds. That's day one.

Open my tracker: ${args.trackerUrl}

Reply if anything's broken. We read every one.

${emailSignature}`;

  return {
    subject,
    html: emailShell({ subject, preheader, bodyHtml: body }),
    text,
  };
}

// ---------------------------------------------------------------------------
// 2. Day 3 check-in — "Three days in. Here's the easiest one to add."
// ---------------------------------------------------------------------------

export function renderDayThreeCheckInEmail(args: Args): {
  subject: string;
  html: string;
  text: string;
} {
  const name = nameOrLocal(args);
  const subject = "Three days in. Here's the easiest one to add.";
  const preheader =
    'No shame in starting small. The Wet The Lips habit is the one most people add next.';

  const body = `
    <p style="margin:0 0 16px 0;font-family:${EMAIL_STYLES.displayFamily};font-size:24px;line-height:1.2;">
      Hi ${escapeHtml(name)},
    </p>
    ${paragraph(
      `You've tapped a few habits over the last three days — but not many. That's okay. Most people who finish this started slow. The point isn't day three, it's day fifty.`
    )}
    ${paragraph(`If you want the easiest next habit to add:`)}
    <ol style="margin:0 0 24px 0;padding-left:20px;font-size:16px;line-height:1.6;">
      <li style="margin-bottom:8px;">
        <strong>Wet The Lips.</strong> A glass of water before each meal. Ten seconds. That's it.
      </li>
      <li style="margin-bottom:8px;">
        <strong>Chill Out.</strong> Two minutes of deliberate breathing. Anywhere.
      </li>
      <li>
        <strong>Open Mind.</strong> One page of any book, audio included.
      </li>
    </ol>
    ${paragraph(
      `Pick one. Tap it tomorrow. Then come back and add another the day after. Slow is fine.`
    )}
    ${ctaButton(args.trackerUrl, 'Open my tracker')}
    ${mutedParagraph(
      `Reply if something's not clicking. We read every one.`
    )}
    ${signature()}
  `;

  const text = `Hi ${name},

You've tapped a few habits over the last three days — but not many. That's okay. Most people who finish this started slow. The point isn't day three, it's day fifty.

If you want the easiest next habit to add:

1. Wet The Lips. A glass of water before each meal. Ten seconds. That's it.
2. Chill Out. Two minutes of deliberate breathing. Anywhere.
3. Open Mind. One page of any book, audio included.

Pick one. Tap it tomorrow. Then come back and add another the day after. Slow is fine.

Open my tracker: ${args.trackerUrl}

Reply if something's not clicking. We read every one.

${emailSignature}`;

  return {
    subject,
    html: emailShell({ subject, preheader, bodyHtml: body }),
    text,
  };
}