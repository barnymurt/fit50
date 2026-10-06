'use client';

// ChallengeCertificate
//
// Redesigned for the cohort launch. The original was a 4-column
// stat grid on a near-black background — hard to read, generic
// "50/50" celebration regardless of how the user actually did
// the 50 days, and no connection to the rest of the app.
//
// The new one is paper-toned, personalised, and tongue-and-cheek.
// It surfaces real numbers from the user's 50 days:
//   - Total days fully completed
//   - Longest completed-day streak
//   - Workout line distribution (A/B/C/D)
//   - Books read
//   - Water total + days hitting the 2.5L goal
//   - Days without alcohol / nicotine
//   - Cold shower days
//   - 10k-step days + total steps
//   - Food log: meals, kcal, days, macro hit rate
//   - Streak protections used
//
// The "What now?" footer has three concrete next-step CTAs that
// point at the parts of the app that keep them using FIT50
// (cohort, buddy, new personal challenge).

import Section from './Section';
import Heading from './Heading';
import type { CertificateData } from '@/hooks/useCertificateData';
import { dateKeyLocal } from '@/lib/dates';

interface ChallengeCertificateProps {
  data: CertificateData;
  startDate: string;
  displayName: string | null;
  email: string;
  isComplete: boolean;
  // Anchors the "→ end" half of the date range. By default this
  // is today; a user on day 49 with 49 complete days should see
  // their range end at day 49's date, not today's.
  endDateOverride?: string;
}

