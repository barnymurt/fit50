// /cohorts — public landing page listing the next several
// monthly cohorts with sign-ups currently open. No sign-in
// required: the cohorts table allows anonymous SELECT after
// migration 0047. cohort_memberships is unchanged — it stays
// gated to own-cohort-mate reads, so this page never surfaces
// per-user data.
//
// Server component: fetches cohort rows via @supabase/supabase-js
// directly with the anon key (RLS allows anon SELECT). No need
// for a hook or client-side fetch.
//
// This pass is a layout refactor — the previous version was a
// wall of text. Now it's: a hero line, a single dominant
// next-cohort card with a "starts in N days" countdown and a
// "you finish on [date] — [event]" line, then a quiet list of
// the next few cohorts with the same finish event so the user
// can pick a month by what it ends on.

import type { Metadata } from 'next';
import Link from 'next/link';
import Heading from '@/components/Heading';
import Section from '@/components/Section';
import { createClient } from '@supabase/supabase-js';
import {
  cohortFinish,
  finishLineSentence,
  daysUntilStart,
  type CohortRegion,
} from '@/lib/cohort-events';

const PAGE_TITLE = 'Start the 50 days with other people — FIT50 cohorts';
const PAGE_DESCRIPTION =
  'Monthly cohorts for the FIT50 50-day challenge. Pick a month, start the 50 days alongside a group of other starters, and see the collective "X of Y hit 9/9 today" day by day. Free, no sign-up fee.';

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    type: 'website',
    url: 'https://fit50challenge.io/cohorts',
    siteName: 'FIT50',
  },
  twitter: {
    card: 'summary_large_image',
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
  },
};

interface SignupOpenCohort {
  id: string;
  name: string;
  start_date: string;
  signups_open_at: string;
}

async function loadSignupsOpen() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return [] as SignupOpenCohort[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb: any = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await sb
    .from('cohorts')
    .select('id, name, start_date, signups_open_at')
    .lte('signups_open_at', today)
    .gte('start_date', today)
    .order('start_date', { ascending: true })
    .limit(6);
  return (data as SignupOpenCohort[] | null) ?? [];
}

function formatCohortDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });
}

function nextCohortFinishLabel(c: SignupOpenCohort, region: CohortRegion): string {
  const f = cohortFinish(c.start_date, region);
  if (!f.eventName) {
    return `You'll finish on ${new Date(f.finishDate + 'T00:00:00').toLocaleDateString(undefined, { day: 'numeric', month: 'long' })}.`;
  }
  return `You'll finish on ${new Date(f.finishDate + 'T00:00:00').toLocaleDateString(undefined, { day: 'numeric', month: 'long' })} — ${f.eventName}.`;
}

export default async function CohortsLanding() {
  const cohorts = await loadSignupsOpen();
  // Default to non-US for the landing copy; the per-cohort page
  // resolves the region from profile.country on sign-in.
  const region: CohortRegion = 'row';

  // The most-urgent cohort gets the dominant card. The rest get a
  // quiet list so the page is one primary CTA + a list, not a
  // wall of buttons.
  const next = cohorts[0];
  const rest = cohorts.slice(1);

  const startIn = next ? daysUntilStart(next.start_date) : null;
  const signupsOpen = next
    ? new Date() >=
      new Date(next.signups_open_at + 'T00:00:00')
    : false;

  return (
    <main className="bg-paper text-ink">
      <Section
        className="relative pt-12 md:pt-24 pb-section"
        tone="paper"
        contained
      >
        <div className="max-w-3xl mx-auto">
          <p className="font-body text-caption uppercase tracking-widest text-coral mb-4">
            Cohorts
          </p>
          <Heading
            size="display-2"
            className="text-ink leading-[1.05] mb-6"
          >
            Start the 50 days with a group.
          </Heading>
          <p className="font-body text-lg text-ink/80 mb-12 max-w-xl">
            A cohort is a group of people who start the 50 days on the
            same day. Your day number, the habit grid, the streak — all
            yours. The "X of Y hit 9/9 today" and the 50-day arc are
            the cohort's.
          </p>

          {!next ? (
            <div className="border border-ink/15 bg-cre-30 p-6">
              <p className="font-body text-ink/70">
                No cohorts open right now. Cohorts open for sign-up on
                the 1st of each month. Check back soon, or{' '}
                <Link
                  href="/"
                  className="text-coral underline underline-offset-4 decoration-coral/40 hover:decoration-coral"
                >
                  start solo any day
                </Link>
                .
              </p>
            </div>
          ) : (
            <div className="border border-ink/20 bg-paper">
              <div className="px-6 md:px-10 py-8 border-b border-ink/10 bg-cre-30">
                <div className="flex items-baseline justify-between gap-2 flex-wrap">
                  <p className="font-body text-caption uppercase tracking-widest text-coral">
                    Next cohort
                  </p>
                  <p className="font-body text-caption uppercase tracking-widest text-ink/40 tabular-nums">
                    {next.name}
                  </p>
                </div>
                <p className="font-display text-display-2 text-ink leading-[0.95] mt-3 mb-3">
                  Starts {formatCohortDate(next.start_date)}.
                </p>
                {startIn !== null && (
                  <p className="font-body text-base text-ink/70">
                    {startIn === 0
                      ? 'Starts today.'
                      : `Sign-ups are open · starts in ${startIn} day${
                          startIn === 1 ? '' : 's'
                        }.`}
                  </p>
                )}
                {signupsOpen && startIn !== null && startIn > 0 && (
                  <p className="font-body text-base text-ink/60 mt-4">
                    {nextCohortFinishLabel(next, region)}
                  </p>
                )}
              </div>
              <div className="px-6 md:px-10 py-6 flex flex-col sm:flex-row sm:items-center gap-3">
                <Link
                  href={`/cohorts/${next.id}`}
                  className="inline-flex items-center justify-center bg-coral hover:bg-coral-deep text-paper px-6 py-3 font-body text-caption uppercase tracking-widest transition-colors"
                >
                  See this cohort →
                </Link>
                <Link
                  href="/"
                  className="inline-flex items-center justify-center border border-ink px-6 py-3 font-body text-caption uppercase tracking-widest text-ink hover:bg-ink hover:text-paper transition-colors"
                >
                  Or start solo
                </Link>
              </div>
            </div>
          )}

          {rest.length > 0 && (
            <section className="mt-16">
              <p className="font-body text-caption uppercase tracking-widest text-ink/40 mb-4">
                After that
              </p>
              <ul className="space-y-2">
                {rest.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/cohorts/${c.id}`}
                      className="flex items-baseline gap-4 px-4 py-3 border border-ink/15 hover:border-coral transition-colors"
                    >
                      <span className="font-body text-base text-ink tabular-nums shrink-0 w-24">
                        {formatCohortDate(c.start_date)}
                      </span>
                      <span className="font-body text-sm text-ink/60">
                        {nextCohortFinishLabel(c, region)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="mt-16 pt-8 border-t border-ink/15">
            <p className="font-body text-caption uppercase tracking-widest text-ink/40 mb-3">
              How it works
            </p>
            <p className="font-body text-base text-ink/70">
              Cohorts start on the 1st of every month. You can join
              solo, or with a buddy, or just see the collective
              count of the cohort from your account page. Membership
              is free for everyone — free and premium alike.
            </p>
          </section>
        </div>
      </Section>
    </main>
  );
}