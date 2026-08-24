'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * Layout state for /account. Two pieces:
 *
 *   1. `order` -- the render order of the middle sections. Premium-only
 *      feature: the user drags a section header to reorder.
 *
 *   2. `collapsed` -- per-section collapse state.
 *
 * Persistence: keys are scoped by user id so two users sharing the
 * same browser keep their own layout. `null` user (signed out) keeps
 * a separate shared key so we don't crash. On signout the page clears
 * the hook's loaded state so the next signed-in user doesn't briefly
 * see the previous user's order.
 */

const ORDER_KEY = (uid: string | null) =>
  uid ? `fit50-account-section-order-${uid}` : 'fit50-account-section-order';
const COLLAPSED_KEY = (uid: string | null) =>
  uid
    ? `fit50-account-section-collapsed-${uid}`
    : 'fit50-account-section-collapsed';

export const DEFAULT_ORDER: string[] = [
  'tracker',
  'my-motivator',
  'buddy',
  'feed-your-brain',
  'timer',
  'workouts',
  'macro-calc',
  'hydration',
  'food-database',
  'todo',
  'board',
];

function loadOrder(uid: string | null): string[] {
  if (typeof window === 'undefined') return DEFAULT_ORDER;
  try {
    const raw = window.localStorage.getItem(ORDER_KEY(uid));
    if (!raw) return DEFAULT_ORDER;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_ORDER;
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

function loadCollapsed(uid: string | null): Record<string, boolean> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(COLLAPSED_KEY(uid));
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed as Record<string, boolean>;
  } catch {
    return {};
  }
}

function saveOrder(order: string[], uid: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(ORDER_KEY(uid), JSON.stringify(order));
  } catch {
    // ignore (private mode, quota, etc.)
  }
}

function saveCollapsed(
  collapsed: Record<string, boolean>,
  uid: string | null
): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(COLLAPSED_KEY(uid), JSON.stringify(collapsed));
  } catch {
    // ignore
  }
}

/**
 * @param userId  The signed-in user's id. Pass `null` for the
 *                signed-out state -- the layout still works, it just
 *                doesn't survive a sign-in/out cycle for that
 *                browser session.
 */
export function useAccountLayout(userId: string | null) {
  const [order, setOrder] = useState<string[]>(DEFAULT_ORDER);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  // Hydrate when the hook mounts AND whenever the active user id
  // changes -- so signing in as a different user loads their own
  // layout, not the previous one.
  useEffect(() => {
    setOrder(loadOrder(userId));
    setCollapsed(loadCollapsed(userId));
  }, [userId]);

  useEffect(() => {
    saveOrder(order, userId);
  }, [order, userId]);

  useEffect(() => {
    saveCollapsed(collapsed, userId);
  }, [collapsed, userId]);

  const moveSection = useCallback((from: number, to: number) => {
    setOrder((prev) => {
      if (from < 0 || from >= prev.length) return prev;
      if (to < 0 || to >= prev.length) return prev;
      if (from === to) return prev;
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
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
    moveSection,
    reset,
    toggleCollapse,
    collapseAll,
    expandAll,
    indexOf,
    isCollapsed,
  };
}