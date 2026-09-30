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
        Sign in and explore the tracker. When you&apos;re ready to start tap the first habit on the tracker. Start whenever you&apos;re ready — the streak only counts from day one.
      </li>
      <li style="margin-bottom:8px;">
        When you start the challenge with a buddy, you&apos;re more likely to finish together. Pick your buddy.
      </li>
      <li>
        Premium is €5.99 once, yours forever: streak protection (1 every 25 days, so a missed day doesn&apos;t kill the run), the macro food database, weight projection that learns from your weigh-ins, and a meal bundle tool to make daily food logs quick and easy.
      </li>
    </ol>
    ${ctaButton(signInUrl, 'Open my tracker')}
    ${signature()}
  `;

  const text = `Hi ${name},

Welcome to FIT50. Fifty days. Nine daily disciplines. One thing you'll finish. The hardest part isn't the habits — it's showing up on day 14 when nobody's watching.

Three things to do in the next five minutes:

1. Sign in and explore the tracker. When you're ready to start tap the first habit on the tracker. Start whenever you're ready — the streak only counts from day one.
2. When you start the challenge with a buddy, you're more likely to finish together. Pick your buddy.
3. Premium is €5.99 once, yours forever: streak protection (1 every 25 days, so a missed day doesn't kill the run), the macro food database, weight projection that learns from your weigh-ins, and a meal bundle tool to make daily food logs quick and easy.

Open my tracker: ${signInUrl}

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
  const subject = `${purchaserName} just shouted you a beer — and you're in.`;
  const preheader =
    `${purchaserName} has finished setting up your FIT50 seat — day one starts when you tap the first habit.`;

  const body = `
    <p style="margin:0 0 16px 0;font-family:${EMAIL_STYLES.displayFamily};font-size:24px;line-height:1.2;">
      Hi ${escapeHtml(name)},
    </p>
    ${paragraph(
      `${escapeHtml(purchaserName)} has finished setting up your FIT50 seat — you&apos;re in!  They chose you as their buddy, Welcome! We thank them for the caneca — pass on the vibe to another mate.`
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
        You&apos;ve got 1 streak protection every 25 days if you slip. Use it on a day you can&apos;t log.
      </li>
      <li>
        On those days when your motivation is flagging, lean on your buddy — together you can push through, they&apos;ll return the favour down the line.
      </li>
    </ol>
    ${ctaButton(accountUrl, 'Open my tracker')}
    ${signature()}
  `;

  const text = `Hi ${name},

${purchaserName} has finished setting up your FIT50 seat — you're in!  They chose you as their buddy, Welcome! We thank them for the caneca — pass on the vibe to another mate.

You don't have to start the 50 days today. Activate is done, but day one starts when you tap the first habit on the tracker. Start whenever you're ready.

Three things to know:

1. You can see each other's streaks. That's the whole point of doing this together — one more reason to show up.
2. You've got 1 streak protection every 25 days if you slip. Use it on a day you can't log.
3. On those days when your motivation is flagging, lean on your buddy — together you can push through, they'll return the favour down the line.

Open your tracker: ${accountUrl}

${emailSignature}`;

  return {
    subject,
    html: emailShell({ subject, preheader, bodyHtml: body }),
    text,
    replyTo: replyToFor('welcome' as EmailType),
  };
}