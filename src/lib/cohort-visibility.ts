// cohort-visibility
//
// Single source of truth for "should the cohort section show on the
// home page, and if so, which state?"
//
// The home page cohort section is for the discovery + decision
// surface, NOT the ongoing cohort view. It shows:
//
//   - For anonymous visitors: the next-cohort countdown + a "sign in
//     to join" CTA.
//   - For signed-in users who haven't started a challenge: the same
//     countdown + a real "join this cohort" CTA.
//   - For signed-in users who have joined a cohort but the cohort
//     hasn't started yet: the in-cohort card (countdown + finish
//     line + identity + leave/kudos) PLUS the 9-tile group log + arc
//     so the user can see their future cohort is real.
//   - For users mid-challenge (challenge_started_at is set): the
//     section hides entirely. The cohort experience lives on /account
//     at that point.
//
// The "is the cohort an upcoming one" check is independent of the
// "has the user started" check. A user can be signed-in + joined +
// upcoming without having started, and they should see the in-cohort
// view. A user signed-in + joined + active should NOT see the home
// page section — the /account CohortSection is the right place.

import type { CurrentCohort } from '@/hooks/useCurrentCohort';

export type CohortHomepageState =
  | { kind: 'hidden' }
  | { kind: 'hidden_mid_challenge' }
  | { kind: 'anonymous_countdown' }
  | { kind: 'signed_in_not_joined_countdown' }
  | {
      kind: 'joined_pre_start';
      cohort: CurrentCohort;
    };

export function cohortHomepageState(
  userSignedIn: boolean,
  hasStarted: boolean,
  current: CurrentCohort | null
): CohortHomepageState {
  // The home page section is for pre-start users only. Once the
  // user has started their challenge, the home page hides the
  // cohort programme entirely.
  if (hasStarted) {
    return { kind: 'hidden_mid_challenge' };
  }

  // Signed-in + joined + cohort is still upcoming → in-cohort view.
  if (current && current.status === 'upcoming') {
    return { kind: 'joined_pre_start', cohort: current };
  }

  // Anyone else (anonymous OR signed-in without a live cohort) gets
  // the countdown card. The CTA is "Sign in to join" for anonymous
  // and "Join this cohort →" for signed-in.
  if (!userSignedIn) {
    return { kind: 'anonymous_countdown' };
  }
  return { kind: 'signed_in_not_joined_countdown' };
}
