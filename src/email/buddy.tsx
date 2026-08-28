// Buddy-related outreach emails — sent to one half of a pair when the
// other half does something noteworthy.
//
// 1. "Your buddy started day 1" — buyer-side. Triggered when the giftee
//    first opens the tracker or taps a habit. Buyer paid for the seat;
//    this confirms the seat was used.
//
// 2. "Your buddy finished" — both sides. Triggered when a pair member
//    hits day 50. Lower-key than a milestone email; this is for the
//    partner, not the finisher themselves (they get their own day-50).
//
// Tone: still Barny, but written from the perspective of "tell you
// about your buddy" — keeps the existing welcome / activated voice
// without talking down to either party.

import {
  EMAIL_STYLES,
  EmailType,
  ctaButton,
  emailShell,
  escapeHtml,
  mutedParagraph,
  outreachFooterHtml,
  paragraph,
  replyToFor,
  signature,
  emailSignature,
} from './_shared';

interface Args {
  displayName: string | null;
  email: string;
  buddyName: string;
  trackerUrl: string;
  unsubscribeUrl: string;
}

function nameOrLocal(args: Args): string {
  return args.displayName || args.email.split('@')[0];
}

// ---------------------------------------------------------------------------
// 1. Your buddy started day 1.
// ---------------------------------------------------------------------------

export function renderBuddyStartedEmail(args: Args): {
  subject: string;
  html: string;
  text: string;
  replyTo: string;
} {
  const name = nameOrLocal(args);
  const buddy = args.buddyName;
  const subject = `${buddy} is in.`;
  const preheader =
    `Your buddy opened their tracker. The pair is live.`;

  const body = `
    <p style="margin:0 0 16px 0;font-family:${EMAIL_STYLES.displayFamily};font-size:24px;line-height:1.2;">
      Hi ${escapeHtml(name)},
    </p>
    ${paragraph(
      `${escapeHtml(buddy)} just opened their tracker. The seat you bought them is now an actual person, doing an actual day one.`
    )}
    ${paragraph(
      `You can see each other's days from now on. That's the whole point of doing this together — one more reason to show up.`
    )}
    ${ctaButton(args.trackerUrl, 'See my tracker')}
    ${mutedParagraph(
      `Reply if anything looks off. We read every one.`
    )}
    ${signature()}
  `;

  const text = `Hi ${name},

${buddy} just opened their tracker. The seat you bought them is now an actual person, doing an actual day one.

You can see each other's days from now on. That's the whole point of doing this together — one more reason to show up.

See my tracker: ${args.trackerUrl}

Reply if anything looks off. We read every one.

${emailSignature}`;

  return {
    subject,
    html: emailShell({
      subject,
      preheader,
      bodyHtml: body,
      footerHtml: outreachFooterHtml({ unsubscribeUrl: args.unsubscribeUrl }),
    }),
    text,
    replyTo: replyToFor('buddy' as EmailType),
  };
}

// ---------------------------------------------------------------------------
// 2. Your buddy finished.
// ---------------------------------------------------------------------------

export function renderBuddyFinishedEmail(args: Args): {
  subject: string;
  html: string;
  text: string;
  replyTo: string;
} {
  const name = nameOrLocal(args);
  const buddy = args.buddyName;
  const subject = `${buddy} finished.`;
  const preheader =
    'Your buddy hit day 50. Forty-nine days of showing up.';

  const body = `
    <p style="margin:0 0 16px 0;font-family:${EMAIL_STYLES.displayFamily};font-size:24px;line-height:1.2;">
      Hi ${escapeHtml(name)},
    </p>
    ${paragraph(
      `${escapeHtml(buddy)} finished. Forty-nine days of showing up, then day fifty, and now they're someone who finishes things.`
    )}
    ${paragraph(
      `You probably had something to do with that — having a pair card open on your tracker that you can see every day is real accountability. Don't underestimate what that was worth.`
    )}
    ${paragraph(
      `If you're still going, keep going. If you've slipped, this is a banana day — and yes, you can use it.`
    )}
    ${ctaButton(args.trackerUrl, 'Open my tracker')}
    ${mutedParagraph(
      `Reply if you'd like — we're always up for a celebration.`
    )}
    ${signature()}
  `;

  const text = `Hi ${name},

${buddy} finished. Forty-nine days of showing up, then day fifty, and now they're someone who finishes things.

You probably had something to do with that — having a pair card open on your tracker that you can see every day is real accountability. Don't underestimate what that was worth.

If you're still going, keep going. If you've slipped, this is a banana day — and yes, you can use it.

Open my tracker: ${args.trackerUrl}

Reply if you'd like — we're always up for a celebration.

${emailSignature}`;

  return {
    subject,
    html: emailShell({
      subject,
      preheader,
      bodyHtml: body,
      footerHtml: outreachFooterHtml({ unsubscribeUrl: args.unsubscribeUrl }),
    }),
    text,
    replyTo: replyToFor('buddy' as EmailType),
  };
}