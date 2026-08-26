'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase';
import HabitIcon, { HabitIconName } from '@/components/HabitIcon';

interface BuddyPairRow {
  id: string;
  buddy_user_id: string;
  hidden_at: string | null;
}

interface BuddyProfile {
  id: string;
  display_name: string | null;
  is_premium: boolean;
  challenge_started_at: string | null;
}

interface BuddyGrid {
  // habit_id -> completed, for the current day only
  doneToday: Record<string, boolean>;
  // consecutive past days with at least one completed habit
  streak: number;
}

interface BuddyCard {
  pairId: string;
  buddyId: string;
  name: string;
  currentDay: number;
  streak: number;
  doneToday: number;
  habitIds: string[];
  isPremium: boolean;
}

// Fixed 9-cell order so the strip is the same layout every render.
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

function computeCurrentDay(startIso: string | null): number {
  if (!startIso) return 1;
  const startMs = new Date(startIso).getTime();
  if (Number.isNaN(startMs)) return 1;
  const elapsedDays = Math.floor((Date.now() - startMs) / 86_400_000) + 1;
  return Math.max(1, Math.min(50, elapsedDays));
}

function computeStreak(
  dailyTotals: Array<{ day_number: number; habit_id: string; completed: boolean }>,
  currentDay: number
): number {
  const completedDays = new Set<number>();
  for (const r of dailyTotals) {
    if (r.completed) completedDays.add(r.day_number);
  }
  // Walk backwards from currentDay - 1, counting consecutive days
  // with at least one completed habit. Current day doesn't count
  // toward streak if not yet finished.
  let streak = 0;
  for (let d = currentDay - 1; d >= 1; d--) {
    if (completedDays.has(d)) streak++;
    else break;
  }
  return streak;
}

function pickDoneToday(
  dailyTotals: Array<{ day_number: number; habit_id: string; completed: boolean }>,
  currentDay: number
): Record<string, boolean> {
  const out: Record<string, boolean> = {};
  for (const r of dailyTotals) {
    if (r.day_number === currentDay && r.completed) {
      out[r.habit_id] = true;
    }
  }
  return out;
}

