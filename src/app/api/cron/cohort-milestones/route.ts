// GET /api/cron/cohort-milestones
//
// Daily Vercel Cron. Sends three transactional emails per cohort
// on the right day:
//   - day 1  (morning): "Your cohort starts today" — the day-1 email.
//   - day 25 (morning): "Halfway" — the day-25 nudge.
//   - day 50 (morning): "Day 50, done" — the day-50 nudge.
//
// Coalesced per-user per-cohort: a user gets at most one email per
// (cohort, day) combination. The "have we sent it yet?" check uses
// a dedicated `cohort_emails_sent` log table — see migration 0046
// for the schema. If that table doesn't exist yet (e.g. fresh
// install), the cron falls back to "send only on the exact day" so
// a misconfigured install still works.
//
// The cron also counts "still going" (≥ 1 habit in last 4 days)
// at send time so the day-25 email can include that number.
//
// Auth: same shared-secret pattern as the other cohort cron.

import { NextRequest, NextResponse } from 'next/server';
import { authedUserFromRequest } from '@/lib/auth-server';
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/email';
import {
  renderCohortMilestoneEmail,
  COHORT_REPLY_TYPE,
} from '@/email/cohort-start';
import type { Database } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CRON_SECRET = process.env.CRON_SECRET || process.env.BUDDY_CRON_SECRET;

function authOk(req: NextRequest): boolean {
  if (!CRON_SECRET) return false;
  const qsSecret = new URL(req.url).searchParams.get('secret');
  if (qsSecret && qsSecret === CRON_SECRET) return true;
  const header = req.headers.get('authorization') ?? '';
  if (header === `Bearer ${CRON_SECRET}`) return true;
  return false;
}

interface CohortEmailLog {
  cohort_id: string;
  user_id: string;
  day_number: number;
  sent_at: string;
}

export async function GET(req: NextRequest) {
  if (!authOk(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json(
      { error: 'Supabase env vars missing.' },
      { status: 503 }
    );
  }
  const admin = createClient<Database>(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb: any = admin;

  const today = new Date();
  const todayIso = today.toISOString().slice(0, 10);
  const dayMs = 1000 * 60 * 60 * 24;

  // Find all active+upcoming cohorts whose current day number is
  // 1, 25, or 50.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: cohorts } = await sb
    .from('cohorts')
    .select('id, start_date, name')
    .gte('start_date', new Date(today.getTime() - 49 * dayMs).toISOString().slice(0, 10))
    .lte('start_date', todayIso);
  if (!cohorts || cohorts.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  let totalSent = 0;
  let totalSkipped = 0;
  const origin = req.nextUrl.origin.replace(/\/$/, '');

  for (const cohort of cohorts as Array<{ id: string; start_date: string; name: string }>) {
    const start = new Date(cohort.start_date + 'T00:00:00');
    const dayNumber =
      Math.floor((today.getTime() - start.getTime()) / dayMs) + 1;
    if (dayNumber !== 1 && dayNumber !== 25 && dayNumber !== 50) continue;

    // Compute "still going" for the day-25 + day-50 emails. Skip
    // the day-1 calculation — at day 1, the answer is always
    // "cohort size" which the renderer already has via cohortSize.
    let stillGoing = 0;
    let cohortSize = 0;
    if (dayNumber === 25 || dayNumber === 50) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: sg } = await sb.rpc('cohort_still_going', {
        p_cohort_id: cohort.id,
        p_window_days: 4,
      });
      stillGoing = Number(sg ?? 0);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { count: cs } = await sb
        .from('cohort_memberships')
        .select('user_id', { count: 'exact', head: true })
        .eq('cohort_id', cohort.id)
        .in('status', ['upcoming', 'active']);
      cohortSize = Number(cs ?? 0);
    }

    // Look up the cohort's live members.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: members } = await sb
      .from('cohort_memberships')
      .select(
        'user_id, status, profile:profiles!cohort_memberships_user_id_fkey(email, display_name)'
      )
      .eq('cohort_id', cohort.id)
      .in('status', ['upcoming', 'active']);
    if (!members || members.length === 0) continue;

    // Deduped: only email the user once per (cohort, day). Check
    // cohort_emails_sent; the table is added in migration 0046
    // but if it's not there we just send the email once (the
    // day-number filter ensures the cron only fires on the
    // correct day, so duplicates are at most a single retry).
    const { data: alreadySent } = await sb
      .from('cohort_emails_sent')
      .select('user_id')
      .eq('cohort_id', cohort.id)
      .eq('day_number', dayNumber)
      .then(
        (res: { data: Array<{ user_id: string }> | null; error: unknown }) => ({
          data: res.data,
          error: res.error,
        })
      )
      .catch(() => ({ data: null as Array<{ user_id: string }> | null, error: 'table-missing' as unknown }));
    const sentSet = new Set(
      ((alreadySent?.data as Array<{ user_id: string }> | null) || []).map(
        (r) => r.user_id
      )
    );

    const variant: 'day-1' | 'day-25' | 'day-50' =
      dayNumber === 1 ? 'day-1' : dayNumber === 25 ? 'day-25' : 'day-50';

    for (const m of members as Array<{
      user_id: string;
      profile: { email: string | null; display_name: string | null } | null;
    }>) {
      if (!m.profile?.email) continue;
      if (sentSet.has(m.user_id)) {
        totalSkipped++;
        continue;
      }

      const rendered = renderCohortMilestoneEmail({
        name: m.profile.display_name,
        email: m.profile.email,
        cohortName: cohort.name,
        cohortDayNumber: dayNumber,
        cohortSize: cohortSize || members.length,
        stillGoing,
        trackerUrl: `${origin}/account#tracker`,
        variant,
      });

      const send = await sendEmail({
        to: m.profile.email,
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
        replyTo: `${COHORT_REPLY_TYPE}@fit50challenge.io`,
        tags: [
          { name: 'kind', value: 'cohort-milestone' },
          { name: 'cohort_id', value: cohort.id },
          { name: 'day', value: String(dayNumber) },
        ],
      });
      if (!send.ok) {
        console.error(
          `cohort-milestones: send failed for ${m.profile.email}:`,
          send.error
        );
        continue;
      }
      // Record the send so we don't double-mail on retry.
      try {
        await sb.from('cohort_emails_sent').insert({
          cohort_id: cohort.id,
          user_id: m.user_id,
          day_number: dayNumber,
          sent_at: new Date().toISOString(),
        });
      } catch (err) {
        // If the log table is missing (migration not yet applied),
        // we still sent the email — we just can't dedup. Tolerate.
        // eslint-disable-next-line no-console
        console.warn('cohort_emails_sent insert failed (non-fatal):', err);
      }
      totalSent++;
    }
  }

  return NextResponse.json({
    sent: totalSent,
    skipped: totalSkipped,
  });
}
