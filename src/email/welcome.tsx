// Welcome email sent to a brand-new account the moment they hit the
// confirmation step. Tone is warm, direct, and useful: we tell them
// what just happened and what to do first. No marketing fluff.

interface Args {
  displayName: string | null;
  email: string;
  signInUrl: string;
}

export function renderWelcomeEmail({
  displayName,
  email,
  signInUrl,
}: Args): { subject: string; html: string; text: string } {
  const name = displayName || email.split('@')[0];
  const subject = `You're in. First day is on you, whenever you say.`;

  const text = `Hi ${name},

Welcome to FIT50.

Fifty days. Nine daily disciplines. One thing you'll finish. The hardest part isn't the habits — it's showing up on day 14 when nobody's watching.

Three things to do in the next five minutes:

1. Sign in: ${signInUrl}
2. Tap the first habit on the tracker to start day one (or wait — start when you're ready, but the streak only counts from day one).
3. Pick your buddy. Bringing a mate is €9.99 for two seats, or €4.00 if you're already on premium. Either way, you're more likely to finish.

If a day slips, you've got one free pass a week to protect your streak (premium feature, €5.99 one-time, yours forever).

Reply to this email if anything breaks — we read every one.

— Barny (and the FIT50 team)`;

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
              <td style="padding:32px;">
                <p style="margin:0 0 16px 0;font-family:Georgia,serif;font-size:24px;line-height:1.2;">
                  Hi ${escapeHtml(name)},
                </p>
                <p style="margin:0 0 24px 0;font-size:16px;line-height:1.5;">
                  Welcome to FIT50. Fifty days. Nine daily disciplines. One thing you&apos;ll finish.
                </p>
                <p style="margin:0 0 24px 0;font-size:16px;line-height:1.5;">
                  The hardest part isn&apos;t the habits — it&apos;s showing up on day 14 when nobody&apos;s watching.
                </p>
                <p style="margin:0 0 8px 0;font-size:16px;font-weight:600;">
                  Three things to do in the next five minutes:
                </p>
                <ol style="margin:0 0 24px 0;padding-left:20px;font-size:16px;line-height:1.6;">
                  <li style="margin-bottom:8px;">
                    <a href="${escapeHtml(signInUrl)}" style="color:#E88B5A;">Sign in</a> and tap the first habit on the tracker. Start whenever you&apos;re ready — but the streak only counts from day one.
                  </li>
                  <li style="margin-bottom:8px;">
                    Pick your buddy. €9.99 for two seats, or €4.00 if you&apos;re already on premium. You&apos;re more likely to finish.
                  </li>
                  <li>
                    If a day slips, you&apos;ve got one free pass a week to protect your streak (premium).
                  </li>
                </ol>
                <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td style="background:#E88B5A;">
                      <a href="${escapeHtml(signInUrl)}"
                         style="display:inline-block;padding:14px 28px;color:#FFFFFF;font-size:14px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;text-decoration:none;">
                        Open my tracker →
                      </a>
                    </td>
                  </tr>
                </table>
                <p style="margin:24px 0 0 0;font-size:14px;line-height:1.5;color:#1A1A1A99;">
                  Reply to this email if anything breaks. We read every one.
                </p>
                <p style="margin:16px 0 0 0;font-family:Georgia,serif;font-size:16px;font-style:italic;color:#1A1A1A99;">
                  — Barny (and the FIT50 team)
                </p>
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

// Welcome email sent to a user who just activated their account
// through the buddy-pair flow. Different copy because their account
// exists because someone paid for it, not because they signed up
// directly.

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
}: ActivatedArgs): { subject: string; html: string; text: string } {
  const name = displayName || email.split('@')[0];
  const subject = `${purchaserName} just bought you a seat — and you're in`;

  const text = `Hi ${name},

${purchaserName} has finished setting up your FIT50 seat — you're in. They paid, you click. Welcome.

You don't have to start the 50 days today. Activate is done, but day one starts when you tap the first habit on the tracker. Start whenever you're ready.

Three things to know:

1. You can see each other's streaks. That's the whole point of doing this together — one more reason to show up.
2. You've got one free pass a week to protect the streak if you slip. Use it before Sunday midnight.
3. The hardest day is day 14, not day 1. Stay close to your buddy.

Open your tracker: ${accountUrl}

— Barny (and the FIT50 team)`;

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
              <td style="padding:32px;">
                <p style="margin:0 0 16px 0;font-family:Georgia,serif;font-size:24px;line-height:1.2;">
                  Hi ${escapeHtml(name)},
                </p>
                <p style="margin:0 0 16px 0;font-size:16px;line-height:1.5;">
                  ${escapeHtml(purchaserName)} has finished setting up your FIT50 seat — you&apos;re in. They paid, you click. Welcome.
                </p>
                <p style="margin:0 0 24px 0;font-size:16px;line-height:1.5;">
                  You don&apos;t have to start the 50 days today. Activate is done, but day one starts when you tap the first habit on the tracker. Start whenever you&apos;re ready.
                </p>
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
                <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td style="background:#E88B5A;">
                      <a href="${escapeHtml(accountUrl)}"
                         style="display:inline-block;padding:14px 28px;color:#FFFFFF;font-size:14px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;text-decoration:none;">
                        Open my tracker →
                      </a>
                    </td>
                  </tr>
                </table>
                <p style="margin:24px 0 0 0;font-family:Georgia,serif;font-size:16px;font-style:italic;color:#1A1A1A99;">
                  — Barny (and the FIT50 team)
                </p>
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
