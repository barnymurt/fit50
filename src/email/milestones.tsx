// Milestone emails — sent at the named day of a user's challenge.
// Every email below is one of: day 1, 7, 25, 40, 49, 50. The tone
// follows BRAND_VOICE.md: brief, honest, useful, never overselling.
//
// Triggers (handled by the dispatcher, not this file):
//   - day 1:  user just tapped their first habit (or the rollover
//             fired on day 1 with at least one tap). Light, "you've
//             started" framing.
//   - day 7:  day 7 complete (all 9 habits tapped).
//   - day 25: halfway marker.
//   - day 40: ten days to go.
//   - day 49: penultimate day — "tomorrow is yours".
//   - day 50: completion + the share-your-passion-project prompt.

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
  trackerUrl: string;
  certificateUrl?: string; // only day 50
  unsubscribeUrl: string;
}

function nameOrLocal(args: Args): string {
  return args.displayName || args.email.split('@')[0];
}

// ---------------------------------------------------------------------------
// Day 1 — "You've started."
// ---------------------------------------------------------------------------

export function renderDayOneStartedEmail(args: Args): {
  subject: string;
  html: string;
  text: string;
  replyTo: string;
} {
  const name = nameOrLocal(args);
  const subject = "You've started.";
  const preheader = "Day one is on the board. Don't miss day two.";

  const body = `
    <p style="margin:0 0 16px 0;font-family:${EMAIL_STYLES.displayFamily};font-size:24px;line-height:1.2;">
      Hi ${escapeHtml(name)},
    </p>
    ${paragraph(
      `Day one is on the board. That's the hardest one — you'll never have to start again, only continue.`
    )}
    ${paragraph(
      `Tomorrow is the same shape. Tap one habit. The streak continues.`
    )}
    ${ctaButton(args.trackerUrl, 'Open my tracker')}
    ${signature()}
  `;

  const text = `Hi ${name},

Day one is on the board. That's the hardest one — you'll never have to start again, only continue.

Tomorrow is the same shape. Tap one habit. The streak continues.

Open my tracker: ${args.trackerUrl}

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
    replyTo: replyToFor('outreach' as EmailType),
  };
}

// ---------------------------------------------------------------------------
// Day 7 — "First week."
// ---------------------------------------------------------------------------

export function renderDaySevenEmail(args: Args): {
  subject: string;
  html: string;
  text: string;
  replyTo: string;
} {
  const name = nameOrLocal(args);
  const subject = 'First week.';
  const preheader =
    "Seven for seven. Most people who finish this hit a wall at day 14. Knowing it's coming is half the battle.";

  const body = `
    <p style="margin:0 0 16px 0;font-family:${EMAIL_STYLES.displayFamily};font-size:24px;line-height:1.2;">
      Hi ${escapeHtml(name)},
    </p>
    ${paragraph(
      `Seven days. Seven for seven. You're a tenth of the way through.`
    )}
    ${paragraph(
      `The honest part: most people who do this don't drop at day one. They drop at day fourteen. By then the novelty is gone, the calendar doesn't have a fresh-feeling week one, and the first sign of friction feels like a sign to quit.`
    )}
    ${paragraph(
      `So the next seven days aren't really about hitting day 14. They're about making day 14 a Tuesday instead of a decision.`
    )}
    ${ctaButton(args.trackerUrl, 'Open my tracker')}
    ${signature()}
  `;

  const text = `Hi ${name},

Seven days. Seven for seven. You're a tenth of the way through.

The honest part: most people who do this don't drop at day one. They drop at day fourteen. By then the novelty is gone, the calendar doesn't have a fresh-feeling week one, and the first sign of friction feels like a sign to quit.

So the next seven days aren't really about hitting day 14. They're about making day 14 a Tuesday instead of a decision.

Open my tracker: ${args.trackerUrl}

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
    replyTo: replyToFor('outreach' as EmailType),
  };
}

// ---------------------------------------------------------------------------
// Day 25 — "Halfway."
// ---------------------------------------------------------------------------

export function renderDayTwentyFiveEmail(args: Args): {
  subject: string;
  html: string;
  text: string;
  replyTo: string;
} {
  const name = nameOrLocal(args);
  const subject = 'Halfway.';
  const preheader =
    "You're not in the back half. You're exactly where the curve has its inflection.";

  const body = `
    <p style="margin:0 0 16px 0;font-family:${EMAIL_STYLES.displayFamily};font-size:24px;line-height:1.2;">
      Hi ${escapeHtml(name)},
    </p>
    ${paragraph(
      `Twenty-five days. Halfway. The streak you've built is real now — anyone who watched you for the last month would believe you're someone who finishes things.`
    )}
    ${paragraph(
      `The thing about halfway: it's not the back half. It's the inflection point. The next twenty-five days will be easier in some ways and harder in others. The habits are wired in. What's left is the thing you're actually doing this for.`
    )}
    ${paragraph(`If you can put a name on what that thing is, write it down somewhere you'll see it. We'll ask about it on day fifty.`)}
    ${ctaButton(args.trackerUrl, 'Open my tracker')}
    ${signature()}
  `;

  const text = `Hi ${name},

Twenty-five days. Halfway. The streak you've built is real now — anyone who watched you for the last month would believe you're someone who finishes things.

The thing about halfway: it's not the back half. It's the inflection point. The next twenty-five days will be easier in some ways and harder in others. The habits are wired in. What's left is the thing you're actually doing this for.

If you can put a name on what that thing is, write it down somewhere you'll see it. We'll ask about it on day fifty.

Open my tracker: ${args.trackerUrl}

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
    replyTo: replyToFor('outreach' as EmailType),
  };
}

// ---------------------------------------------------------------------------
// Day 40 — "Final stretch."
// ---------------------------------------------------------------------------

export function renderDayFortyEmail(args: Args): {
  subject: string;
  html: string;
  text: string;
  replyTo: string;
} {
  const name = nameOrLocal(args);
  const subject = 'Final stretch.';
  const preheader =
    "Ten days left. The thing you said you'd do is still doable.";

  const body = `
    <p style="margin:0 0 16px 0;font-family:${EMAIL_STYLES.displayFamily};font-size:24px;line-height:1.2;">
      Hi ${escapeHtml(name)},
    </p>
    ${paragraph(
      `Forty days. Ten to go. You're in the final stretch — and the hard part isn't the last ten days, it's not letting the finish line become a permission slip to coast.`
    )}
    ${paragraph(
      `Don't coast. The next ten days are the part you'll remember. Small habits, done deliberately, every day. That's what makes the certificate mean something.`
    )}
    ${ctaButton(args.trackerUrl, 'Open my tracker')}
    ${signature()}
  `;

  const text = `Hi ${name},

Forty days. Ten to go. You're in the final stretch — and the hard part isn't the last ten days, it's not letting the finish line become a permission slip to coast.

Don't coast. The next ten days are the part you'll remember. Small habits, done deliberately, every day. That's what makes the certificate mean something.

Open my tracker: ${args.trackerUrl}

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
    replyTo: replyToFor('outreach' as EmailType),
  };
}

