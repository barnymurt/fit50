// Transactional email for cohort day-1 / day-25 / day-50 nudges.
//
// Three variants from one renderer (variant = 'day-1' | 'day-25' | 'day-50').
// Subject + opening sentence shift with the day; the body shape is
// otherwise identical so they share the wordmark + footer.
//
// Sent by /api/cron/cohort-milestones, which fires once per user
// per cohort day (coalesced via a per-day lock so a user never
// gets the same milestone email twice). The cron also flips
// cohort_memberships.status to 'completed' on day 50.

import {
  EMAIL_STYLES,
  ctaButton,
  emailShell,
  paragraph,
  signature,
  type EmailType,
} from './_shared';

export interface CohortMilestoneArgs {
  name: string | null;
  email: string;
  cohortName: string;
  cohortDayNumber: number;       // 1, 25, 50
  cohortSize: number;
  stillGoing: number;            // ≥ 1 habit in last 4 days
  trackerUrl: string;
  variant: 'day-1' | 'day-25' | 'day-50';
}

const VARIANT_COPY: Record<
  CohortMilestoneArgs['variant'],
  { subject: string; preheader: string; headline: string; opener: string }
> = {
  'day-1': {
    subject: 'Cohort day 1. You + {cohortSize} of you.',
    preheader: '{cohortName} starts today. Your day number is 1.',
    headline: 'Day 1 of 50.',
    opener:
      'You started the 50 days today, alongside {cohortSize} of you. The day number, the habit grid, the streak — they’re all yours. The collective \"X of Y hit 9/9 today\" sits next to them, but you don’t owe the cohort your perfect score. Just your nine.',
  },
  'day-25': {
    subject: 'Halfway. {cohortName}, day 25.',
    preheader: 'You’re at the inflection point. {stillGoing} of {cohortSize} are still going.',
    headline: 'Day 25 of 50.',
    opener:
      'You’re at the curve. The next 25 days are mostly about not stopping, not about adding more. {stillGoing} of {cohortSize} of your cohort hit at least one habit in the last four days — they’re the ones you’re walking with now.',
  },
  'day-50': {
    subject: 'Day 50. You finished.',
    preheader: 'You + {cohortSize} of you. The arc is complete.',
    headline: 'Fifty days, done.',
    opener:
      'You and {cohortSize} of you started the 50 days together. You finished. The certificate is in your account — the arc is yours to keep. If you want to start another 50 with a fresh cohort, the next one’s on the account page.',
  },
};

function formatLine(s: string, args: CohortMilestoneArgs): string {
  return s
    .replace('{cohortName}', args.cohortName)
    .replace('{cohortSize}', String(args.cohortSize))
    .replace('{stillGoing}', String(args.stillGoing));
}

export function renderCohortMilestoneEmail(
  args: CohortMilestoneArgs
): { subject: string; html: string; text: string } {
  const copy = VARIANT_COPY[args.variant];
  const subject = formatLine(copy.subject, args);
  const preheader = formatLine(copy.preheader, args);
  const name = args.name || args.email.split('@')[0];
  const headline = copy.headline;
  const opener = formatLine(copy.opener, args);

  const body = `
    <p style="margin:0 0 16px 0;font-family:${EMAIL_STYLES.displayFamily};font-size:24px;line-height:1.2;">
      Hi ${escape(name)},
    </p>
    ${paragraph(opener)}
    ${ctaButton(args.trackerUrl, 'Open my tracker')}
    ${signature()}
  `;

  const text = `Hi ${name},

${opener}

Open my tracker: ${args.trackerUrl}

— Barny (and the FIT50 team)`;

  return {
    subject,
    html: emailShell({ subject, preheader, bodyHtml: body }),
    text,
  };
}

// Lightweight helper — the email renderer pipeline imports
// `replyToFor` from _shared for transactional types, but cohort
// emails share the same reply-to as the welcome / motivator
// emails (general inbox). We don't actually use EmailType in
// the response today but the renderer pattern is set up for it
// in case we ever need per-variant reply-to.
export const COHORT_REPLY_TYPE: EmailType = 'general';

function escape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
