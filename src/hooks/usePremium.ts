'use client';

import { useAuth } from '@/contexts/AuthContext';

export function usePremium() {
  const { profile, user } = useAuth();

  const isPremium = !!user && !!profile?.is_premium;

  return {
    isPremium,
    isLoading: !profile && !!user,
    profile,
  };
}
