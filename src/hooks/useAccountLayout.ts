'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * Layout state for /account. Two pieces:
 *
 *   1. `order` — the render order of the middle sections. Premium-only
 *      feature: the "Edit layout" toggle on the page lets the user
 *      drag the sections up/down. Persists to localStorage.
 *
 *   2. `collapsed` — per-section collapse state. Any signed-in user
 *      can collapse a section to keep the page manageable. Persists
 *      to localStorage alongside `order`.
 *
 * The hook hydrates from localStorage on mount so SSR and the first
 * client render agree (avoiding the visible flicker you'd get if
 * the user had previously collapsed e.g. Buddy and Buddy rendered
 * for one frame before folding).
 */

const ORDER_KEY = 'fit50-account-section-order';
const COLLAPSED_KEY = 'fit50-account-section-collapsed';

export const DEFAULT_ORDER: string[] = [
  'tracker',
  'my-motivator',
  'buddy',
  'feed-your-brain',
  'workouts',
  'macro-calc',
  'hydration',
  'food-database',
  'todo',
  'board',
];

function loadOrder(): string[] {
  if (typeof window === 'undefined') return DEFAULT_ORDER;
  try {
    const raw = window.localStorage.getItem(ORDER_KEY);
    if (!raw) return DEFAULT_ORDER;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_ORDER;
    // Keep any stored ids that are still in DEFAULT_ORDER, drop the
    // rest, then append any default ids the stored list is missing
    // (e.g. a new section we shipped after their last visit).
    const known = new Set(DEFAULT_ORDER);
    const merged: string[] = [];
    for (const id of parsed) {
      if (known.has(id) && !merged.includes(id)) merged.push(id);
    }
    for (const id of DEFAULT_ORDER) {
      if (!merged.includes(id)) merged.push(id);
    }
    return merged;
  } catch {
    return DEFAULT_ORDER;
  }
}

function loadCollapsed(): Record<string, boolean> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(COLLAPSED_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed as Record<string, boolean>;
  } catch {
    return {};
  }
}

function saveOrder(order: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(ORDER_KEY, JSON.stringify(order));
  } catch {
    // ignore (private mode, quota, etc.)
  }
}

function saveCollapsed(collapsed: Record<string, boolean>): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(COLLAPSED_KEY, JSON.stringify(collapsed));
  } catch {
    // ignore
  }
}

export function useAccountLayout() {
  const [order, setOrder] = useState<string[]>(DEFAULT_ORDER);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    setOrder(loadOrder());
    setCollapsed(loadCollapsed());
  }, []);

  useEffect(() => {
    saveOrder(order);
  }, [order]);

  useEffect(() => {
    saveCollapsed(collapsed);
  }, [collapsed]);

  const move = useCallback((id: string, direction: 'up' | 'down') => {
    setOrder((prev) => {
      const idx = prev.indexOf(id);
      if (idx === -1) return prev;
      const swap = direction === 'up' ? idx - 1 : idx + 1;
      if (swap < 0 || swap >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[swap]] = [next[swap], next[idx]];
      return next;
    });
  }, []);

  const reset = useCallback(() => setOrder(DEFAULT_ORDER), []);

  const toggleCollapse = useCallback((id: string) => {
    setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const collapseAll = useCallback(() => {
    setCollapsed((prev) => {
      const next = { ...prev };
      for (const id of DEFAULT_ORDER) next[id] = true;
      return next;
    });
  }, []);

  const expandAll = useCallback(() => setCollapsed({}), []);

  const indexOf = useCallback(
    (id: string) => order.indexOf(id),
    [order]
  );

  const isCollapsed = useCallback(
    (id: string) => collapsed[id] === true,
    [collapsed]
  );

  return {
    order,
    editing,
    setEditing,
    move,
    reset,
    indexOf,
    toggleCollapse,
    collapseAll,
    expandAll,
    isCollapsed,
  };
}