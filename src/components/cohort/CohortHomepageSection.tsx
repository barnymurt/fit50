'use client';

// CohortHomepageSection
//
// The cohort section that lives on the home page (between the
// Tracker section and FAQ). Replaces the deleted /cohorts landing
// page. Anonymous and pre-start users see a countdown to the next
// cohort (always the 1st of the month) with a join CTA. Signed-in
// cohort members in the brief pre-start window see the full
// in-cohort view (countdown card + 9-tile log + 50-day arc).
//
// Once the user has started their challenge (challenge_started_at
// is set), the section hides — the cohort experience moves to
// /account at that point. See docs/user-stories/cohort-countdown-
// on-homepage.md for the full spec.

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Section from '@/components/Section';
import Heading from '@/components/Heading';
import { useAuth } from '@/contexts/AuthContext';
import { useTrackerState } from '@/hooks/useTrackerState';
import { useCurrentCohort } from '@/hooks/useCurrentCohort';
import { useAvailableCohorts } from '@/hooks/useAvailableCohorts';
import { useCohortProgress } from '@/hooks/useCohortProgress';
import { useCohortMembership } from '@/hooks/useCohortMembership';
import { dateKeyLocal } from '@/lib/dates';
import { finishLineSentence } from '@/lib/cohort-events';
import { cohortHomepageState } from '@/lib/cohort-visibility';
import CohortCard from './CohortCard';
import CohortTodayPanel from './CohortTodayPanel';
import CohortArc from './CohortArc';

