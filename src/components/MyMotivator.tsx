'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase';

interface BuyerSnapshot {
  buyer_name: string;
  // Buyer's current day in the 50-day challenge.
  current_day: number;
  // Buyer's current streak (consecutive days with all 9 habits).
  streak: number;
  // Today's habit ids the buyer has marked done. We use this to
  // render a 9-cell strip of "done" / "pending" markers — no food,
  // water, weight, macros, no drill-down. Just the line.
  done_today: string[];
  // Id list for the 9 challenges, so we can render the
  // always-the-same 9-cell strip in a fixed order.
  habit_ids: string[];
  // The buyer's is_premium flag — visible for context.
  buyer_is_premium: boolean;
}

const HABIT_ORDER = [
  'feed-brain',
  'move-body',
  'fuel-right',
  'crispy-clarity',
  'fresh-lungs',
  'open-mind',
  'step-it-up',
  'wet-lips',
  'chill-out',
];

const HABIT_LABEL: Record<string, string> = {
  'feed-brain': 'Feed Your Brain',
  'move-body': 'Move Your Body',
  'fuel-right': 'Fuel Right',
  'crispy-clarity': 'Crispy Clarity',
  'fresh-lungs': 'Fresh Lungs',
  'open-mind': 'Open Mind',
  'step-it-up': 'Step It Up',
  'wet-lips': 'Wet The Lips',
  'chill-out': 'Chill Out',
};

function todayDateKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function MyMotivator() {
  const { user, profile } = useAuth();
  const [snap, setSnap] = useState<BuyerSnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRef = useRef<() => Promise<void>>(async () => {});

  useEffect(() => {
    if (!user || !profile?.purchased_by_user_id) {
      setSnap(null);
      setLoading(false);
      return;
    }
    const buyerId = profile.purchased_by_user_id;
    const supabase = createClient();
    if (!supabase) return;

    let cancelled = false;
    setLoading(true);

    const doFetch = async () => {
      try {
        // 1. Buyer's profile — name and challenge start.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: bp } = await (supabase.from('profiles') as any)
          .select('display_name, is_premium, challenge_started_at')
          .eq('id', buyerId)
          .maybeSingle();

        // 2. Buyer's start day + today's habit progress.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: tps } = await (supabase.from('tracker_progress') as any)
          .select('day, habit_id, completed')
          .eq('user_id', buyerId)
          .order('day', { ascending: false })
          .limit(60);

        if (cancelled) return;

        const startIso = bp?.challenge_started_at as string | null;
        const startMs = startIso ? new Date(startIso).getTime() : null;
        const elapsedDays = startMs
          ? Math.floor((Date.now() - startMs) / 86_400_000) + 1
          : 0;
        const currentDay = Math.max(1, Math.min(50, elapsedDays));

        // Pull today's habit list out of tracker_progress for the
        // current day (the latest one that has any rows). If
        // current_day is the latest, look at that.
        const allRows = (tps || []) as Array<{
          day: number;
          habit_id: string;
          completed: boolean;
        }>;
        const todayDone = allRows
          .filter((r) => r.day === currentDay && r.completed)
          .map((r) => r.habit_id);
        const completedDays = new Set(
          allRows.filter((r) => r.completed).map((r) => r.day)
        );

        // Streak: walk backwards from currentDay, counting consecutive
        // days with at least one completed habit. Only count days that
        // are 'past' relative to today (so the current day doesn't
        // count toward streak if not yet finished).
        let streak = 0;
        for (let d = currentDay - 1; d >= 1; d--) {
          if (completedDays.has(d)) streak++;
          else break;
        }

        setSnap({
          buyer_name: (bp?.display_name as string) || 'Your mate',
          current_day: currentDay,
          streak,
          done_today: todayDone,
          habit_ids: HABIT_ORDER,
          buyer_is_premium: !!bp?.is_premium,
        });
      } catch {
        if (!cancelled) setSnap(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchRef.current = doFetch;

    doFetch();

    // Re-fetch on visibility change and once a minute so the
    // day-rollover (currentDay = floor((now - start) / day) + 1)
    // updates the card. Also re-fetch on focus for the same reason.
    const onVisible = () => {
      if (document.visibilityState === 'visible') doFetch();
    };
    const interval = setInterval(doFetch, 60_000);
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);

    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, [user, profile?.purchased_by_user_id]);

  if (!user || !profile?.purchased_by_user_id) return null;
  if (loading && !snap) {
    return (
      <div className="border border-ink/10 bg-cream/30 p-4 mb-6">
        <p className="font-body text-caption uppercase tracking-widest text-ink/50">
          A small shout-out
        </p>
        <p className="font-body text-sm text-ink/40 mt-1">Loading…</p>
      </div>
    );
  }
  if (!snap) return null;

  const doneSet = new Set(snap.done_today);
  const dayN = Math.min(50, Math.max(1, snap.current_day));
  const remaining = Math.max(0, 50 - dayN);

  return (
    <div className="border border-ink/10 bg-cream/30 p-4 md:p-5 mb-6">
      <div className="flex items-baseline justify-between mb-3">
        <div>
          <p className="font-body text-caption uppercase tracking-widest text-ink/50">
            A small shout-out
          </p>
          <p className="font-display text-base text-ink mt-1">
            {snap.buyer_name}
          </p>
        </div>
        <div className="text-right">
          <p className="font-display text-h3 text-ink leading-none tabular-nums">
            Day {dayN}<span className="text-ink/40 text-sm font-normal"> / 50</span>
          </p>
          <p className="font-body text-caption uppercase tracking-widest text-ink/50 mt-1">
            {snap.streak === 0
              ? 'Show them what you got'
              : snap.streak === 1
              ? '1 day in a row'
              : `${snap.streak} days in a row`}
          </p>
        </div>
      </div>

      {/* Nine-cell strip of today's habits — no labels on the small
          cells, just coloured to show done / not-done. Hovering on a
          cell shows the habit name in a tooltip. We never expose the
          buyer's individual habit log, food log, water log, weight,
          or macros here — just the line. */}
      <div
        className="grid grid-cols-9 gap-1.5"
        role="img"
        aria-label={`${snap.buyer_name} is on day ${dayN} of 50, ${snap.done_today.length} of 9 habits done today`}
      >
        {snap.habit_ids.map((id) => {
          const done = doneSet.has(id);
          return (
            <div
              key={id}
              title={`${HABIT_LABEL[id] || id}${done ? ' · done' : ''}`}
              className={`aspect-square rounded-sm ${
                done
                  ? 'bg-teal'
                  : 'border border-ink/15 bg-paper/40'
              }`}
              aria-label={HABIT_LABEL[id] || id}
            />
          );
        })}
      </div>

      <p className="font-body text-caption uppercase tracking-widest text-ink/50 mt-3">
        {snap.done_today.length} of 9 today
        {' · '}
        {remaining} days left
      </p>
    </div>
  );
}
