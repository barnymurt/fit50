'use client';

import Section from './Section';
import Heading from './Heading';
import { ChallengeStats } from '@/hooks/useChallengeStats';
import { dateKeyLocal } from '@/lib/dates';

interface ChallengeCertificateProps {
  stats: ChallengeStats;
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

function Stat({ label, value, suffix }: { label: string; value: string | number; suffix?: string }) {
  return (
    <div className="px-5 py-5 border border-paper/20 bg-paper/5">
      <p className="font-body text-caption uppercase tracking-widest text-paper/60 mb-2">
        {label}
      </p>
      <p className="font-display text-h1 text-paper leading-none tabular-nums">
        {value}
        {suffix && (
          <span className="text-base text-paper/50 font-body font-normal ml-1.5">
            {suffix}
          </span>
        )}
      </p>
    </div>
  );
}

function LineBars({ value, total }: { value: number; total: number }) {
  return (
    <span className="inline-flex gap-1 ml-1 align-middle">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          aria-hidden="true"
          className={`inline-block w-2 h-2 ${i < value ? 'bg-coral' : 'bg-paper/15'}`}
        />
      ))}
    </span>
  );
}

export default function ChallengeCertificate({
  stats,
  startDate,
  displayName,
  email,
  isComplete,
}: ChallengeCertificateProps) {
  const todayKey = dateKeyLocal(new Date());
  const endKey = todayKey;
  const daysCounted = stats.totalDays;
  const name = (displayName && displayName.trim()) || email;

  const lineCounts: Record<'A' | 'B' | 'C' | 'D', number> = { A: 0, B: 0, C: 0, D: 0 };
  for (const w of stats.workoutLines) {
    if (w.completed) lineCounts[w.line] += 1;
  }

  return (
    <Section
      id="challenge-certificate"
      className="relative pt-16 md:pt-24 pb-section"
      tone="ink"
      contained
    >
      <div className="max-w-4xl mx-auto">
        {/* Wordmark + headline */}
        <div className="flex items-baseline justify-between mb-6">
          <p className="font-display text-h2 text-coral leading-none">
            FIT50
          </p>
          <p className="font-body text-caption uppercase tracking-widest text-paper/50">
            The challenge · 50 days · 9 rules
          </p>
        </div>

        <div className="border border-paper/30 bg-paper/[0.03]">
          <div className="px-6 md:px-12 py-10 md:py-14 border-b border-paper/20">
            <p className="font-body text-caption uppercase tracking-widest text-coral mb-4">
              {isComplete ? 'Challenge complete' : `In progress · day ${daysCounted} of 50`}
            </p>
            <Heading size="display-2" className="text-paper leading-[1.05]">
              {isComplete ? 'You did all 50.' : `Day ${daysCounted} of 50.`}
            </Heading>
            <p className="font-body text-base text-paper/80 mt-4 max-w-xl">
              {formatDateLong(startDate)} → {formatDateLong(endKey)}
            </p>
            <p className="font-body text-sm text-paper/60 mt-1">
              {name}
            </p>
          </div>

          {/* Stats grid */}
          <div className="px-6 md:px-12 py-8 md:py-10 border-b border-paper/20">
            <p className="font-body text-caption uppercase tracking-widest text-paper/50 mb-5">
              The numbers
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Stat
                label="Days without alcohol"
                value={`${stats.daysWithoutAlcohol}/${daysCounted}`}
              />
              <Stat
                label="Days without nicotine"
                value={`${stats.daysWithoutNicotine}/${daysCounted}`}
              />
              <Stat
                label="Cold shower days"
                value={`${stats.coldShowerDays}/${daysCounted}`}
              />
              <Stat
                label="10K step days"
                value={`${stats.tenKStepDays}/${daysCounted}`}
              />
              <Stat
                label="Water goal hits"
                value={`${stats.waterGoalHits}/${daysCounted}`}
              />
              <Stat
                label="Water total"
                value={(stats.waterTotalMl / 1000).toFixed(1)}
                suffix="L"
              />
              <Stat
                label="Workouts complete"
                value={`${stats.workoutCompletions}/${daysCounted}`}
              />
              <Stat
                label="Streak protections"
                value={stats.streakProtectionsUsed}
                suffix="🍌"
              />
            </div>

            {/* Workout line breakdown */}
            <div className="mt-6 grid grid-cols-4 gap-3">
              {(['A', 'B', 'C', 'D'] as const).map((line) => (
                <div
                  key={line}
                  className="px-3 py-3 border border-paper/20 bg-paper/[0.04]"
                >
                  <p className="font-display text-h2 text-paper leading-none mb-2">
                    {line}
                  </p>
                  <p className="font-body text-caption uppercase tracking-widest text-paper/50 mb-2">
                    {lineCounts[line]} done
                  </p>
                  <LineBars value={lineCounts[line]} total={daysCounted} />
                </div>
              ))}
            </div>
          </div>

          {/* Books */}
          <div className="px-6 md:px-12 py-8 md:py-10 border-b border-paper/20">
            <div className="flex items-baseline justify-between mb-5">
              <p className="font-body text-caption uppercase tracking-widest text-paper/50">
                Books read
              </p>
              <p className="font-body text-caption uppercase tracking-widest text-paper/40 tabular-nums">
                {stats.books.length} title{stats.books.length === 1 ? '' : 's'}
              </p>
            </div>
            {stats.books.length === 0 ? (
              <p className="font-body text-sm text-paper/50 italic">
                No books logged yet. Save a book in Feed Your Brain and
                it&apos;ll show here on completion day.
              </p>
            ) : (
              <ol className="space-y-3">
                {stats.books.map((b, i) => (
                  <li
                    key={`${b.title}-${b.format}`}
                    className="flex items-baseline gap-4 border-b border-paper/10 pb-3 last:border-b-0 last:pb-0"
                  >
                    <span className="font-display text-base text-coral tabular-nums w-6 shrink-0">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="font-display text-h3 text-paper flex-1">
                      {b.title}
                    </span>
                    <span className="font-body text-caption uppercase tracking-widest text-paper/50 shrink-0">
                      {b.format === 'read' ? 'Read' : 'Listened'}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 md:px-12 py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="font-body text-caption uppercase tracking-widest text-paper/40">
              All nine · every day · that&apos;s the challenge
            </p>
            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined') window.print();
              }}
              className="inline-flex items-center justify-center bg-paper text-ink hover:bg-paper/90 transition-colors px-5 py-3 font-body text-caption uppercase tracking-widest"
            >
              Print / save as PDF
            </button>
          </div>
        </div>

        <p className="font-body text-caption uppercase tracking-widest text-paper/30 mt-6 text-center">
          Issued by FIT50 · {formatDateLong(endKey)}
        </p>
      </div>
    </Section>
  );
}