export default function MyMotivator() {
  const { user } = useAuth();
  const [cards, setCards] = useState<BuddyCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPairId, setSelectedPairId] = useState<string | null>(null);
  const [hideError, setHideError] = useState<string | null>(null);
  const [hidingId, setHidingId] = useState<string | null>(null);
  const carouselRef = useRef<HTMLDivElement | null>(null);

  // Fetch every active (non-hidden) pair I own + the buddy's profile +
  // daily_totals. Re-fetched on visibility change and every 60s so
  // day-rollover refreshes the cards.
  useEffect(() => {
    if (!user) {
      setCards([]);
      setLoading(false);
      return;
    }
    const supabase = createClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const doFetch = async () => {
      try {
        // 1. Active pairs for the current user.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: pairRows, error: pairsErr } = await (supabase
          .from('buddy_pairs') as any)
          .select('id, buddy_user_id, hidden_at')
          .eq('user_id', user.id)
          .is('hidden_at', null);

        if (pairsErr) throw pairsErr;
        const pairs = (pairRows || []) as BuddyPairRow[];
        if (pairs.length === 0) {
          if (!cancelled) {
            setCards([]);
            setLoading(false);
          }
          return;
        }

        const buddyIds = Array.from(new Set(pairs.map((p) => p.buddy_user_id)));

        // 2. Buddy profiles (display_name, is_premium, challenge_start).
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: profileRows, error: profsErr } = await (supabase
          .from('profiles') as any)
          .select('id, display_name, is_premium, challenge_started_at')
          .in('id', buddyIds);

        if (profsErr) throw profsErr;
        const profiles = new Map<string, BuddyProfile>(
          ((profileRows || []) as BuddyProfile[]).map((p) => [p.id, p])
        );

        // 3. Buddy daily_totals — buddy-pair RLS now lets us read these
        // (the 0022 migration adds the cross-account policy).
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: dailyRows, error: dailyErr } = await (supabase
          .from('daily_totals') as any)
          .select('user_id, day_number, habit_id, completed')
          .in('user_id', buddyIds);

        if (dailyErr) throw dailyErr;
        const dailiesByBuddy = new Map<string, Array<{ day_number: number; habit_id: string; completed: boolean }>>();
        for (const r of (dailyRows || []) as Array<{ user_id: string; day_number: number; habit_id: string; completed: boolean }>) {
          if (!dailiesByBuddy.has(r.user_id)) dailiesByBuddy.set(r.user_id, []);
          dailiesByBuddy.get(r.user_id)!.push(r);
        }

        if (cancelled) return;

        // Build cards. Preserve pair ordering from the SELECT (which
        // we sort by created_at desc below) so the carousel order is
        // stable across refreshes.
        const built: BuddyCard[] = pairs
          .map((p): BuddyCard | null => {
            const profile = profiles.get(p.buddy_user_id);
            if (!profile) return null;
            const buddyRows = dailiesByBuddy.get(p.buddy_user_id) || [];
            const currentDay = computeCurrentDay(profile.challenge_started_at);
            const doneToday = pickDoneToday(buddyRows, currentDay);
            const streak = computeStreak(buddyRows, currentDay);
            return {
              pairId: p.id,
              buddyId: p.buddy_user_id,
              name: profile.display_name || 'Your buddy',
              currentDay,
              streak,
              doneToday: Object.values(doneToday).filter(Boolean).length,
              habitIds: HABIT_ORDER,
              isPremium: !!profile.is_premium,
            };
          })
          .filter((c): c is BuddyCard => c !== null);

        if (!cancelled) {
          setCards(built);
          setLoading(false);
        }
      } catch (err) {
        console.error('MyMotivator fetch failed:', err);
        if (!cancelled) {
          setCards([]);
          setLoading(false);
        }
      }
    };

    doFetch();
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
  }, [user]);

  // Arrow-button carousel: scroll the container left/right by one
  // card width. Snap back to nearest card when the user releases.
  const scrollByCards = useCallback((dir: 1 | -1) => {
    const el = carouselRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>('[data-buddy-card]');
    const step = card ? card.offsetWidth + 16 : el.clientWidth - 48;
    el.scrollBy({ left: step * dir, behavior: 'smooth' });
  }, []);

  // Hide handler — soft delete (sets hidden_at on the row the user
  // owns). Server route keeps the RLS boundary intact.
  const handleHide = useCallback(
    async (pairId: string) => {
      if (hidingId) return;
      setHideError(null);
      setHidingId(pairId);
      try {
        const res = await fetch('/api/buddy/hide', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pair_id: pairId }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.error || `HTTP ${res.status}`);
        }
        // Remove the card from the carousel optimistically.
        setCards((prev) => prev.filter((c) => c.pairId !== pairId));
        setSelectedPairId(null);
      } catch (err) {
        setHideError(err instanceof Error ? err.message : 'Could not hide.');
      } finally {
        setHidingId(null);
      }
    },
    [hidingId]
  );

  // Close modal on Escape.
  useEffect(() => {
    if (!selectedPairId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedPairId(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedPairId]);

  // Lock body scroll while modal open.
  useEffect(() => {
    if (!selectedPairId) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [selectedPairId]);

  const selectedCard = useMemo(
    () => cards.find((c) => c.pairId === selectedPairId) || null,
    [cards, selectedPairId]
  );

  if (!user) return null;

  // Don't render anything until we've actually fetched — avoids a flash
  // of "no buddies" before the first response lands.
  if (loading && cards.length === 0) {
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

  if (cards.length === 0) return null;

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-10 mb-6">
      <div className="border border-ink/10 bg-cream/30 p-4 md:p-5">
        <p className="font-body text-caption uppercase tracking-widest text-ink/50 mb-3">
          Keep &apos;em honest and keep &apos;em motivated
        </p>

        {/* Arrow buttons + horizontal-scroll carousel. Each card is
            clickable and opens the detail modal. */}
        <div className="relative">
          {cards.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => scrollByCards(-1)}
                aria-label="Previous buddy"
                className="hidden md:flex absolute -left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 items-center justify-center bg-paper border border-ink/20 hover:border-coral hover:text-coral text-ink/60 transition-colors"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={() => scrollByCards(1)}
                aria-label="Next buddy"
                className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 items-center justify-center bg-paper border border-ink/20 hover:border-coral hover:text-coral text-ink/60 transition-colors"
              >
                ›
              </button>
            </>
          )}

          <div
            ref={carouselRef}
            className="flex gap-3 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-2 -mx-1 px-1"
            style={{ scrollbarWidth: 'thin' }}
          >
            {cards.map((c) => (
              <BuddySummaryCard
                key={c.pairId}
                card={c}
                onOpen={() => setSelectedPairId(c.pairId)}
              />
            ))}
          </div>
        </div>
      </div>

      {selectedCard && (
        <BuddyDetailModal
          card={selectedCard}
          onClose={() => {
            setSelectedPairId(null);
            setHideError(null);
          }}
          onHide={() => handleHide(selectedCard.pairId)}
          hiding={hidingId === selectedCard.pairId}
          hideError={hideError}
        />
      )}
    </div>
  );
}

// ---------- Summary card in the carousel ----------

function BuddySummaryCard({
  card,
  onOpen,
}: {
  card: BuddyCard;
  onOpen: () => void;
}) {
  const dayN = Math.min(50, Math.max(1, card.currentDay));
  return (
    <button
      type="button"
      data-buddy-card
      onClick={onOpen}
      className="snap-start shrink-0 w-[260px] sm:w-[280px] text-left bg-paper border border-ink/15 p-4 hover:border-coral transition-colors"
    >
      <p className="font-body text-caption uppercase tracking-widest text-ink/50 mb-1">
        Day {dayN} of 50
      </p>
      <p className="font-display text-h3 text-ink leading-tight break-words">
        {card.name}
      </p>
      <div className="flex items-baseline justify-between mt-3">
        <p className="font-body text-sm text-ink/70 tabular-nums">
          {card.doneToday} of 9 today
        </p>
        <p className="font-body text-caption uppercase tracking-widest text-ink/40">
          {card.streak === 0
            ? 'No streak'
            : card.streak === 1
            ? '1 in a row'
            : `${card.streak} in a row`}
        </p>
      </div>
    </button>
  );
}

