'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePremium } from './usePremium';
import { createClient } from '@/lib/supabase';
import { TRACKER_RESET_EVENT } from './useTrackerState';

interface Protection {
  id: string;
  week_start_date: string;
  redeemed_day: number;
}

function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getUTCDay();
  const diff = d.getUTCDate() - day;
  d.setUTCDate(diff);
  return d.toISOString().split('T')[0];
}

export function useStreakProtection() {
  const { user } = useAuth();
  const { isPremium } = usePremium();
  const supabase = createClient();
  const [protections, setProtections] = useState<Protection[]>([]);
  const [loaded, setLoaded] = useState(false);

  const fetchProtections = useCallback(async () => {
    if (!user || !supabase) {
      setProtections([]);
      setLoaded(true);
      return;
    }
    const { data, error } = await supabase
      .from('streak_protections')
      .select('id, week_start_date, redeemed_day')
      .eq('user_id', user.id);
    if (error) {
      console.error('Failed to fetch protections:', error);
      setLoaded(true);
      return;
    }
    setProtections((data as Protection[]) || []);
    setLoaded(true);
  }, [user, supabase]);

  useEffect(() => {
    if (!user || !isPremium || !supabase) {
      setProtections([]);
      setLoaded(true);
      return;
    }
    fetchProtections();
  }, [user, isPremium, supabase, fetchProtections]);

  // After a full Reset, the server-side streak_protections rows have
  // been wiped but our local `protections` cache hasn't refreshed.
  // The streak card was reporting 'Used this week.' until the user
  // logged out and back in. Listen for the reset event and refetch.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onReset = () => {
      if (!user || !isPremium) return;
      fetchProtections();
    };
    window.addEventListener(TRACKER_RESET_EVENT, onReset);
    return () => window.removeEventListener(TRACKER_RESET_EVENT, onReset);
  }, [user, isPremium, fetchProtections]);

  const hasProtectionForWeek = useCallback(
    (date: Date): boolean => {
      const weekStart = getWeekStart(date);
      return protections.some((p) => p.week_start_date === weekStart);
    },
    [protections]
  );

  const getProtectedDays = useCallback((): number[] => {
    return protections.map((p) => p.redeemed_day);
  }, [protections]);

  const redeemProtection = useCallback(
    async (day: number): Promise<boolean> => {
      if (!user || !isPremium || !supabase) return false;

      const now = new Date();
      const weekStart = getWeekStart(now);

      if (hasProtectionForWeek(now)) {
        return false;
      }

      const { error } = await supabase.from('streak_protections').insert({
        user_id: user.id,
        week_start_date: weekStart,
        redeemed_day: day,
      });

      if (error) {
        console.error('Failed to redeem protection:', error);
        return false;
      }

      await fetch();
      return true;
    },
    [user, isPremium, hasProtectionForWeek, supabase]
  );

  const fetch = useCallback(async () => {
    if (!user || !supabase) return;
    const { data } = await supabase
      .from('streak_protections')
      .select('id, week_start_date, redeemed_day')
      .eq('user_id', user.id);
    setProtections((data as Protection[]) || []);
  }, [user, supabase]);

  const totalUsed = protections.length;

  return {
    protections,
    loaded,
    hasProtectionForWeek,
    getProtectedDays,
    redeemProtection,
    totalUsed,
  };
}
