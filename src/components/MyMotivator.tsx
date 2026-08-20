'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase';
import HabitIcon, { HabitIconName } from '@/components/HabitIcon';

interface MateSnapshot {
  // Display name of the other half of the pair (the buyer if signed in
  // as the buddy, the buddy if signed in as the buyer).
  mate_name: string;
  // Their current day in the 50-day challenge.
  current_day: number;
  // Their streak — consecutive past days with at least one completed habit.
  streak: number;
  // Their habits done today. Used to render the 9-cell strip — no food,
  // water, weight, macros. Just the line.
  done_today: string[];
  // Fixed 9-cell order so the strip is the same layout every render.
  habit_ids: string[];
  // Their premium flag — not surfaced, but kept for parity.
  is_premium: boolean;
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

export default function MyMotivator() {
  const { user, profile } = useAuth();
  const [snap, setSnap] = useState<MateSnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  // The "other half" of the pair. Either:
  //   - profile.purchased_by_user_id (buddy view → buyer's id), or
  //   - profile.buddy_user_id (buyer view → buddy's id).
  // These are normally mutually exclusive — a user is either the
  // gifter or the giftee, not both.
  const mateId = profile?.purchased_by_user_id ?? profile?.buddy_user_id ?? null;

  const fetchRef = useRef<() => Promise<void>>(async () => {});

  useEffect(() => {
    if (!user || !mateId) {
      setSnap(null);
      setLoading(false);
      return;
    }
    const supabase = createClient();
    if (!supabase) return;

    let cancelled = false;
    setLoading(true);

    const doFetch = async () => {
      try {
        // 1. Mate's profile — name and challenge start.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: mp } = await (supabase.from('profiles') as any)
          .select('display_name, is_premium, challenge_started_at')
          .eq('id', mateId)
          .maybeSingle();

        // 2. Mate's tracker progress.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: tps } = await (supabase.from('tracker_progress') as any)
          .select('day, habit_id, completed')
          .eq('user_id', mateId)
          .order('day', { ascending: false })
          .limit(60);

        if (cancelled) return;

        const startIso = mp?.challenge_started_at as string | null;
        const startMs = startIso ? new Date(startIso).getTime() : null;
        const elapsedDays = startMs
          ? Math.floor((Date.now() - startMs) / 86_400_000) + 1
          : 0;
        const currentDay = Math.max(1, Math.min(50, elapsedDays));

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

        // Streak: walk backwards from currentDay - 1, counting consecutive
        // days with at least one completed habit. Current day doesn't
        // count toward streak if not yet finished.
        let streak = 0;
        for (let d = currentDay - 1; d >= 1; d--) {
          if (completedDays.has(d)) streak++;
          else break;
        }

        setSnap({
          mate_name: (mp?.display_name as string) || 'Your mate',
          current_day: currentDay,
          streak,
          done_today: todayDone,
          habit_ids: HABIT_ORDER,
          is_premium: !!mp?.is_premium,
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
    // day-rollover updates the card. Also re-fetch on focus.
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
  }, [user, mateId]);

  if (!user || !mateId) return null;
  if (loading && !snap) {
    return (
      <div className="max-w-7xl mx-auto px-6 md:px-10 mb-6">
        <div className="border border-ink/10 bg-cream/30 p-4 md:p-5">
          <p className="font-body text-caption uppercase tracking-widest text-ink/50">
            Keep &apos;em honest and keep &apos;em motivated
          </p>
          <p className="font-body text-sm text-ink/40 mt-1">Loading…</p>
        </div>
      </div>
    );
  }
  if (!snap) return null;

  const doneSet = new Set(snap.done_today);
  const dayN = Math.min(50, Math.max(1, snap.current_day));
  const remaining = Math.max(0, 50 - dayN);

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-10 mb-6">
      <div className="border border-ink/10 bg-cream/30 p-4 md:p-5">
        <div className="flex items-baseline justify-between mb-3">
          <div>
            <p className="font-body text-caption uppercase tracking-widest text-ink/50">
              Keep &apos;em honest and keep &apos;em motivated
            </p>
            <p className="font-display text-base text-ink mt-1">
              {snap.mate_name}
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

        {/* Nine-cell strip — icons fill the squares. Done = full-colour
            icon on teal. Not done = muted + grayscale icon on paper.
            We never expose the mate's food log, water log, weight, or
            macros here — just the line. */}
        <div
          className="grid grid-cols-9 gap-1.5"
          role="img"
          aria-label={`${snap.mate_name} is on day ${dayN} of 50, ${snap.done_today.length} of 9 habits done today`}
        >
          {snap.habit_ids.map((id) => {
            const done = doneSet.has(id);
            return (
              <div
                key={id}
                title={`${HABIT_LABEL[id] || id}${done ? ' · done' : ''}`}
                className={`aspect-square rounded-sm flex items-center justify-center p-1.5 ${
                  done
                    ? 'bg-teal'
                    : 'border border-ink/15 bg-paper/40'
                }`}
                aria-label={HABIT_LABEL[id] || id}
              >
                <HabitIcon
                  name={id as HabitIconName}
                  size={64}
                  className={`w-full h-full ${done ? 'opacity-100' : 'opacity-30 grayscale'}`}
                />
              </div>
            );
          })}
        </div>

        <p className="font-body text-caption uppercase tracking-widest text-ink/50 mt-3">
          {snap.done_today.length} of 9 today
          {' · '}
          {remaining} days left
        </p>
      </div>
    </div>
  );
}