function formatDateLong(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  if (!y || !m || !d) return dateKey;
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

// "Record high" / "this is good, lean into it" framing for the
// headline numbers. Falls back to a sensible message if the
// user only just barely got here.
//
// The thresholds are tuned so each branch matches how the
// number feels rather than rounding. 45+ says "one day left" or
// "every day" because at that range the user is functionally
// done. 40-44 keeps "vast majority" because 80%+ is the natural
// home of that phrase. 25-39 is half-way. Under 25 is
// "you're on your way".
function headlineCopy(d: CertificateData, isComplete: boolean): string {
  if (isComplete || d.daysCompleted >= 50) {
    return 'You ticked every box, every day.';
  }
  if (d.daysCompleted >= 45) {
    return `${d.daysCompleted} of 50 — one day left.`;
  }
  if (d.daysCompleted >= 40) {
    return 'You ticked the vast majority of the boxes.';
  }
  if (d.daysCompleted >= 25) {
    return 'You got past the half-way point and kept going.';
  }
  return "You're on your way.";
}

function StickerStat({
  value,
  label,
  hint,
  suffix,
  tone = 'paper',
}: {
  value: string | number;
  label: string;
  hint?: string;
  suffix?: string;
  tone?: 'paper' | 'coral' | 'teal';
}) {
  const toneClass =
    tone === 'coral'
      ? 'border-coral/30 bg-coral/[0.04]'
      : tone === 'teal'
      ? 'border-teal/30 bg-teal/[0.04]'
      : 'border-ink/10 bg-paper';
  return (
    <div className={`p-4 border ${toneClass}`}>
      <p className="font-display text-h2 leading-none tabular-nums">
        {value}
        {suffix && (
          <span className="text-base text-ink/50 font-body font-normal ml-1.5">
            {suffix}
          </span>
        )}
      </p>
      <p className="font-body text-caption uppercase tracking-widest text-ink/60 mt-2">
        {label}
      </p>
      {hint && (
        <p className="font-body text-sm text-ink/50 mt-1">{hint}</p>
      )}
    </div>
  );
}

export default function ChallengeCertificate({
  data,
  startDate,
  displayName,
  email,
  isComplete,
  endDateOverride,
}: ChallengeCertificateProps) {
  // endDateOverride comes from the page: the date we anchor the
  // "→ end" half of the date range to. By default this is
  // today, but a user on day 49 with 49 complete days should see
  // their range end at day 49's date, not today's.
  const todayKey = endDateOverride ?? dateKeyLocal(new Date());
  const name = (displayName && displayName.trim()) || email;
  const d = data;
  const macroTargets = d.macroTargets;
  const proteinHitPct = macroTargets?.protein
    ? Math.round((d.macroProteinHits / 50) * 100)
    : null;
  const carbHitPct = macroTargets?.carbs
    ? Math.round((d.macroCarbHits / 50) * 100)
    : null;
  const fatHitPct = macroTargets?.fat
    ? Math.round((d.macroFatHits / 50) * 100)
    : null;
  // "This is what got you here" / "this is your next chapter" —
  // tone depends on how much they actually did. People who did
  // every day should feel acknowledged, not patronised. People
  // who only ticked 30 days shouldn't get "you did all 50" copy.
  //
  // The outro also lays out four real, concrete next-step paths
  // the user can take from this certificate (the design rule is
  // "useful: every email/page should give the reader one thing
  // they can do in the next five minutes"). We surface them as
  // bulleted next steps in the footer block.
  const outroCopy = (() => {
    if (d.daysCompleted >= 50) {
      return 'You finished the fifty days. The bit nobody tells you in the brochure is that the fifty-day clock isn\u2019t the one that matters most — the one that matters is whatever habit you kept doing when no one was watching. Pick the one that stuck and run it for another fifty. The toolkit is free to use in the meantime — food log, water, the macro calculator, the random exercise list — none of it has a timer. We\u2019ll be here for the boring middle.';
    }
    if (d.daysCompleted >= 25) {
      return 'You got past the half-way point, which is more than most people who start this challenge manage. The fifty-day clock isn\u2019t the only clock that matters; the easiest one to keep ticking is the one you start right after this one. Reset and run it again any time, or just keep using the food log and exercise tracker as-is.';
    }
    return 'You made it to day 50 \u2014 not by the path you planned, maybe, but you made it. The benefit of the fifty days is the habit, not the number. Pick the one habit that stuck, and run it for another fifty. The whole toolkit (food log, water, workouts, the random exercise picker) stays free to use any time. If you want the full 50-day restart, you can reset your challenge data and start again on any day.';
  })();

  const nextSteps: { label: string; body: string }[] = [
    {
      label: 'Reset and run it again',
      body:
        'On the tracker, "Reset" wipes your challenge data and starts a new 50 days. Reset the day before the 1st of a month and join a cohort if you want company, or just keep your own count.',
    },
    {
      label: 'Use the toolkit in the meantime',
      body:
        'Food log, water, workouts, the macro calculator, the random exercise list — none of it expires when the fifty days end. Use the parts that help without the 50-day pressure.',
    },
    {
      label: 'Try again in a few months',
      body:
        'Cohorts open on the 1st of each month. If you want a fresh start without a reset, wait for the next one and join when you\u2019re ready. The account page shows the next open cohort.',
    },
    {
      label: 'Send it to a friend',
      body:
        'If a friend is the kind of person who would do this, send them the link. Buddy pairs are free to set up; cohorts are free to join. Recommend the toolkit, not the streak.',
    },
  ];

  return (
    <Section
      id="challenge-certificate"
      className="relative pt-12 md:pt-16 pb-section"
      tone="paper"
      contained
    >
      <div className="max-w-4xl mx-auto">
        {/* Letterhead */}
        <div className="flex items-baseline justify-between mb-6">
          <p className="font-display text-h2 text-coral leading-none">
            FIT50
          </p>
          <p className="font-body text-caption uppercase tracking-widest text-ink/50">
            Certificate of completion · 50 days · 9 rules
          </p>
        </div>

        <div className="border border-ink/20 bg-paper">
          {/* Personalised opener */}
          <div className="px-6 md:px-12 py-10 md:py-14 border-b border-ink/10 bg-cre-30">
            <p className="font-body text-caption uppercase tracking-widest text-coral mb-4">
              {isComplete
                ? 'Challenge complete'
                : `In progress · day ${d.daysCompleted} of 50`}
            </p>
            <Heading size="display-2" className="text-ink leading-[1.05]">
              {headlineCopy(d, isComplete)}
            </Heading>
            <p className="font-body text-base text-ink/70 mt-4 max-w-xl">
              {formatDateLong(startDate)} → {formatDateLong(todayKey)}
            </p>
            <p className="font-body text-base text-ink mt-2">{name}</p>
          </div>

          {/* The headline numbers — what they actually did */}
          <div className="px-6 md:px-12 py-8 md:py-10 border-b border-ink/10">
            <p className="font-body text-caption uppercase tracking-widest text-ink/40 mb-5">
              The headline
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StickerStat
                value={`${d.daysCompleted}/50`}
                label="full days"
                tone={d.daysCompleted >= 50 ? 'coral' : 'paper'}
              />
              <StickerStat
                value={d.longestStreak}
                label="day streak (best)"
                hint={
                  d.longestStreak >= 14
                    ? 'Two weeks unbroken. Nice.'
                    : d.longestStreak >= 7
                    ? 'A full week, unbroken.'
                    : undefined
                }
              />
              <StickerStat
                value={d.workoutCompletions}
                label="workouts done"
              />
              <StickerStat
                value={d.streakProtectionsUsed}
                label="banana days"
                hint={
                  d.streakProtectionsUsed > 0
                    ? 'Earned, not given.'
                    : 'Streak held the line.'
                }
                tone={d.streakProtectionsUsed > 0 ? 'teal' : 'paper'}
              />
            </div>
          </div>

          {/* What you ate — real food log stats */}
          <div className="px-6 md:px-12 py-8 md:py-10 border-b border-ink/10">
            <p className="font-body text-caption uppercase tracking-widest text-ink/40 mb-5">
              What you ate
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StickerStat
                value={d.mealsLogged}
                label="meals logged"
              />
              <StickerStat
                value={d.daysWithFood}
                label="days with food"
              />
              <StickerStat
                value={Math.round(d.totalKcalLogged).toLocaleString()}
                label="kcal total"
                suffix="kcal"
              />
              <StickerStat
                value={
                  d.daysWithFood > 0
                    ? Math.round(d.totalKcalLogged / d.daysWithFood).toLocaleString()
                    : '—'
                }
                label="avg kcal / eating day"
              />
            </div>
            {macroTargets && (
              <p className="font-body text-sm text-ink/60 mt-4">
                Hit your macro target on{' '}
                {proteinHitPct !== null && (
                  <span className="text-ink">protein {proteinHitPct}%</span>
                )}
                {proteinHitPct !== null && (carbHitPct !== null || fatHitPct !== null) && (
                  <span className="text-ink/40"> · </span>
                )}
                {carbHitPct !== null && (
                  <span className="text-ink">carbs {carbHitPct}%</span>
                )}
                {carbHitPct !== null && fatHitPct !== null && (
                  <span className="text-ink/40"> · </span>
                )}
                {fatHitPct !== null && (
                  <span className="text-ink">fat {fatHitPct}%</span>
                )}{' '}
                of the 50 days.
              </p>
            )}
            {!macroTargets && (
              <p className="font-body text-sm text-ink/50 mt-4 italic">
                No macro profile saved — fill in the macro calculator to
                see macro target hit rate on the next run.
              </p>
            )}
          </div>

          {/* How you moved */}
          <div className="px-6 md:px-12 py-8 md:py-10 border-b border-ink/10">
            <p className="font-body text-caption uppercase tracking-widest text-ink/40 mb-5">
              How you moved
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StickerStat
                value={d.coldShowerDays}
                label="cold shower days"
              />
              <StickerStat
                value={d.tenKStepDays}
                label="10K-step days"
                hint="Days you walked / ran 10,000+ steps."
              />
              <StickerStat
                value={d.waterGoalHits}
                label={`${(2.5).toFixed(1)}L days`}
                hint={`${(d.waterTotalMl / 1000).toFixed(1)}L total`}
              />
              <StickerStat
                value={d.stepsTotal.toLocaleString()}
                label="steps you logged"
                suffix="steps"
                hint="Across all 50 days."
              />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <StickerStat
                value={d.daysWithoutAlcohol}
                label="alcohol-free"
                tone={d.daysWithoutAlcohol >= 40 ? 'teal' : 'paper'}
              />
              <StickerStat
                value={d.daysWithoutNicotine}
                label="nicotine-free"
                tone={d.daysWithoutNicotine >= 40 ? 'teal' : 'paper'}
              />
            </div>
          </div>

          {/* Books */}
          <div className="px-6 md:px-12 py-8 md:py-10 border-b border-ink/10">
            <div className="flex items-baseline justify-between mb-5">
              <p className="font-body text-caption uppercase tracking-widest text-ink/40">
                Books read
              </p>
              <p className="font-body text-caption uppercase tracking-widest text-ink/40 tabular-nums">
                {d.books.length} title{d.books.length === 1 ? '' : 's'}
              </p>
            </div>
            {d.books.length === 0 ? (
              <p className="font-body text-sm text-ink/50 italic">
                No books logged. The "Feed Your Brain" track is the
                most-skipped part of the challenge, and you're not
                alone — but a single 30-minute read a day puts you
                ahead of 80% of users.
              </p>
            ) : (
              <ol className="space-y-3">
                {d.books.map((b, i) => (
                  <li
                    key={`${b.title}-${b.format}-${i}`}
                    className="flex items-baseline gap-4 border-b border-ink/10 pb-3 last:border-b-0 last:pb-0"
                  >
                    <span className="font-display text-base text-coral tabular-nums w-6 shrink-0">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="font-display text-h3 text-ink flex-1">
                      {b.title}
                    </span>
                    <span className="font-body text-caption uppercase tracking-widest text-ink/60 shrink-0">
                      {b.format === 'read' ? 'Read' : 'Listened'}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </div>

          {/* Your frequent movers — top exercises by total sets
              across the 50 days. Each row shows the exercise name,
              the count of days they did it, and the cumulative set
              count. Skipped when the user didn't do any workouts. */}
          {d.topExercises.length > 0 && (
            <div className="px-6 md:px-12 py-8 md:py-10 border-b border-ink/10">
              <div className="flex items-baseline justify-between mb-5">
                <p className="font-body text-caption uppercase tracking-widest text-ink/40">
                  Your frequent movers
                </p>
                <p className="font-body text-caption uppercase tracking-widest text-ink/40 tabular-nums">
                  {d.uniqueExercisesDone} exercise{d.uniqueExercisesDone === 1 ? '' : 's'} ·{' '}
                  {d.totalSetsAcrossAllExercises} sets
                </p>
              </div>
              <ol className="space-y-2">
                {d.topExercises.map((e, i) => (
                  <li
                    key={e.name}
                    className="flex items-baseline gap-4 border-b border-ink/10 pb-2 last:border-b-0 last:pb-0"
                  >
                    <span className="font-display text-base text-coral tabular-nums w-6 shrink-0">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="font-display text-h3 text-ink flex-1">
                      {e.name}
                    </span>
                    <span className="font-body text-caption uppercase tracking-widest text-ink/50 shrink-0 tabular-nums">
                      {e.totalSets} sets · {e.dayCount} day{e.dayCount === 1 ? '' : 's'}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* What now? — tongue-and-cheek outro + 4 concrete next-step
              paths the user can take. Brand voice: honest (no fake
              "you're a champion!" energy), useful (every option
              has a clear action), brief (each option is one short
              paragraph, not a wall of text). */}
          <div className="px-6 md:px-12 py-8 md:py-10 bg-cre-30 border-b border-ink/10">
            <p className="font-body text-caption uppercase tracking-widest text-coral mb-3">
              What now?
            </p>
            <p className="font-display text-h3 text-ink leading-snug">
              {outroCopy}
            </p>

            <ol className="mt-6 space-y-4">
              {nextSteps.map((s) => (
                <li
                  key={s.label}
                  className="border-l-2 border-coral pl-4"
                >
                  <p className="font-body text-caption uppercase tracking-widest text-ink">
                    {s.label}
                  </p>
                  <p className="font-body text-base text-ink/80 mt-1 leading-snug">
                    {s.body}
                  </p>
                </li>
              ))}
            </ol>

            <div className="mt-6 flex flex-col sm:flex-row flex-wrap gap-3">
              <a
                href="/account#cohorts"
                className="inline-flex items-center justify-center border border-ink px-5 py-3 font-body text-caption uppercase tracking-widest text-ink hover:bg-ink hover:text-paper transition-colors"
              >
                Start a cohort →
              </a>
              <a
                href="/account#buddy"
                className="inline-flex items-center justify-center border border-ink px-5 py-3 font-body text-caption uppercase tracking-widest text-ink hover:bg-ink hover:text-paper transition-colors"
              >
                Add a buddy →
              </a>
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== 'undefined') window.print();
                }}
                className="inline-flex items-center justify-center border border-ink px-5 py-3 font-body text-caption uppercase tracking-widest text-ink hover:bg-ink hover:text-paper transition-colors"
              >
                Print / save as PDF
              </button>
            </div>
          </div>
        </div>

        <p className="font-body text-caption uppercase tracking-widest text-ink/40 mt-6 text-center">
          Issued by FIT50 · {formatDateLong(todayKey)}
        </p>
      </div>
    </Section>
  );
}