// ---------- Detail modal ----------

function BuddyDetailModal({
  card,
  onClose,
  onHide,
  hiding,
  hideError,
}: {
  card: BuddyCard;
  onClose: () => void;
  onHide: () => void;
  hiding: boolean;
  hideError: string | null;
}) {
  const dayN = Math.min(50, Math.max(1, card.currentDay));
  const remaining = Math.max(0, 50 - dayN);
  return (
    <div
      className="fixed inset-0 z-50 bg-ink/40 flex items-end md:items-center justify-center md:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Buddy detail: ${card.name}`}
    >
      <div
        className="bg-paper w-full md:max-w-lg border border-ink/15 max-h-[90vh] overflow-y-auto pb-[max(1rem,env(safe-area-inset-bottom))]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 pt-6 pb-2">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div>
              <p className="font-body text-caption uppercase tracking-widest text-ink/50 mb-1">
                Day {dayN} of 50
              </p>
              <h3 className="font-display text-h2 text-ink leading-tight break-words">
                {card.name}
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="font-body text-caption uppercase text-ink/40 hover:text-ink px-2 py-1 transition-colors shrink-0"
            >
              ✕
            </button>
          </div>

          <p className="font-body text-sm text-ink/65 mb-4">
            {card.streak === 0
              ? 'Show them what you got'
              : card.streak === 1
              ? '1 day in a row'
              : `${card.streak} days in a row`}
            {' · '}
            {remaining} days left
          </p>

          {/* Nine-cell strip — full detail. The summary card only carries
              a count; we re-fetch the per-habit truth here so the
              modal can show which specific cells are done. */}
          <BuddyDetailGrid buddyId={card.buddyId} habitIds={card.habitIds} />

          {hideError && (
            <p className="font-body text-caption text-coral mt-4">{hideError}</p>
          )}

          <div className="flex flex-col sm:flex-row gap-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-ink text-paper font-body text-caption uppercase tracking-widest px-4 py-3"
            >
              Done
            </button>
            <button
              type="button"
              onClick={onHide}
              disabled={hiding}
              className="font-body text-caption uppercase tracking-widest text-ink/40 hover:text-coral border border-ink/20 px-4 py-3 transition-colors disabled:opacity-50"
            >
              {hiding ? 'Hiding…' : 'Hide this buddy'}
            </button>
          </div>
          <p className="font-body text-caption text-ink/40 mt-3">
            Hiding is reversible — go to{' '}
            <a href="/account/buddy" className="underline">
              the buddy dashboard
            </a>{' '}
            to unhide.
          </p>
        </div>
      </div>
    </div>
  );
}

// Fallback set the placeholder cells use — without it the summary
// stub renders all-grey cells. The real per-habit data is fetched by
// BuddyDetailGrid below.
const HABIT_DONE_FALLBACK_DONE = new Set<string>();

// ---------- Modal-only grid that fetches the per-habit truth ----------
// The summary card only carries a count. The modal re-fetches the
// buddy's daily_totals for the current day and renders the real
// 9-cell grid (which cells are done vs not).
function BuddyDetailGrid({
  buddyId,
  habitIds,
}: {
  buddyId: string;
  habitIds: string[];
}) {
  const [doneSet, setDoneSet] = useState<Set<string> | null>(null);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      setDoneSet(new Set());
      return;
    }
    let cancelled = false;
    // Read the buddy's profile to compute today's day number; read
    // daily_totals for that day to know which cells are done.
    (async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profile } = await (supabase.from('profiles') as any)
        .select('challenge_started_at')
        .eq('id', buddyId)
        .maybeSingle();
      const currentDay = computeCurrentDay(
        (profile?.challenge_started_at as string | null) ?? null
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: rows } = await (supabase.from('daily_totals') as any)
        .select('day_number, habit_id, completed')
        .eq('user_id', buddyId)
        .eq('day_number', currentDay);
      if (cancelled) return;
      const s = new Set<string>();
      for (const r of (rows || []) as Array<{ habit_id: string; completed: boolean }>) {
        if (r.completed) s.add(r.habit_id);
      }
      setDoneSet(s);
    })();
    return () => {
      cancelled = true;
    };
  }, [buddyId]);

  if (!doneSet) {
    // Skeleton while the modal's per-habit data loads.
    return (
      <div className="grid grid-cols-9 gap-1.5 mt-1" aria-hidden="true">
        {habitIds.map((id) => (
          <div
            key={id}
            className="aspect-square rounded-sm border border-ink/15 bg-paper/40"
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className="grid grid-cols-9 gap-1.5 mt-1"
      role="img"
      aria-label="Today's habit grid"
    >
      {habitIds.map((id) => {
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
  );
}