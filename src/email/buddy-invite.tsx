// Buddy activation email. Sent to the buddy when the purchaser
// completes the buddy-pair checkout. Subject includes the
// purchaser's first name so it lands in the inbox (not spam)
// and the recipient knows who initiated it.
//
// The 14-day activation window is mentioned once, in the small
// print — quiet reminder tone, no countdown, no urgency.

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
}: Args): { subject: string; html: string; text: string } {
  const subject = `${purchaserName} just bought you a FIT50 seat`;

  const text = `Hi ${buddyName},

${purchaserName} has bought you a seat on FIT50 — a 50-day challenge for people who want to finish with something to show for it. Nine daily disciplines, one project you build, fifty days.

${personalNote ? `\nTheir note to you:\n${personalNote}\n` : ''}
You've been given a paid account — no cost to you, they picked up the tab. To activate it, click below and set a password.

You don't have to start the 50 days today — finish activating, then start whenever you're ready.

Activate your seat: ${activationUrl}

The activation link is open for 14 days. After that, if you haven't activated, the seat becomes a gift code your friend can pass to someone else.

Not interested? No worries — just ignore this email. Nothing else will come from us if you don't activate.

— The FIT50 team
${purchaserName} (${purchaserEmail}) bought you the seat. Contact them with any questions about it.`;

  const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(subject)}</title>
  </head>
  <body style="margin:0;padding:0;background:#F6F1E5;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;color:#1A1A1A;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#F6F1E5;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;background:#FFFFFF;border:1px solid #E5E0D0;">
            <tr>
              <td style="padding:32px 32px 8px 32px;">
                <p style="margin:0;font-family:Georgia,serif;font-size:22px;line-height:1.2;color:#1A1A1A;">
                  Hi ${escapeHtml(buddyName)},
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 32px;">
                <p style="margin:0 0 16px 0;font-size:16px;line-height:1.5;color:#1A1A1A;">
                  <strong>${escapeHtml(purchaserName)}</strong> has bought you a seat on
                  <strong>FIT50</strong> — a 50-day challenge for people who want to finish with
                  something to show for it. Nine daily disciplines, one project you build,
                  fifty days.
                </p>
              </td>
            </tr>
            ${personalNote ? `
            <tr>
              <td style="padding:0 32px 16px 32px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#F6F1E5;border-left:3px solid #E88B5A;">
                  <tr>
                    <td style="padding:16px 20px;font-style:italic;font-size:15px;color:#1A1A1A;line-height:1.5;">
                      "${escapeHtml(personalNote)}"
                    </td>
                  </tr>
                </table>
              </td>
            </tr>` : ''}
            <tr>
              <td style="padding:8px 32px 24px 32px;">
                <p style="margin:0 0 8px 0;font-size:16px;line-height:1.5;color:#1A1A1A;">
                  You've been given a paid account — no cost to you, they picked up the tab.
                </p>
                <p style="margin:0 0 24px 0;font-size:16px;line-height:1.5;color:#1A1A1A;">
                  You don't have to start the 50 days today — finish activating, then start
                  whenever you're ready.
                </p>
                <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td style="background:#E88B5A;">
                      <a href="${escapeHtml(activationUrl)}"
                         style="display:inline-block;padding:14px 28px;color:#FFFFFF;font-size:14px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;text-decoration:none;">
                        Activate your seat →
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 32px 24px 32px;border-top:1px solid #E5E0D0;">
                <p style="margin:16px 0 0 0;font-size:12px;line-height:1.5;color:#1A1A1A99;">
                  The activation link is open for 14 days. After that, if you haven't activated,
                  the seat becomes a gift code your friend can pass to someone else.
                </p>
                <p style="margin:8px 0 0 0;font-size:12px;line-height:1.5;color:#1A1A1A99;">
                  Not interested? Just ignore this email. Nothing else will come from us.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px;background:#F6F1E5;font-size:11px;color:#1A1A1A66;line-height:1.5;">
                <strong>${escapeHtml(purchaserName)}</strong> (${escapeHtml(purchaserEmail)})
                bought you this seat. Reply to them with any questions about it.<br/>
                — The FIT50 team
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { subject, html, text };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
