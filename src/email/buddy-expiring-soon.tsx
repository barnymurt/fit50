// Buddy mid-window reminder. Sent by the buddy-expiring-soon cron
// roughly 3 days before the activation link expires.
//
// Tone is the same as the rest of the buddy-flow emails:
// transactional (no outreach footer, no unsubscribe). Calls back to
// the buddy-invite ("shouted you a seat on FIT50") — NOT to the
// activated email ("shouted you a beer"), which is the celebration
// of acceptance and would confuse the giftee who hasn't activated
// yet.

import {
  EMAIL_STYLES,
  EmailType,
  ctaButton,
  emailShell,
  escapeHtml,
  paragraph,
  replyToFor,
  signature,
  emailSignature,
} from './_shared';

interface Args {
  displayName: string | null;
  email: string;
  purchaserName: string;
  activationUrl: string;
  daysLeft: number;
}

export function renderBuddyExpiringSoonEmail({
  displayName,
  email,
  purchaserName,
  activationUrl,
  daysLeft,
}: Args): { subject: string; html: string; text: string; replyTo: string } {
  const name = displayName || email.split('@')[0];
  const subject = `Your FIT50 seat expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`;
  const preheader = `In ${daysLeft} day${daysLeft === 1 ? '' : 's'} it turns into a gift code ${purchaserName} can pass on.`;

  const body = `
    <p style="margin:0 0 16px 0;font-family:${EMAIL_STYLES.displayFamily};font-size:24px;line-height:1.2;">
      Hi ${escapeHtml(name)},
    </p>
    ${paragraph(
      `${escapeHtml(purchaserName)} shouted you a seat on FIT50 — but the activation link expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'}.`
    )}
    ${paragraph(
      `After that the seat becomes a gift code your mate can pass on to someone else, and the activation link stops working.`
    )}
    ${paragraph(
      `It takes about 60 seconds to set a password and you&apos;re in. Drop ${escapeHtml(purchaserName)} a message and pick a start date together — that&apos;s when day one starts.`
    )}
    ${ctaButton(activationUrl, 'Activate my seat')}
    ${signature()}
  `;

  const text = `Hi ${name},

${purchaserName} shouted you a seat on FIT50 — but the activation link expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'}.

After that the seat becomes a gift code your mate can pass on to someone else, and the activation link stops working.

It takes about 60 seconds to set a password and you're in. Drop ${purchaserName} a message and pick a start date together — that's when day one starts.

Activate my seat: ${activationUrl}

${emailSignature}`;

  return {
    subject,
    html: emailShell({ subject, preheader, bodyHtml: body }),
    text,
    replyTo: replyToFor('buddy' as EmailType),
  };
}
