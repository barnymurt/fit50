import { createBrowserClient } from '@supabase/ssr';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const hasConfig = !!url && !!key && !url.includes('your-project') && !key.includes('your-anon-key');

export function createClient() {
  if (!hasConfig || typeof window === 'undefined') {
    return null as unknown as ReturnType<typeof createBrowserClient>;
  }
  return createBrowserClient(url!, key!);
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
    };
  };
};
