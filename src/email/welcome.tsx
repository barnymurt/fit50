// Transactional emails that fire immediately on user actions.
//
//   renderWelcomeEmail — brand-new signup (after email confirmation)
//   renderActivatedEmail — giftee accepted their buddy-pair seat
//
// Both are transactional: NO outreach footer, NO unsubscribe link.
// Both DO use the wordmark masthead for brand consistency with the
// outreach templates. Both reply-to `welcome@fit50challenge.io`.
//
// Tone follows BRAND_VOICE.md: warm, direct, useful. These were
// hand-coded in the original repo and are mostly preserved — refactor
// only touched the envelope so they share the masthead + colour
// tokens with the new outreach templates.

import {
  EMAIL_STYLES,
  EmailType,
  ctaButton,
  emailShell,
  escapeHtml,
  mutedParagraph,
  paragraph,
  replyToFor,
  signature,
  emailSignature,
} from './_shared';

interface Args {
  displayName: string | null;
  email: string;
  signInUrl: string;
}

// ---------------------------------------------------------------------------
// Welcome — new signup after email confirmation.
// ---------------------------------------------------------------------------

export function renderWelcomeEmail({
  displayName,
  email,
  signInUrl,
}: Args): { subject: string; html: string; text: string; replyTo: string } {
  const name = displayName || email.split('@')[0];
  const subject = "You're in. First day is on you, whenever you say.";
  const preheader =
    "Fifty days. Nine daily disciplines. One thing you'll finish.";

  const body = `
    <p style="margin:0 0 16px 0;font-family:${EMAIL_STYLES.displayFamily};font-size:24px;line-height:1.2;">
      Hi ${escapeHtml(name)},
    </p>
    ${paragraph(
      `Welcome to FIT50. Fifty days. Nine daily disciplines. One thing you&apos;ll finish. The hardest part isn&apos;t the habits — it&apos;s showing up on day 14 when nobody&apos;s watching.`
    )}
    <p style="margin:0 0 8px 0;font-size:16px;font-weight:600;">
      Three things to do in the next five minutes:
    </p>
    <ol style="margin:0 0 24px 0;padding-left:20px;font-size:16px;line-height:1.6;">
      <li style="margin-bottom:8px;">
        <a href="${escapeHtml(signInUrl)}" style="color:${EMAIL_STYLES.coral};">Sign in</a> and tap the first habit on the tracker. Start whenever you&apos;re ready — but the streak only counts from day one.
      </li>
      <li style="margin-bottom:8px;">
        Pick your buddy. €9.99 for two seats, or €4.00 if you&apos;re already on premium. You&apos;re more likely to finish.
      </li>
      <li>
        If a day slips, you&apos;ve got one free pass a week to protect your streak (premium).
      </li>
    </ol>
    ${ctaButton(signInUrl, 'Open my tracker')}
    ${mutedParagraph(
      `Reply if anything breaks. We read every one.`
    )}
    ${signature()}
  `;

  const text = `Hi ${name},

Welcome to FIT50. Fifty days. Nine daily disciplines. One thing you'll finish. The hardest part isn't the habits — it's showing up on day 14 when nobody's watching.

Three things to do in the next five minutes:

1. Sign in: ${signInUrl}
2. Tap the first habit on the tracker to start day one (or wait — start when you're ready, but the streak only counts from day one).
3. Pick your buddy. Bringing a mate is €9.99 for two seats, or €4.00 if you're already on premium. Either way, you're more likely to finish.

If a day slips, you've got one free pass a week to protect your streak (premium feature, €5.99 one-time, yours forever).

Reply to this email if anything breaks — we read every one.

— Barny (and the FIT50 team)`;

  return {
    subject,
    html: emailShell({ subject, preheader, bodyHtml: body }),
    text,
    replyTo: replyToFor('welcome' as EmailType),
  };
}

// ---------------------------------------------------------------------------
// Activated — giftee accepted their buddy-pair seat.
// Different copy because the account exists because someone paid
// for it, not because they signed up directly.
// ---------------------------------------------------------------------------

interface ActivatedArgs {
  displayName: string | null;
  email: string;
  purchaserName: string;
  accountUrl: string;
}

export function renderActivatedEmail({
  displayName,
  email,
  purchaserName,
  accountUrl,
}: ActivatedArgs): { subject: string; html: string; text: string; replyTo: string } {
  const name = displayName || email.split('@')[0];
  const subject = `${purchaserName} just bought you a seat — and you're in`;
  const preheader =
    `${purchaserName} has finished setting up your FIT50 seat — day one starts when you tap the first habit.`;

  const body = `
    <p style="margin:0 0 16px 0;font-family:${EMAIL_STYLES.displayFamily};font-size:24px;line-height:1.2;">
      Hi ${escapeHtml(name)},
    </p>
    ${paragraph(
      `${escapeHtml(purchaserName)} has finished setting up your FIT50 seat — you&apos;re in. They paid, you click. Welcome.`
    )}
    ${paragraph(
      `You don&apos;t have to start the 50 days today. Activate is done, but day one starts when you tap the first habit on the tracker. Start whenever you&apos;re ready.`
    )}
    <p style="margin:0 0 16px 0;font-size:16px;font-weight:600;">
      Three things to know:
    </p>
    <ol style="margin:0 0 24px 0;padding-left:20px;font-size:16px;line-height:1.6;">
      <li style="margin-bottom:8px;">
        You can see each other&apos;s streaks. That&apos;s the whole point of doing this together — one more reason to show up.
      </li>
      <li style="margin-bottom:8px;">
        You&apos;ve got one free pass a week to protect the streak if you slip. Use it before Sunday midnight.
      </li>
      <li>
        The hardest day is day 14, not day 1. Stay close to your buddy.
      </li>
    </ol>
    ${ctaButton(accountUrl, 'Open my tracker')}
    ${mutedParagraph(
      `Reply to this email if anything breaks. We read every one.`
    )}
    ${signature()}
  `;

  const text = `Hi ${name},

${purchaserName} has finished setting up your FIT50 seat — you're in. They paid, you click. Welcome.

You don't have to start the 50 days today. Activate is done, but day one starts when you tap the first habit on the tracker. Start whenever you're ready.

Three things to know:

1. You can see each other's streaks. That's the whole point of doing this together — one more reason to show up.
2. You've got one free pass a week to protect the streak if you slip. Use it before Sunday midnight.
3. The hardest day is day 14, not day 1. Stay close to your buddy.

Open your tracker: ${accountUrl}

Reply to this email if anything breaks — we read every one.

${emailSignature}`;

  return {
    subject,
    html: emailShell({ subject, preheader, bodyHtml: body }),
    text,
    replyTo: replyToFor('welcome' as EmailType),
  };
}