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

import type { Metadata } from 'next';
import Link from 'next/link';
import Heading from '@/components/Heading';
import Section from '@/components/Section';
import { createClient } from '@supabase/supabase-js';

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

function formatDateLong(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function daysUntil(iso: string): number {
  const target = new Date(iso + 'T00:00:00').getTime();
  const today = new Date(new Date().toDateString()).getTime();
  return Math.ceil((target - today) / 86_400_000);
}

async function loadSignupsOpen() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return [];
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
  return (data as Array<{
    id: string;
    name: string;
    start_date: string;
    signups_open_at: string;
  }> | null) ?? [];
}

export default async function CohortsLanding() {
  const cohorts = await loadSignupsOpen();

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
          <Heading size="display-2" className="text-ink leading-[1.05] mb-6">
            Start the 50 days with other people.
          </Heading>
          <p className="font-body text-lg text-ink/80 mb-10">
            {PAGE_DESCRIPTION}
          </p>

          <section className="mb-12">
            <Heading size="h3" className="text-ink leading-snug mb-4">
              What a cohort is
            </Heading>
            <div className="space-y-4 font-body text-base text-ink/80 leading-relaxed">
              <p>
                A cohort is a group of people who started the 50 days on
                the same day. You're not running it alone — every day the
                cohort section on your account page shows you the
                collective count. The day number, the 9-cell habit
                grid, the streak, the macro math — those are yours. The
                "X of Y hit 9/9 today" and the 50-day arc are the
                cohort's.
              </p>
              <p>
                Cohorts start on the 1st of each month. Sign-ups open
                30 days before that, so the window for the November cohort
                opens on October 1st and closes when the cohort kicks off
                on November 1st.
              </p>
              <p>
                Joining a cohort is free for everyone — free and
                premium. Joining resets your challenge day-number to the
                cohort's day 1; your past progress is archived, never
                deleted, so going back to a personal challenge later
                still has your history.
              </p>
            </div>
          </section>

          <section>
            <Heading size="h3" className="text-ink leading-snug mb-4">
              Open for sign-up
            </Heading>
            {cohorts.length === 0 ? (
              <p className="font-body text-ink/70">
                No cohorts open right now. Cohorts open for sign-up on
                the 1st of each month. Check back soon, or wait for the
                next round.
              </p>
            ) : (
              <ul className="space-y-3">
                {cohorts.map((c) => {
                  const inDays = daysUntil(c.start_date);
                  return (
                    <li key={c.id}>
                      <Link
                        href={`/cohorts/${c.id}`}
                        className="block border border-ink/15 bg-cre-30 p-4 hover:border-coral transition-colors"
                      >
                        <div className="flex items-baseline justify-between gap-2 mb-1">
                          <span className="font-display text-h3 text-ink">
                            {c.name}
                          </span>
                          <span className="font-body text-caption uppercase tracking-widest text-coral">
                            Open cohort →
                          </span>
                        </div>
                        <p className="font-body text-caption text-ink/60">
                          Starts {formatDateLong(c.start_date)}
                          {inDays > 0
                            ? ` · ${inDays} day${inDays === 1 ? '' : 's'} away`
                            : ' · today'}
                        </p>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="mt-12 pt-8 border-t border-ink/15">
            <p className="font-body text-caption uppercase tracking-widest text-ink/40 mb-3">
              Not ready for a cohort?
            </p>
            <p className="font-body text-base text-ink/70">
              You can also{' '}
              <Link
                href="/"
                className="text-coral underline underline-offset-4 decoration-coral/40 hover:decoration-coral"
              >
                start solo any day
              </Link>{' '}
              and use the tracker without a cohort — the challenge is
              yours whether you go it alone or with 80 other starters.
            </p>
          </section>
        </div>
      </Section>
    </main>
  );
}