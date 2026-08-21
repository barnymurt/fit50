'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * Layout state for /account. Two pieces:
 *
 *   1. `order` — the render order of the middle sections. Premium-only
 *      feature: the user drags a section header to reorder. Persists
 *      to localStorage.
 *
 *   2. `collapsed` — per-section collapse state. Any signed-in user
 *      can collapse a section to keep the page manageable. Persists
 *      to localStorage alongside `order`.
 *
 * Reorder happens directly on the section header — click and drag up
 * or down. There's no separate "edit mode" toggle because the drag
 * affordance itself is the indicator that this is interactive.
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

  // Move the section at `from` to position `to`. No-op for invalid
  // indices so a stray drop event can't corrupt the order.
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