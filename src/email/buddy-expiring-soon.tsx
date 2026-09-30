// Buddy mid-window reminder. Sent by the buddy-expiring-soon cron
// roughly 3 days before the activation link expires.
//
// Tone is the same as the rest of the buddy-flow emails:
// transactional (no outreach footer, no unsubscribe), and calls back
// to the "shouted you a beer" line so the giftee remembers who's
// behind the gift.

import {
  EMAIL_STYLES,
  EmailType,
  ctaButton,
  emailShell,
  escapeHtml,
  paragraph,
  replyToFor,
  signature,
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
  const preheader = `${purchaserName} just shouted you a beer. Don't let it expire.`;

  const body = `
    <p style="margin:0 0 16px 0;font-family:${EMAIL_STYLES.displayFamily};font-size:24px;line-height:1.2;">
      Hi ${escapeHtml(name)},
    </p>
    ${paragraph(
      `${escapeHtml(purchaserName)} just shouted you a beer — and you&apos;re in. But your seat expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'}.`
    )}
    ${paragraph(
      `After that it becomes a gift code your friend can pass on, and the activation link stops working.`
    )}
    ${paragraph(
      `It takes about 60 seconds to set a password and you&apos;re in. Then start day one whenever you&apos;re ready.`
    )}
    ${ctaButton(activationUrl, 'Activate my seat')}
    ${signature()}
  `;

  const text = `Hi ${name},

${purchaserName} just shouted you a beer — and you're in. But your seat expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'}.

After that it becomes a gift code your friend can pass on, and the activation link stops working.

It takes about 60 seconds to set a password and you're in. Then start day one whenever you're ready.

Activate my seat: ${activationUrl}

— Barny (and the FIT50 team)`;

  return {
    subject,
    html: emailShell({ subject, preheader, bodyHtml: body }),
    text,
    replyTo: replyToFor('buddy' as EmailType),
  };
}
