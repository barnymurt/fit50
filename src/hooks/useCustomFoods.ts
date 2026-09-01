'use client';

// Shared state for the user's custom foods. Used by FoodSearch
// (merge into ranked results + "Add custom food" button) and by
// MyCustomFoodsPanel (list + edit/delete/submit/cancel).
//
// Reads once when the user signs in; CRUD methods do optimistic
// updates so the UI feels instant. Each mutation also refetches the
// single row from the API so we reconcile against the server's
// version (timestamps, submitted_at, etc.).

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { Food } from '@/components/food-database/types';

export interface CustomFoodRow {
  id: string;
  name: string;
  brand: string | null;
  category: string | null;
  subcategory: string | null;
  preparation: string | null;
  state: string | null;
  type: string | null;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  serving_basis: string;
  standard_serving_grams: number | null;
  standard_serving_label: string | null;
  aliases: string[];
  source: 'manual' | 'llm';
  submission_status: 'private' | 'pending_review' | 'published' | 'rejected';
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomFoodCreate {
  name: string;
  brand?: string | null;
  category?: string;
  subcategory?: string | null;
  preparation?: string | null;
  state?: string | null;
  type?: string;
  kcal?: number | string;
  protein?: number | string;
  carbs?: number | string;
  fat?: number | string;
  fiber?: number | string;
  standard_serving_grams?: number | string;
  standard_serving_label?: string | null;
  aliases?: string[];
  submit_to_community?: boolean;
  source?: 'manual' | 'llm';
}

export type CustomFoodPatch = Partial<Omit<CustomFoodCreate, 'submit_to_community'>> & {
  submission_status?: 'private' | 'pending_review' | 'published' | 'rejected';
};

function rowToFood(row: CustomFoodRow): Food {
  return {
    id: row.id,
    name: row.name,
    brand: row.brand ?? null,
    category: row.category ?? 'Other',
    subcategory: row.subcategory ?? undefined,
    type: row.type ?? 'ingredient',
    kcal: Number(row.kcal ?? 0),
    protein: Number(row.protein ?? 0),
    carbs: Number(row.carbs ?? 0),
    fat: Number(row.fat ?? 0),
    fiber: Number(row.fiber ?? 0),
    servingBasis: '100g',
    standardServingGrams:
      row.standard_serving_grams != null ? Number(row.standard_serving_grams) : undefined,
    standardServingLabel: row.standard_serving_label ?? undefined,
    aliases: Array.isArray(row.aliases) ? row.aliases : [],
    isCustom: true,
    customSubmissionStatus: row.submission_status,
  };
}

export function useCustomFoods() {
  const { user } = useAuth();
  const [rows, setRows] = useState<CustomFoodRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) {
      setRows([]);
      setLoading(false);
      return;
    }
    const supabase = createClient();
    if (!supabase) {
      setLoading(false);
      return;
    }
    setLoading(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error: err } = await (supabase.from('user_custom_foods') as any)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500);
    if (err) {
      console.error('custom foods fetch failed:', err);
      setError('Could not load your foods.');
    } else {
      setRows((data ?? []) as CustomFoodRow[]);
      setError(null);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const create = useCallback(
    async (input: CustomFoodCreate): Promise<CustomFoodRow> => {
      const res = await fetch('/api/foods/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      const row = data.food as CustomFoodRow;
      if (!row) throw new Error('Create returned no row.');
      setRows((prev) =>
        prev.some((p) => p.id === row.id) ? prev : [row, ...prev]
      );
      return row;
    },
    []
  );

  const update = useCallback(
    async (id: string, patch: CustomFoodPatch): Promise<CustomFoodRow> => {
      const res = await fetch(`/api/foods/custom/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      const row = data.food as CustomFoodRow;
      if (!row) throw new Error('Update returned no row.');
      setRows((prev) => prev.map((r) => (r.id === id ? row : r)));
      return row;
    },
    []
  );

  const remove = useCallback(async (id: string): Promise<void> => {
    const res = await fetch(`/api/foods/custom/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data?.error || `HTTP ${res.status}`);
    }
    setRows((prev) => prev.filter((r) => r.id !== id));
  }, []);

  return {
    rows,
    foods: rows.map(rowToFood),
    loading,
    error,
    refresh,
    create,
    update,
    remove,
  };
}