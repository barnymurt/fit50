// Day-before-start motivation email.
//
// Sent by /api/cron/challenge-day-before-reminder the morning of
// the day before the user's challenge start date. Three variants:
//   - 'solo'   — the user started a personal challenge
//   - 'cohort' — the user joined a cohort
//   - 'buddy'  — the user activated a buddy-pair seat
//
// Each variant has its own opener and a small reminder of what
// to do on day 1. The subject line shifts with the variant. The
// rest of the email is shared so the brand-voice feel stays
// consistent across the three flavours.

import {
  EMAIL_STYLES,
  ctaButton,
  emailShell,
  paragraph,
  signature,
} from './_shared';

export type DayBeforeSource = 'solo' | 'cohort' | 'buddy';

export interface DayBeforeReminderArgs {
  name: string | null;
  email: string;
  startDate: string;   // YYYY-MM-DD
  startDateLong: string; // "Monday, 1 December 2025"
  variant: DayBeforeSource;
  trackerUrl: string;
  // Variant-specific context the user will recognise.
  // - solo:   omitted (no one else)
  // - cohort: the cohort name
  // - buddy:  the buddy's first name
  contextName?: string;
}

const VARIANT_COPY: Record<
  DayBeforeSource,
  { subject: string; preheader: string; opener: string }
> = {
  solo: {
    subject: 'Tomorrow. Day 1 of 50.',
    preheader: 'One habit tomorrow, two habits the day after. Easy does it.',
    opener:
      "Tomorrow's the day. The first habit is the hardest, and you'll already know which one it is. Tick it, close the tracker, and you've started. The next 49 days are mostly about not stopping — and you've proven you don't.",
  },
  cohort: {
    subject: 'Cohort day 1 tomorrow.',
    preheader: 'You + everyone else in {cohortName} start the same day.',
    opener:
      'Tomorrow morning the cohort starts. Open the tracker first thing, tick the first habit, and you\'re moving with the rest of them from hour one. The collective count of "X of Y hit 9/9 today" shows up in your cohort section the same day — your nine ticks are yours alone, the line at the top is everyone\'s.',
  },
  buddy: {
    subject: 'You and {buddy} start tomorrow.',
    preheader: 'Same day, same nine habits, no need to schedule anything.',
    opener:
      "Tomorrow's the day you and {buddy} start. Tick the first habit in the morning — that's all. The day-one list of nine is the same list for both of you, so the easiest way to start is to each pick your favourite and just go.",
  },
};

const SUBJECTS = {
  solo: 'Tomorrow. Day 1 of 50.',
  cohort: 'Cohort day 1 tomorrow.',
  buddy: 'You and {buddy} start tomorrow.',
} as const;

const PREHEADERS = {
  solo: "One habit tomorrow, two habits the day after. Easy does it.",
  cohort: "You + everyone else in {cohortName} start the same day.",
  buddy: "Same day, same nine habits, no need to schedule anything.",
} as const;

function formatLine(s: string, args: DayBeforeReminderArgs): string {
  let out = s;
  if (args.contextName) {
    out = out.replace('{cohortName}', args.contextName);
    out = out.replace('{buddy}', args.contextName);
  }
  return out;
}

export function renderDayBeforeReminderEmail(
  args: DayBeforeReminderArgs
): { subject: string; html: string; text: string } {
  const name = args.name || args.email.split('@')[0];
  const opener = formatLine(VARIANT_COPY[args.variant].opener, args);
  const subject = formatLine(SUBJECTS[args.variant], args);
  const preheader = formatLine(PREHEADERS[args.variant], args);

  const body = `
    <p style="margin:0 0 16px 0;font-family:${EMAIL_STYLES.displayFamily};font-size:24px;line-height:1.2;">
      Hi ${escape(name)},
    </p>
    <p style="margin:0 0 16px 0;font-family:${EMAIL_STYLES.displayFamily};font-size:18px;line-height:1.3;color:${EMAIL_STYLES.ink};">
      ${args.startDateLong} — that's day 1.
    </p>
    ${paragraph(opener)}
    ${ctaButton(args.trackerUrl, 'Open my tracker')}
    ${signature()}
  `;

  const text = `Hi ${name},

${args.startDateLong} — that's day 1.

${opener}

Open my tracker: ${args.trackerUrl}

— Barny (and the FIT50 team)`;

  return {
    subject,
    html: emailShell({ subject, preheader, bodyHtml: body }),
    text,
  };
}

function escape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