// ---------------------------------------------------------------------------
// Day 49 — "Last day."
// ---------------------------------------------------------------------------

export function renderDayFortyNineEmail(args: Args): {
  subject: string;
  html: string;
  text: string;
  replyTo: string;
} {
  const name = nameOrLocal(args);
  const subject = 'Last day.';
  const preheader =
    "Tomorrow is yours. Make it small and make it count.";

  const body = `
    <p style="margin:0 0 16px 0;font-family:${EMAIL_STYLES.displayFamily};font-size:24px;line-height:1.2;">
      Hi ${escapeHtml(name)},
    </p>
    ${paragraph(
      `Day forty-nine. One day left. Tomorrow is your day fifty, and if you read this in the morning, here's the only thing you need to know:`
    )}
    ${paragraph(
      `Don't make it special. Make it ordinary. The same nine habits you did yesterday. The same walk, the same water, the same ten minutes with a book. The point of day fifty isn't that it's a celebration. It's that you did the same thing on day fifty that you did on day one.`
    )}
    ${paragraph(`We'll send the proper one tomorrow.`)}
    ${ctaButton(args.trackerUrl, 'Open my tracker')}
    ${signature()}
  `;

  const text = `Hi ${name},

Day forty-nine. One day left. Tomorrow is your day fifty, and if you read this in the morning, here's the only thing you need to know:

Don't make it special. Make it ordinary. The same nine habits you did yesterday. The same walk, the same water, the same ten minutes with a book. The point of day fifty isn't that it's a celebration. It's that you did the same thing on day fifty that you did on day one.

We'll send the proper one tomorrow.

Open my tracker: ${args.trackerUrl}

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
    replyTo: replyToFor('outreach' as EmailType),
  };
}

// ---------------------------------------------------------------------------
// Day 50 — "Done. Celebrate." + share your passion project
// ---------------------------------------------------------------------------

export function renderDayFiftyEmail(args: Args): {
  subject: string;
  html: string;
  text: string;
  replyTo: string;
} {
  const name = nameOrLocal(args);
  const subject = 'Day 50. You finished.';
  const preheader =
    'You did the thing. Tell us what it was — and claim your certificate.';

  const certificateUrl =
    args.certificateUrl ?? args.trackerUrl;

  const body = `
    <p style="margin:0 0 16px 0;font-family:${EMAIL_STYLES.displayFamily};font-size:24px;line-height:1.2;">
      Hi ${escapeHtml(name)},
    </p>
    ${paragraph(
      `You did it. Fifty days. Nine habits every single day. The certificate is below if you want the proof, but you already have the proof — every habit you tapped was the proof.`
    )}
    ${paragraph(
      `When you signed up, you said you wanted to do something specific. Read more. Stop drinking. Move your body. Write. Whatever it was — did it work?`
    )}
    ${paragraph(`We'd love to hear what you're walking away with. Not the metrics — the thing. Reply to this email and tell us in one paragraph what changed. We'll read every one.`)}
    ${paragraph(
      `And if you're comfortable, we'll be sharing some of these stories over the coming weeks. Just say the word and we won't use yours.`
    )}
    ${ctaButton(certificateUrl, 'View my certificate')}
    ${mutedParagraph(
      `You're a finisher. That's rarer than it should be. Thank you for letting us be part of it.`
    )}
    ${signature()}
  `;

  const text = `Hi ${name},

You did it. Fifty days. Nine habits every single day. The certificate is below if you want the proof, but you already have the proof — every habit you tapped was the proof.

When you signed up, you said you wanted to do something specific. Read more. Stop drinking. Move your body. Write. Whatever it was — did it work?

We'd love to hear what you're walking away with. Not the metrics — the thing. Reply to this email and tell us in one paragraph what changed. We'll read every one.

And if you're comfortable, we'll be sharing some of these stories over the coming weeks. Just say the word and we won't use yours.

View my certificate: ${certificateUrl}

You're a finisher. That's rarer than it should be. Thank you for letting us be part of it.

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
    replyTo: replyToFor('outreach' as EmailType),
  };
}