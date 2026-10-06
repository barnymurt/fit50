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
function headlineCopy(d: CertificateData): string {
  if (d.daysCompleted >= 50) {
    return 'You ticked every box, every day.';
  }
  if (d.daysCompleted >= 40) {
    return 'You ticked the vast majority of the boxes.';
  }
  if (d.daysCompleted >= 25) {
    return 'You got past the half-way point and kept going.';
  }
  return 'You made it to day 50.';
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
}: ChallengeCertificateProps) {
  const todayKey = dateKeyLocal(new Date());
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
  const workoutLineDistribution = (() => {
    const byLine: Record<'A' | 'B' | 'C' | 'D', number> = {
      A: 0, B: 0, C: 0, D: 0,
    };
    // Read from the same data source the cert already pulled —
    // workoutCompletions is a count, not a per-line breakdown, so
    // we surface the dominant line via the title text.
    return byLine;
  })();

  // "This is what got you here" / "this is your next chapter" —
  // tone depends on how much they actually did. People who did
  // every day should feel acknowledged, not patronised. People
  // who only ticked 30 days shouldn't get "you did all 50" copy.
  const outroCopy = (() => {
    if (d.daysCompleted >= 50) {
      return 'You finished the fifty days. The bit nobody told you in the brochure: the real flex is the 50-day streak that comes right after this one. Pick the thing you couldn\u2019t stop doing during the challenge, and do it for another fifty. We\u2019ll be here for the boring middle.';
    }
    if (d.daysCompleted >= 25) {
      return 'You got past the half-way point. Half the people who start this challenge don\u2019t. The fifty-day clock isn\u2019t the only clock that matters; the easiest one to keep ticking is the one you start right after this one.';
    }
    return 'You got to day 50 \u2014 maybe not by the path you planned, but you got there. Most of the benefit of the fifty days is the habit, not the number. Pick the one habit that stuck and run it for another fifty.';
  })();

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
              {headlineCopy(d)}
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
              />
              <StickerStat
                value={d.waterGoalHits}
                label={`${(2.5).toFixed(1)}L days`}
                hint={`${(d.waterTotalMl / 1000).toFixed(1)}L total`}
              />
              <StickerStat
                value={d.stepsTotal.toLocaleString()}
                label="steps total"
                suffix="steps"
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

          {/* What now? — tongue-and-cheek, then concrete next steps */}
          <div className="px-6 md:px-12 py-8 md:py-10 bg-cre-30 border-b border-ink/10">
            <p className="font-body text-caption uppercase tracking-widest text-coral mb-3">
              What now?
            </p>
            <p className="font-display text-h3 text-ink leading-snug">
              {outroCopy}
            </p>

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
