import { createBrowserClient } from '@supabase/ssr';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const hasConfig = !!url && !!key && !url.includes('your-project') && !key.includes('your-anon-key');

const REMEMBER_KEY = 'fit50-remember-me';

export function getRememberMe(): boolean {
  if (typeof window === 'undefined') return true;
  const stored = window.localStorage.getItem(REMEMBER_KEY);
  return stored !== 'false';
}

export function setRememberMe(value: boolean) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(REMEMBER_KEY, value ? 'true' : 'false');
}

export function createClient() {
  if (!hasConfig || typeof window === 'undefined') {
    return null as unknown as ReturnType<typeof createBrowserClient>;
  }
  // Storage that switches between localStorage and sessionStorage at runtime
  // based on the current "Remember me" preference. Reads/writes go to the
  // chosen storage on every call, so toggling the preference takes effect
  // immediately without reloading.
  //
  // Also enforces a 7-day max session lifetime when "Remember me" is on:
  // we stamp the session at sign-in and reject anything older, so a
  // forgotten signed-in browser doesn't keep the user authenticated
  // forever.
  const SESSION_KEY = 'fit50-auth';
  const SESSION_TS_KEY = 'fit50-auth-issued-at';
  const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

  const baseStorage = (): Storage =>
    getRememberMe() ? window.localStorage : window.sessionStorage;

  const authStorage = {
    getItem: (key: string) => {
      if (key === SESSION_KEY && getRememberMe()) {
        const ts = window.localStorage.getItem(SESSION_TS_KEY);
        if (ts) {
          const age = Date.now() - parseInt(ts, 10);
          if (Number.isFinite(age) && age > SESSION_MAX_AGE_MS) {
            window.localStorage.removeItem(SESSION_KEY);
            window.localStorage.removeItem(SESSION_TS_KEY);
            return null;
          }
        }
      }
      return baseStorage().getItem(key);
    },
    setItem: (key: string, value: string) => {
      if (key === SESSION_KEY && getRememberMe()) {
        window.localStorage.setItem(SESSION_TS_KEY, String(Date.now()));
      }
      baseStorage().setItem(key, value);
    },
    removeItem: (key: string) => {
      if (key === SESSION_KEY) {
        window.localStorage.removeItem(SESSION_TS_KEY);
        window.sessionStorage.removeItem(SESSION_TS_KEY);
      }
      window.localStorage.removeItem(key);
      window.sessionStorage.removeItem(key);
    },
  };
  return createBrowserClient(url!, key!, {
    auth: {
      persistSession: true,
      storage: authStorage,
      storageKey: SESSION_KEY,
    },
  });
}

export const isSupabaseConfigured = hasConfig;

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          display_name: string | null;
          is_premium: boolean;
          premium_purchased_at: string | null;
          challenge_started_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          display_name?: string | null;
          is_premium?: boolean;
          premium_purchased_at?: string | null;
          challenge_started_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<{
          display_name: string | null;
          is_premium: boolean;
          premium_purchased_at: string | null;
          challenge_started_at: string;
          updated_at: string;
        }>;
      };
      tracker_progress: {
        Row: {
          id: string;
          user_id: string;
          day: number;
          habit_id: string;
          completed: boolean;
          completed_at: string;
        };
        Insert: {
          user_id: string;
          day: number;
          habit_id: string;
          completed?: boolean;
          completed_at?: string;
        };
        Update: Partial<{
          completed: boolean;
          completed_at: string;
        }>;
      };
      streak_protections: {
        Row: {
          id: string;
          user_id: string;
          week_start_date: string;
          redeemed_day: number;
          redeemed_at: string;
        };
        Insert: {
          user_id: string;
          week_start_date: string;
          redeemed_day: number;
          redeemed_at?: string;
        };
      };
      food_log: {
        Row: {
          id: string;
          user_id: string;
          food_id: string;
          name: string;
          grams: number;
          kcal: number;
          protein: number;
          carbs: number;
          fat: number;
          fiber: number;
          meal: string | null;
          logged_at: string;
          day_key: string;
        };
        Insert: {
          user_id: string;
          food_id: string;
          name: string;
          grams: number;
          kcal: number;
          protein: number;
          carbs: number;
          fat: number;
          fiber?: number;
          meal?: string | null;
          logged_at?: string;
          day_key: string;
        };
        Update: Partial<{
          grams: number;
          kcal: number;
          protein: number;
          carbs: number;
          fat: number;
          fiber: number;
          meal: string | null;
        }>;
      };
      food_favorites: {
        Row: {
          user_id: string;
          food_id: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          food_id: string;
          created_at?: string;
        };
      };
      macro_profile: {
        Row: {
          user_id: string;
          age: number;
          sex: 'male' | 'female';
          height_cm: number;
          weight_kg: number;
          body_fat: number | null;
          activity: 'none' | 'light' | 'moderate' | 'heavy';
          goal: 'loss' | 'recomp' | 'muscle';
          diet: 'balanced' | 'lower' | 'higher';
          results_kcal: number;
          results_protein: number;
          results_carbs: number;
          results_fat: number;
          results_water: number;
          calculated_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          age: number;
          sex: 'male' | 'female';
          height_cm: number;
          weight_kg: number;
          body_fat?: number | null;
          activity: 'none' | 'light' | 'moderate' | 'heavy';
          goal: 'loss' | 'recomp' | 'muscle';
          diet: 'balanced' | 'lower' | 'higher';
          results_kcal: number;
          results_protein: number;
          results_carbs: number;
          results_fat: number;
          results_water: number;
          calculated_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<{
          age: number;
          sex: 'male' | 'female';
          height_cm: number;
          weight_kg: number;
          body_fat: number | null;
          activity: 'none' | 'light' | 'moderate' | 'heavy';
          goal: 'loss' | 'recomp' | 'muscle';
          diet: 'balanced' | 'lower' | 'higher';
          results_kcal: number;
          results_protein: number;
          results_carbs: number;
          results_fat: number;
          results_water: number;
          calculated_at: string;
          updated_at: string;
        }>;
      };
      newsletter_subscribers: {
        Row: {
          id: string;
          email: string;
          subscribed_at: string;
        };
        Insert: {
          email: string;
          subscribed_at?: string;
        };
        Update: Partial<{
          email: string;
          subscribed_at: string;
        }>;
      };
    };
  };
};
