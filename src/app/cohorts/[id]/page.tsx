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
// For the Join CTA, signed-in users get a form that POSTs to
// /api/cohort/join. Signed-out users get a link to the sign-up
// page; they're returned to this cohort URL after signup.

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Heading from '@/components/Heading';
import Section from '@/components/Section';
import { createClient } from '@supabase/supabase-js';

const SITE_URL = 'https://fit50challenge.io';

const titleFor = (name: string) => `${name} — the next monthly FIT50 cohort`;
const descriptionFor = (name: string, startDateLong: string) =>
  `${name} — the next monthly cohort for the FIT50 50-day challenge. Starts ${startDateLong}. Pick a cohort, start the 50 days alongside a group of other starters. Free for everyone; join via the link.`;

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  let cohortName = 'Join the next FIT50 cohort';
  let startDateLong = '';
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
      const [y, m, d] = (data as { start_date: string })
        .start_date.split('-')
        .map(Number);
      if (y && m && d) {
        startDateLong = new Date(y, m - 1, d).toLocaleDateString(
          undefined,
          { day: 'numeric', month: 'long', year: 'numeric' }
        );
      }
    }
  }
  const desc = startDateLong
    ? descriptionFor(cohortName.replace(' — the next monthly FIT50 cohort', ''), startDateLong)
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
  return (data as {
    id: string;
    name: string;
    start_date: string;
    signups_open_at: string;
    cap: number;
  } | null);
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

  const cohortObj = cohort!; // notFound() throws but TS doesn't know
  const signupsOpen =
    new Date() >= new Date(cohortObj.signups_open_at + 'T00:00:00');
  const cohortLive =
    new Date() >= new Date(cohortObj.start_date + 'T00:00:00');
  const daysToStart = daysUntil(cohortObj.start_date);
  const shareUrl = `${SITE_URL}/cohorts/${params.id}`;

  return (
    <main className="bg-paper text-ink">
      <Section
        className="relative pt-12 md:pt-24 pb-section"
        tone="paper"
        contained
      >
        <div className="max-w-3xl mx-auto">
          <p className="font-body text-caption uppercase tracking-widest text-coral mb-4">
            Cohort · {cohortLive
              ? 'Active'
              : daysToStart > 0
              ? `Starts in ${daysToStart} day${daysToStart === 1 ? '' : 's'}`
              : 'Starts today'}
          </p>
          <Heading size="display-2" className="text-ink leading-[1.05] mb-6">
            {cohortObj.name}
          </Heading>
          <p className="font-body text-lg text-ink/80 mb-8">
            Starts <strong>{formatDateLong(cohortObj.start_date)}</strong>.
            Your day number, the habit grid, the streak — they're
            all yours. The "X of Y hit 9/9 today" and the 50-day arc
            are the cohort's.
          </p>

          <section className="mb-10 border border-ink/15 bg-cre-30 p-5">
            <Heading size="h3" className="text-ink leading-snug mb-3">
              What you do on day 1
            </Heading>
            <p className="font-body text-base text-ink/80 mb-3">
              Open the tracker on {formatDateLong(cohortObj.start_date)}.
              Tick the first habit. That's it. Day 1 begins.
            </p>
            <p className="font-body text-base text-ink/80">
              Each of the 50 days has nine habits — chill out, fuel
              right, clear, fresh lungs, mind, body, water, steps,
              brain. You don't need to do all nine every day, but the
              cohort section adds up who's doing what.
            </p>
          </section>

          <section className="mb-10">
            <Heading size="h3" className="text-ink leading-snug mb-3">
              How it works
            </Heading>
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
                free and premium alike. Joining a cohort resets your
                challenge day-number to day 1; your old progress is
                archived (never deleted) and returns if you go back to
                a personal challenge later.
              </li>
              <li>
                Your progress stays yours. The cohort can see your
                anonymous handle (a randomised "Crane-7A2" style
                identifier) — never your display name unless you
                explicitly opt in. The cohort never sees your email or
                your macro math.
              </li>
            </ul>
          </section>

          <section className="mb-10">
            {signupsOpen && !cohortLive ? (
              <form
                action="/api/cohort/join"
                method="post"
                className="inline-block"
              >
                <input type="hidden" name="cohort_id" value={cohortObj.id} />
                <button
                  type="submit"
                  className="inline-flex items-center justify-center bg-coral hover:bg-coral-deep text-paper px-8 py-4 font-body text-caption uppercase tracking-widest transition-colors"
                >
                  Join this cohort →
                </button>
              </form>
            ) : (
              <span className="inline-flex items-center justify-center bg-paper border border-ink/20 text-ink/40 px-8 py-4 font-body text-caption uppercase tracking-widest">
                Cohort is currently locked
              </span>
            )}
            <p className="font-body text-xs text-ink/50 mt-3">
              {signupsOpen
                ? 'Sign in or sign up first, then come back to this page and the button will join you.'
                : `Sign-ups open 30 days before the cohort starts (${formatDateLong(cohortObj.signups_open_at)}). Bookmark this page and check back then.`}
            </p>
            <div className="mt-4">
              <Link
                href="/cohorts"
                className="font-body text-caption uppercase tracking-widest text-coral underline underline-offset-4 decoration-coral/40 hover:decoration-coral"
              >
                ← See other cohorts
              </Link>
            </div>
          </section>

          <section className="border-t border-ink/15 pt-8">
            <Heading size="h3" className="text-ink leading-snug mb-3">
              Share this cohort
            </Heading>
            <p className="font-body text-base text-ink/70 mb-4">
              If you know people who'd do this, share this page — the
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