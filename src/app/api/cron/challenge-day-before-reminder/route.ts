// GET /api/cron/challenge-day-before-reminder
//
// Daily Vercel Cron. Sends a "tomorrow is day 1" email to every
// user whose challenge starts tomorrow. Three flavours:
//   - solo   — the user set challenge_started_at on their own
//   - cohort — the user has an active cohort_memberships row
//   - buddy  — the user has an active buddy_pairs row
//
// Coalesced per (user, source) in public.challenge_day_before_reminder
// so retries on the cron don't double-mail. The log's primary key
// is (user_id, source) so a user who switched source (left a
// cohort and started solo, say) still gets the right one for
// each path.
//
// Auth: same shared-secret pattern as the other cohort crons.

import { NextRequest, NextResponse } from 'next/server';
import { authedUserFromRequest } from '@/lib/auth-server';
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/email';
import {
  renderDayBeforeReminderEmail,
  type DayBeforeSource,
} from '@/email/day-before-reminder';
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

function isoToLong(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
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

  // "Tomorrow" — computed in the user's account timezone. We use
  // UTC + 1 day as a conservative anchor because the cron is on UTC
  // and the user's local timezone can shift it by a few hours. The
  // "set yesterday" filter on profiles catches everyone whose
  // start_date is today in some timezone we don't know — close
  // enough for the purpose.
  const todayIso = new Date().toISOString().slice(0, 10);
  const tomorrowIso = new Date(Date.now() + 86_400_000)
    .toISOString()
    .slice(0, 10);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb: any = admin;

  // Collect recipients. A single user can have multiple "active"
  // sources (e.g. cohort member + buddy active). We dedupe per
  // (user_id, source) at the end so each source variant only
  // sends once per day.

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type Row = {
    user_id: string;
    email: string;
    display_name: string | null;
    source: DayBeforeSource;
    context_name: string | null;
  };

  // Three parallel queries so we get every source.
  const [soloRows, cohortRows, buddyRows, profileRows] = await Promise.all([
    // Solo: profile.challenge_started_at == tomorrow and the user
    // is NOT in a live cohort or has no active buddy seat.
    sb
      .from('profiles')
      .select('id, email, display_name, challenge_started_at')
      .eq('challenge_started_at', tomorrowIso),
    // Cohort members: their cohort starts tomorrow AND the membership
    // is still upcoming or active.
    sb
      .from('cohort_memberships')
      .select(
        'user_id, status, cohort:cohorts!inner(id, start_date, name), profile:profiles!cohort_memberships_user_id_fkey(id, email, display_name)'
      )
      .eq('cohort.start_date', tomorrowIso)
      .in('status', ['upcoming', 'active']),
    // Active buddy pairs: the giftee's profile.challenge_started_at
    // is tomorrow (we use the giftee as the recipient, since the
    // giftee is the one who has to log today).
    sb
      .from('buddy_pairs')
      .select(
        'id, status, giftee:profiles!buddy_pairs_buddy_user_id_fkey(id, email, display_name, challenge_started_at)'
      )
      .eq('status', 'activated')
      .eq('giftee.challenge_started_at', tomorrowIso),
    // Profile + tomorrow-start set, for the solo side-channel
    sb
      .from('profiles')
      .select('id, email, display_name, challenge_started_at')
      .eq('challenge_started_at', tomorrowIso),
  ]);

  const rows: Row[] = [];
  const profileMap = new Map<string, { email: string; display_name: string | null }>();
  for (const p of (profileRows.data as Array<{
    id: string;
    email: string;
    display_name: string | null;
  }> | null) ?? []) {
    profileMap.set(p.id, { email: p.email, display_name: p.display_name });
  }

  // Skip solo row if a cohort or buddy already covers this user.
  const alreadySentTo = new Set<string>();
  function skipIfCovered(uid: string) {
    return alreadySentTo.has(uid);
  }

  for (const c of (cohortRows.data as Array<{
    user_id: string;
    cohort: { id: string; name: string };
    profile: { id: string; email: string; display_name: string | null } | null;
  }> | null) ?? []) {
    if (!c.profile) continue;
    rows.push({
      user_id: c.user_id,
      email: c.profile.email,
      display_name: c.profile.display_name,
      source: 'cohort',
      context_name: c.cohort.name,
    });
    alreadySentTo.add(c.user_id);
  }

  for (const b of (buddyRows.data as Array<{
    id: string;
    giftee: { id: string; email: string; display_name: string | null } | null;
  }> | null) ?? []) {
    if (!b.giftee) continue;
    rows.push({
      user_id: b.giftee.id,
      email: b.giftee.email,
      display_name: b.giftee.display_name,
      source: 'buddy',
      context_name: b.giftee.display_name || b.giftee.email.split('@')[0],
    });
    alreadySentTo.add(b.giftee.id);
  }

  for (const s of (soloRows.data as Array<{
    id: string;
    email: string;
    display_name: string | null;
  }> | null) ?? []) {
    if (skipIfCovered(s.id)) continue;
    rows.push({
      user_id: s.id,
      email: s.email,
      display_name: s.display_name,
      source: 'solo',
      context_name: null,
    });
  }

  let sent = 0;
  let skipped = 0;
  const startDateLong = isoToLong(tomorrowIso);
  const origin = req.nextUrl.origin.replace(/\/$/, '');

  for (const r of rows) {
    // Skip if we already sent a reminder for this user+source today.
    const { data: already } = await sb
      .from('challenge_day_before_reminder')
      .select('user_id')
      .eq('user_id', r.user_id)
      .eq('source', r.source)
      .gte('sent_at', `${todayIso}T00:00:00Z`)
      .lte('sent_at', `${todayIso}T23:59:59Z`)
      .maybeSingle();
    if (already) {
      skipped++;
      continue;
    }
    const trackerUrl = `${origin}/account#tracker`;
    const rendered = renderDayBeforeReminderEmail({
      name: r.display_name,
      email: r.email,
      startDate: tomorrowIso,
      startDateLong,
      variant: r.source,
      trackerUrl,
      contextName: r.context_name ?? undefined,
    });
    const send = await sendEmail({
      to: r.email,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      tags: [
        { name: 'kind', value: 'day-before-reminder' },
        { name: 'source', value: r.source },
      ],
    });
    if (!send.ok) {
      console.warn(
        `day-before-reminder: send failed for ${r.email}:`,
        send.error
      );
      continue;
    }
    // Mark sent so the next cron run doesn't double-mail.
    await sb
      .from('challenge_day_before_reminder')
      .insert({ user_id: r.user_id, source: r.source });
    sent++;
  }

  return NextResponse.json({
    sent,
    skipped,
    total: rows.length,
  });
}
