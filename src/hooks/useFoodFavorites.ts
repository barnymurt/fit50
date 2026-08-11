'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase';

interface FavoriteRow {
  user_id: string;
  food_id: string;
  created_at: string;
}

export function useFoodFavorites() {
  const { user } = useAuth();
  const supabase = createClient();
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);

  const refetch = useCallback(async () => {
    if (!user || !supabase) {
      setFavoriteIds(new Set());
      return;
    }
    const { data, error } = await supabase
      .from('food_favorites')
      .select('food_id')
      .eq('user_id', user.id);
    if (error) {
      console.error('Failed to fetch favorites:', error);
      return;
    }
    setFavoriteIds(new Set(((data as FavoriteRow[]) || []).map((r) => r.food_id)));
  }, [user, supabase]);

  useEffect(() => {
    setLoaded(false);
    refetch().then(() => setLoaded(true));
  }, [refetch]);

  const toggle = useCallback(
    async (foodId: string) => {
      if (!user || !supabase) return;
      const isFav = favoriteIds.has(foodId);
      // optimistic
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (isFav) next.delete(foodId);
        else next.add(foodId);
        return next;
      });
      if (isFav) {
        const { error } = await supabase
          .from('food_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('food_id', foodId);
        if (error) {
          console.error('Failed to remove favorite:', error);
          await refetch();
        }
      } else {
        const { error } = await supabase
          .from('food_favorites')
          .insert({ user_id: user.id, food_id: foodId });
        if (error) {
          console.error('Failed to add favorite:', error);
          await refetch();
        }
      }
    },
    [user, supabase, favoriteIds, refetch]
  );

  const isFavorite = useCallback((foodId: string) => favoriteIds.has(foodId), [favoriteIds]);

  return { favoriteIds, isFavorite, toggle, loaded, refetch };
}
