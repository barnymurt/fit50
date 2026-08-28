// Buddy activation email. Sent to the buddy when the purchaser
// completes the buddy-pair checkout. Subject includes the
// purchaser's first name so it lands in the inbox (not spam)
// and the recipient knows who initiated it.
//
// The 14-day activation window is mentioned once, in the small
// print — quiet reminder tone, no countdown, no urgency.
//
// Transactional: NO outreach footer, NO unsubscribe. Reply-to
// routes to `buddy@fit50challenge.io` because replies are usually
// questions about the pair, not the platform.

import {
  EMAIL_STYLES,
  EmailType,
  ctaButton,
  emailShell,
  escapeHtml,
  mutedParagraph,
  replyToFor,
  emailSignature,
} from './_shared';

interface Args {
  buddyName: string;
  purchaserName: string;
  purchaserEmail: string;
  personalNote?: string;
  activationUrl: string;
}

export function renderBuddyInviteEmail({
  buddyName,
  purchaserName,
  purchaserEmail,
  personalNote,
  activationUrl,
}: Args): { subject: string; html: string; text: string; replyTo: string } {
  const subject = `${purchaserName} just bought you a FIT50 seat`;
  const preheader = `${purchaserName} has bought you a seat — activate when you're ready.`;

  // The personal note renders as a coral-bordered quote block when
  // present. Otherwise the section is omitted entirely (no empty box).
  const personalNoteHtml = personalNote
    ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:${EMAIL_STYLES.background};border-left:3px solid ${EMAIL_STYLES.coral};margin:0 0 24px 0;">
        <tr>
          <td style="padding:16px 20px;font-style:italic;font-size:15px;color:${EMAIL_STYLES.ink};line-height:1.5;">
            &ldquo;${escapeHtml(personalNote)}&rdquo;
          </td>
        </tr>
      </table>`
    : '';

  const body = `
    <p style="margin:0 0 16px 0;font-family:${EMAIL_STYLES.displayFamily};font-size:24px;line-height:1.2;">
      Hi ${escapeHtml(buddyName)},
    </p>
    <p style="margin:0 0 16px 0;font-size:16px;line-height:1.5;">
      <strong>${escapeHtml(purchaserName)}</strong> has bought you a seat on
      <strong>FIT50</strong> — a 50-day challenge for people who want to finish with
      something to show for it. Nine daily disciplines, one project you build,
      fifty days.
    </p>
    ${personalNoteHtml}
    <p style="margin:0 0 8px 0;font-size:16px;line-height:1.5;">
      You&apos;ve been given a paid account — no cost to you, they picked up the tab.
    </p>
    <p style="margin:0 0 24px 0;font-size:16px;line-height:1.5;">
      You don&apos;t have to start the 50 days today — finish activating, then start
      whenever you&apos;re ready.
    </p>
    ${ctaButton(activationUrl, 'Activate your seat')}
    ${mutedParagraph(
      `The activation link is open for 14 days. After that, if you haven't activated, the seat becomes a gift code your friend can pass to someone else.`
    )}
    ${mutedParagraph(
      `Not interested? Just ignore this email. Nothing else will come from us.`
    )}
    <p style="margin:24px 0 0 0;padding-top:16px;border-top:1px solid ${EMAIL_STYLES.border};font-size:11px;line-height:1.5;color:${EMAIL_STYLES.inkMuted};">
      <strong>${escapeHtml(purchaserName)}</strong> (${escapeHtml(purchaserEmail)})
      bought you this seat. Reply to them with any questions about it.
      <br />
      ${emailSignature}
    </p>
  `;

  const text = `Hi ${buddyName},

${purchaserName} has bought you a seat on FIT50 — a 50-day challenge for people who want to finish with something to show for it. Nine daily disciplines, one project you build, fifty days.

${personalNote ? `\nTheir note to you:\n${personalNote}\n` : ''}You've been given a paid account — no cost to you, they picked up the tab. To activate it, click below and set a password.

You don't have to start the 50 days today — finish activating, then start whenever you're ready.

Activate your seat: ${activationUrl}

The activation link is open for 14 days. After that, if you haven't activated, the seat becomes a gift code your friend can pass to someone else.

Not interested? No worries — just ignore this email. Nothing else will come from us if you don't activate.

— The FIT50 team
${purchaserName} (${purchaserEmail}) bought you the seat. Contact them with any questions about it.`;

  return {
    subject,
    html: emailShell({ subject, preheader, bodyHtml: body }),
    text,
    replyTo: replyToFor('buddy' as EmailType),
  };
}