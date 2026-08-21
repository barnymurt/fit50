'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase';
import { loadJson, saveJson } from '@/lib/storage';
import { TRACKER_RESET_EVENT } from './useTrackerState';
import { dateKeyLocal } from '@/lib/dates';

export type BookFormat = 'read' | 'listen';

export interface BookEntry {
  date: string;
  title: string;
  format: BookFormat;
}

const STORAGE_KEY = 'fit50-book-log-v1';

function todayKey(): string {
  return dateKeyLocal(new Date());
}

/**
 * Book log for the Feed Your Brain rule. One entry per day — the user
 * tells us what they're reading/listening to, that gets saved under
 * today's date. The certificate shows distinct titles.
 *
 * Anon: localStorage only. Auth: Supabase book_log with localStorage
 * as the offline mirror.
 */
export function useBookLog() {
  const { user } = useAuth();
  const supabase = createClient();
  const [entries, setEntries] = useState<BookEntry[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!user || !supabase) {
      const saved = loadJson<BookEntry[]>(STORAGE_KEY, []);
      setEntries(saved);
      setHydrated(true);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await (supabase.from('book_log') as any)
          .select('date_key, title, format')
          .order('date_key', { ascending: true });
        if (error) throw error;
        if (cancelled) return;
        const list: BookEntry[] = (data || []).map(
          (r: { date_key: string; title: string; format: BookFormat }) => ({
            date: r.date_key,
            title: r.title,
            format: r.format,
          })
        );
        setEntries(list);
        saveJson(STORAGE_KEY, list);
      } catch (err) {
        console.error('book_log fetch failed:', err);
        if (!cancelled) {
          const saved = loadJson<BookEntry[]>(STORAGE_KEY, []);
          setEntries(saved);
        }
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, supabase]);

  useEffect(() => {
    if (!hydrated) return;
    saveJson(STORAGE_KEY, entries);
    if (user && supabase) {
      (async () => {
        const rows = entries.map((e) => ({
          user_id: user.id,
          date_key: e.date,
          title: e.title,
          format: e.format,
        }));
        if (rows.length === 0) return;
        const { error } = await (supabase.from('book_log') as any)
          .upsert(rows, {
            onConflict: 'user_id,date_key,title,format',
          });
        if (error) console.error('book_log sync failed:', error);
      })();
    }
  }, [entries, hydrated, user, supabase]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onReset = () => {
      setEntries([]);
    };
    window.addEventListener(TRACKER_RESET_EVENT, onReset);
    return () => window.removeEventListener(TRACKER_RESET_EVENT, onReset);
  }, []);

  const today = todayKey();
  const todaysEntries = entries.filter((e) => e.date === today);
  const currentBook: BookEntry | null =
    todaysEntries.length > 0 ? todaysEntries[todaysEntries.length - 1] : null;

  // Distinct titles, ordered by first date seen (oldest first).
  const booksByTitle = (() => {
    const seen = new Map<string, BookEntry>();
    for (const e of entries) {
      const k = e.title.trim().toLowerCase();
      if (!k) continue;
      if (!seen.has(k)) seen.set(k, e);
    }
    return Array.from(seen.values());
  })();

  const setCurrentBook = useCallback(
    (title: string, format: BookFormat) => {
      const clean = title.trim();
      if (!clean) return;
      setEntries((p) => {
        // Replace any entries already on today with this title.
        const others = p.filter((e) => e.date !== today);
        return [...others, { date: today, title: clean, format }];
      });
    },
    [today]
  );

  const removeBook = useCallback((title: string, format: BookFormat) => {
    const k = title.trim().toLowerCase();
    setEntries((p) => p.filter((e) => !(e.title.trim().toLowerCase() === k && e.format === format)));
  }, []);

  return {
    entries,
    hydrated,
    today,
    currentBook,
    todaysEntries,
    booksByTitle,
    setCurrentBook,
    removeBook,
  };
}