// /cohorts/[id] — shareable per-cohort landing page. The URL is
// what gets pasted into Twitter / WhatsApp / etc. so it has to:
//   1. Render without sign-in (anyone can preview the cohort).
//   2. Render good OG / Twitter meta so the social card preview
//      shows the cohort name + start date, not the home page.
//   3. Have a clear Join CTA that works for both signed-in and
//      signed-out users.
//
// Server component: reads the cohort row via @supabase/supabase-js
// with the anon key (RLS allows anon SELECT after migration 0047).
//
// This pass is a layout refactor — the previous version was
// four sections of body copy. Now: a hero line, a dominant
// "you finish on [date] — [event]" card (the social-share payoff),
// the start countdown, and a "what you do on day 1" callout. The
// rest of the cohort info is a quieter "how it works" tail.

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Heading from '@/components/Heading';
import Section from '@/components/Section';
import { createClient } from '@supabase/supabase-js';
import {
  cohortFinish,
  daysUntilStart,
  finishLineSentence,
  type CohortRegion,
} from '@/lib/cohort-events';

const SITE_URL = 'https://fit50challenge.io';

const titleFor = (name: string) => `${name} — the next monthly FIT50 cohort`;

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  let cohortName = 'Join the next FIT50 cohort';
  let finishDate = '';
  let eventName = '';
  if (url && key) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb: any = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data } = await sb
      .from('cohorts')
      .select('name, start_date')
      .eq('id', params.id)
      .maybeSingle();
    if (data) {
      cohortName = titleFor((data as { name: string }).name);
      const f = cohortFinish(
        (data as { start_date: string }).start_date,
        'row'
      );
      finishDate = f.finishDate;
      eventName = f.eventName;
    }
  }
  const desc =
    finishDate && eventName
      ? `Starts soon, finishes on ${finishDate} (${eventName}). Pick a cohort, start the 50 days alongside a group of other starters. Free.`
      : 'Monthly cohorts for the FIT50 50-day challenge. Pick a month, start the 50 days alongside a group of other starters. Free, no sign-up fee.';
  return {
    title: cohortName,
    description: desc,
    openGraph: {
      title: cohortName,
      description: desc,
      type: 'website',
      url: `${SITE_URL}/cohorts/${params.id}`,
      siteName: 'FIT50',
    },
    twitter: {
      card: 'summary_large_image',
      title: cohortName,
      description: desc,
    },
  };
}

interface CohortRow {
  id: string;
  name: string;
  start_date: string;
  signups_open_at: string;
  cap: number;
}

async function loadCohort(id: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb: any = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data } = await sb
    .from('cohorts')
    .select('id, name, start_date, signups_open_at, cap')
    .eq('id', id)
    .maybeSingle();
  return (data as CohortRow | null);
}

