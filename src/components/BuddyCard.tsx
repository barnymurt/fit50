'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase';

interface BuddyStatus {
  activated: boolean;
  buddy_name?: string;
  buddy_day?: number;
  is_premium?: boolean;
}

interface BuddyActivation {
  pending: boolean;
  email?: string;
  name?: string;
  expires_at?: string;
}

export default function BuddyCard() {
  const { user, profile } = useAuth();
  const [status, setStatus] = useState<BuddyStatus | null>(null);
  const [pending, setPending] = useState<BuddyActivation | null>(null);

  useEffect(() => {
    if (!user || !profile?.buddy_user_id) {
      setStatus({ activated: false });
      return;
    }
    const supabase = createClient();
    if (!supabase) return;

    supabase
      .from('profiles')
      .select('display_name, is_premium')
      .eq('id', profile.buddy_user_id)
      .maybeSingle()
      .then(({ data: buddy }: { data: { display_name: string | null; is_premium: boolean } | null }) => {
        if (!buddy) {
          setStatus({ activated: false });
          return;
        }
        // Buddy's tracker progress — current day + completion count.
        supabase
          .from('tracker_progress')
          .select('day, completed')
          .eq('user_id', profile.buddy_user_id)
          .order('day', { ascending: false })
          .limit(50)
          .then(({ data: tps }: { data: Array<{ day: number; completed: boolean }> | null }) => {
            const completedDays = (tps ?? [])
              .filter((r) => r.completed)
              .map((r) => r.day);
            const buddyDay = completedDays.length
              ? Math.max(...completedDays)
              : 0;
            setStatus({
              activated: true,
              buddy_name: (buddy.display_name as string) || 'Your buddy',
              buddy_day: buddyDay,
              is_premium: buddy.is_premium as boolean,
            });
          });
      });

    // Check for pending purchases (purchaser's outgoing buddy invite).
    if (profile.id) {
      supabase
        .from('buddy_purchases')
        .select('id, buddy_email, buddy_name, expires_at, status')
        .eq('purchaser_user_id', profile.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
        .then(({ data: p }: { data: { buddy_email: string; buddy_name: string; expires_at: string } | null }) => {
          if (p) {
            setPending({
              pending: true,
              email: p.buddy_email,
              name: p.buddy_name,
              expires_at: p.expires_at,
            });
          } else {
            setPending({ pending: false });
          }
        });
    }
  }, [user, profile]);

  if (!status) return null;

  if (status.activated && status.buddy_name) {
    return (
      <div className="border border-ink/10 bg-cream/30 p-4 mb-6 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="font-body text-caption uppercase tracking-widest text-ink/50 mb-1">
            Your buddy
          </p>
          <p className="font-display text-base text-ink truncate">{status.buddy_name}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="font-display text-h3 text-ink leading-none tabular-nums">
            Day {status.buddy_day}
          </p>
          <p className="font-body text-caption uppercase text-ink/50 mt-1">
            {status.buddy_day === 0 ? 'Hasn\u2019t started' : 'On track'}
          </p>
        </div>
      </div>
    );
  }

  if (pending?.pending) {
    return (
      <div className="border border-ink/10 bg-cream/30 p-4 mb-6">
        <p className="font-body text-caption uppercase tracking-widest text-coral mb-1">
          Buddy pending
        </p>
        <p className="font-body text-base text-ink/80">
          We emailed your invite to{' '}
          <span className="font-medium">{pending.email}</span>. They have 14 days to
          activate. Check the{' '}
          <a href="/account/buddy" className="underline text-coral">
            buddy dashboard
          </a>{' '}
          for resend.
        </p>
      </div>
    );
  }

  return null;
}