export default function CohortHomepageSection() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const tracker = useTrackerState();
  const { current, loaded: cohortLoaded } = useCurrentCohort();
  const { cohorts: availableCohorts, loaded: availableLoaded } =
    useAvailableCohorts();
  const progress = useCohortProgress(
    current?.cohortId ?? null,
    current?.startDate ?? null
  );
  const { join, pending: joining, lastError: joinError } =
    useCohortMembership();
  const [joinBusyFor, setJoinBusyFor] = useState<string | null>(null);

  const userSignedIn = !!user;
  const hasStarted = tracker.hasStarted;
  const state = cohortHomepageState(userSignedIn, hasStarted, current);

  // The headline cohort: the first one in the available list, or
  // null if none are available right now.
  const head = availableCohorts[0] ?? null;
  const tail = availableCohorts.slice(1);

  async function onJoin(cohortId: string) {
    if (!user) {
      router.push(
        '/account?next=' +
          encodeURIComponent('/#cohort-on-homepage')
      );
      return;
    }
    setJoinBusyFor(cohortId);
    const res = await join(cohortId);
    setJoinBusyFor(null);
    if (res.ok) {
      // useCurrentCohort will re-fetch on
      // COHORT_MEMBERSHIP_CHANGED_EVENT (dispatched by the
      // useCohortMembership hook), so the UI flips to the
      // joined-pre-start state without a reload.
    }
  }

  // Don't render anything while auth/tracker are loading — avoids
  // a flash of the wrong state.
  if (authLoading || !tracker.loaded) {
    return null;
  }

  // Mid-challenge: hide entirely. The cohort experience lives on
  // /account.
  if (state.kind === 'hidden_mid_challenge' || state.kind === 'hidden') {
    return null;
  }

  // In-cohort view (signed-in + joined + cohort still upcoming).
  if (state.kind === 'joined_pre_start') {
    return (
      <Section
        id="cohort-on-homepage"
        data-section="cohort-homepage"
        tone="paper"
        className="relative py-section"
        contained
      >
        <div className="max-w-3xl mx-auto">
          <p className="font-body text-caption uppercase tracking-widest text-coral mb-3">
            Your cohort
          </p>
          <Heading>You&apos;re in.</Heading>
          <p className="font-body text-base text-ink/70 mt-3 max-w-xl mb-8">
            You&apos;ve joined the next monthly cohort. Here&apos;s how the
            group is shaping up before day 1.
          </p>
          <CohortCard
            cohort={state.cohort}
            onLeft={() => window.location.reload()}
          />
          {progress.loaded && (
            <>
              <div className="mt-6">
                <CohortTodayPanel
                  perHabit={progress.todayPerHabit}
                  cohortSize={progress.cohortSize}
                  headline={
                    progress.cohortSize > 0
                      ? `${progress.arcStrictCounts[state.cohort.cohortDayNumber] || 0} of ${progress.cohortSize} of you hit 9/9 today`
                      : 'No one in the cohort yet'
                  }
                  highFiversToday={progress.highFiversToday}
                />
              </div>
              <div className="mt-6">
                <CohortArc
                  cohortDayNumber={state.cohort.cohortDayNumber}
                  cohortSize={progress.cohortSize}
                  arcStrictCounts={progress.arcStrictCounts}
                  stillGoing={progress.stillGoing}
                />
              </div>
            </>
          )}
        </div>
      </Section>
    );
  }

  // Discovery view (anonymous OR signed-in not joined). Shows the
  // countdown to the next cohort + a join CTA.
  if (!availableLoaded || !cohortLoaded) {
    // Don't show the section if we don't yet know whether there's a
    // cohort to show. The CTA would be misleading.
    return null;
  }

  // If there are no upcoming cohorts to display, hide the section
  // entirely rather than show "0 days".
  if (!head) {
    return null;
  }

  const daysAway = Math.max(
    0,
    Math.round(
      (new Date(head.start_date + 'T00:00:00').getTime() -
        new Date(dateKeyLocal(new Date()) + 'T00:00:00').getTime()) /
        86_400_000
    )
  );
  const signupsOpen =
    new Date() >= new Date(head.signups_open_at + 'T00:00:00');
  const headStart = new Date(
    head.start_date + 'T00:00:00'
  ).toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  const ctaLabel = state.kind === 'anonymous_countdown'
    ? 'Sign in to join →'
    : 'Join this cohort →';
  const onCtaClick = () => {
    if (state.kind === 'anonymous_countdown') {
      router.push(
        '/account?next=' +
          encodeURIComponent('/#cohort-on-homepage')
      );
      return;
    }
    onJoin(head.id);
  };

  return (
    <Section
      id="cohort-on-homepage"
      data-section="cohort-homepage"
      tone="paper"
      className="relative py-section"
      contained
    >
      <div className="max-w-3xl mx-auto">
        <p className="font-body text-caption uppercase tracking-widest text-coral mb-3">
          Or start with a cohort
        </p>
        <Heading>50 days, together.</Heading>
        <p className="font-body text-base text-ink/70 mt-3 max-w-xl mb-8">
          A cohort is a group of people starting the 50 days together
          on the same day. Your day number, the cohort day, and the
          9-cell habit grid stay yours — you just see a collective
          &ldquo;X of Y hit 9/9 today&rdquo; instead of working alone.
        </p>

        <div
          data-section="cohort-homepage-countdown"
          className="border border-coral bg-coral/[0.05] p-6 max-w-md mx-auto mb-4"
          aria-live="polite"
        >
          <p
            data-section="cohort-homepage-countdown-label"
            className="font-body text-caption uppercase tracking-widest text-coral mb-1"
          >
            {signupsOpen
              ? daysAway > 0
                ? 'Next cohort starts in'
                : 'Next cohort starts today'
              : 'Next cohort'}
          </p>
          <p
            data-section="cohort-homepage-countdown-days"
            className="font-display text-display-2 text-ink leading-[0.95] tabular-nums mb-1"
          >
            {signupsOpen
              ? daysAway > 0
                ? `${daysAway} day${daysAway === 1 ? '' : 's'}`
                : 'Today'
              : head.name}
          </p>
          <p className="font-body text-caption text-ink/60 mb-4">
            Starts {headStart} · {finishLineSentence(head.start_date)}
          </p>
          <button
            type="button"
            onClick={onCtaClick}
            disabled={joining || joinBusyFor === head.id}
            data-section="cohort-homepage-join"
            className="inline-flex items-center justify-center bg-coral hover:bg-coral-deep text-paper px-5 py-3 font-body text-caption uppercase tracking-widest transition-colors disabled:opacity-50"
          >
            {joinBusyFor === head.id || (joining && state.kind === 'signed_in_not_joined_countdown')
              ? 'Joining…'
              : ctaLabel}
          </button>
          {joinError && (
            <p
              data-section="cohort-homepage-join-error"
              className="font-body text-caption text-coral mt-2"
              role="alert"
            >
              {joinError}
            </p>
          )}
        </div>

        {tail.length > 0 && (
          <details
            data-section="cohort-homepage-tail"
            className="max-w-md mx-auto"
          >
            <summary className="font-body text-caption uppercase tracking-widest text-ink/40 cursor-pointer">
              After that
            </summary>
            <ul className="space-y-2 mt-3">
              {tail.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => onJoin(c.id)}
                    disabled={joinBusyFor === c.id}
                    data-section="cohort-homepage-tail-join"
                    className="w-full border border-ink/15 bg-paper p-3 text-left hover:border-coral transition-colors disabled:opacity-50"
                  >
                    <div className="flex items-baseline justify-between gap-2 mb-1">
                      <span className="font-display text-sm text-ink">
                        {c.name}
                      </span>
                      <span className="font-body text-caption uppercase tracking-widest text-coral">
                        {joinBusyFor === c.id ? 'Joining…' : 'Join →'}
                      </span>
                    </div>
                    <p className="font-body text-caption text-ink/60">
                      Starts {new Date(c.start_date + 'T00:00:00').toLocaleDateString(
                        undefined,
                        { month: 'long', day: 'numeric', year: 'numeric' }
                      )}
                    </p>
                    <p className="font-body text-caption text-coral/80 mt-1">
                      {finishLineSentence(c.start_date)}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
    </Section>
  );
}