function formatStartLong(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default async function PublicCohortDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const cohort = await loadCohort(params.id);

  if (!cohort) {
    notFound();
  }

  const cohortObj = cohort!;
  const region: CohortRegion = 'row';
  const startIn = daysUntilStart(cohortObj.start_date);
  const signupsOpen =
    new Date() >= new Date(cohortObj.signups_open_at + 'T00:00:00');
  const cohortLive =
    new Date() >= new Date(cohortObj.start_date + 'T00:00:00');
  const finish = cohortFinish(cohortObj.start_date, region);
  const finishSentence = finishLineSentence(
    cohortObj.start_date,
    region
  );
  const shareUrl = `${SITE_URL}/cohorts/${params.id}`;
  const ogImage = `${SITE_URL}/icons/icon.png`;

  return (
    <main className="bg-paper text-ink">
      <Section
        className="relative pt-12 md:pt-24 pb-section"
        tone="paper"
        contained
      >
        <div className="max-w-3xl mx-auto">
          <p className="font-body text-caption uppercase tracking-widest text-coral mb-4">
            {cohortLive
              ? 'Active cohort'
              : startIn > 0
              ? `Starts in ${startIn} day${startIn === 1 ? '' : 's'}`
              : 'Starts today'}
          </p>
          <Heading
            size="display-2"
            className="text-ink leading-[1.05] mb-4"
          >
            {cohortObj.name}
          </Heading>
          <p className="font-body text-xl text-ink/80 mb-8">
            Starts {formatStartLong(cohortObj.start_date)}.
          </p>

          {/* The social-share payoff — this is what the candidate
              wants the user to be carrying around in their head. */}
          <div className="border border-coral bg-coral/[0.05] p-6 mb-8">
            <p className="font-body text-caption uppercase tracking-widest text-coral mb-2">
              The finish line
            </p>
            <p className="font-display text-h2 text-ink leading-[1.05]">
              {finishSentence}
            </p>
          </div>

          <div className="border border-ink/15 bg-cre-30 p-5 mb-8">
            <p className="font-body text-caption uppercase tracking-widest text-ink/40 mb-2">
              What you do on day 1
            </p>
            <p className="font-body text-base text-ink/80">
              Open the tracker on {formatStartLong(cohortObj.start_date)}.
              Tick the first habit. That's it. Day 1 begins. The
              cohort section on your account page starts showing
              the collective count the same day.
            </p>
          </div>

          {signupsOpen && !cohortLive && (
            <div className="mb-8">
              {startIn > 0 && (
                <p className="font-body text-sm text-ink/60 mb-3">
                  Sign-ups close the day before the cohort starts. You
                  can leave the cohort any time after that.
                </p>
              )}
              <div className="flex flex-col sm:flex-row gap-3">
                <form
                  action="/api/cohort/join"
                  method="post"
                  className="inline-block"
                >
                  <input
                    type="hidden"
                    name="cohort_id"
                    value={cohortObj.id}
                  />
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center bg-coral hover:bg-coral-deep text-paper px-8 py-4 font-body text-caption uppercase tracking-widest transition-colors"
                  >
                    Join this cohort →
                  </button>
                </form>
                <Link
                  href="/cohorts"
                  className="inline-flex items-center justify-center border border-ink px-8 py-4 font-body text-caption uppercase tracking-widest text-ink hover:bg-ink hover:text-paper transition-colors"
                >
                  See other cohorts
                </Link>
              </div>
            </div>
          )}

          {cohortLive && (
            <p className="font-body text-sm text-ink/50 mb-8">
              This cohort is already running. Head to your tracker to
              keep going.
            </p>
          )}

          <section className="mb-10">
            <p className="font-body text-caption uppercase tracking-widest text-ink/40 mb-3">
              How it works
            </p>
            <ul className="space-y-3 font-body text-base text-ink/80 list-disc pl-5">
              <li>
                The cohort is a group of people who started on the
                same day. You see a collective "X of Y hit 9/9 today"
                and a 50-day arc — the rest of the toolkit (food log,
                workouts, books, water, macro calculator) is yours
                either way.
              </li>
              <li>
                Cohort membership is <strong>free</strong> for everyone,
                free and premium alike.
              </li>
              <li>
                Your progress stays yours. The cohort can see your
                anonymous handle — never your display name unless you
                opt in. The cohort never sees your email or macro math.
              </li>
            </ul>
          </section>

          <section className="border-t border-ink/15 pt-8">
            <p className="font-body text-caption uppercase tracking-widest text-ink/40 mb-3">
              Share this cohort
            </p>
            <p className="font-body text-base text-ink/70 mb-4">
              If you know people who'd do this, share the link — the
              cohort works best with a group, and the more starters,
              the more motivating the daily collective count becomes.
            </p>
            <p className="font-body text-caption text-ink/50 break-all bg-cre-30 p-3 font-mono">
              {shareUrl}
            </p>
          </section>
        </div>
      </Section>
    </main>
  );
}