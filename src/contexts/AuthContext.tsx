'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { createClient, isSupabaseConfigured } from '@/lib/supabase';

interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  is_premium: boolean;
  challenge_started_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  email: string | null;
  isCaptured: boolean;
  loading: boolean;
  configured: boolean;
  signInWithMagicLink: (email: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const EMAIL_STORAGE_KEY = 'fit50_email';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = isSupabaseConfigured ? createClient() : null;

  const fetchProfile = async (userId: string) => {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, display_name, is_premium, challenge_started_at')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Failed to fetch profile:', error);
      return null;
    }
    return data as Profile | null;
  };

  const refreshProfile = async () => {
    if (user && supabase) {
      const p = await fetchProfile(user.id);
      setProfile(p);
    }
  };

  useEffect(() => {
    let mounted = true;

    if (!supabase) {
      const storedEmail = localStorage.getItem(EMAIL_STORAGE_KEY);
      if (storedEmail) setEmail(storedEmail);
      setLoading(false);
      return;
    }

    const init = async () => {
      const storedEmail = localStorage.getItem(EMAIL_STORAGE_KEY);
      if (storedEmail) setEmail(storedEmail);

      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!mounted) return;

      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.user) {
        const p = await fetchProfile(currentSession.user.id);
        if (mounted) setProfile(p);
      }

      if (mounted) setLoading(false);
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event: string, newSession: Session | null) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          const p = await fetchProfile(newSession.user.id);
          setProfile(p);
          setEmail(newSession.user.email ?? null);
          if (newSession.user.email) {
            localStorage.setItem(EMAIL_STORAGE_KEY, newSession.user.email);
          }
        } else {
          setProfile(null);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const getSiteUrl = () => {
    if (process.env.NEXT_PUBLIC_SITE_URL) {
      return process.env.NEXT_PUBLIC_SITE_URL;
    }
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
    return '';
  };

  const signInWithMagicLink = async (emailAddress: string) => {
    if (!supabase) {
      setEmail(emailAddress);
      localStorage.setItem(EMAIL_STORAGE_KEY, emailAddress);
      return { error: null };
    }

    const siteUrl = getSiteUrl();
    const redirectTo = siteUrl ? `${siteUrl}/account` : undefined;

    const { error } = await supabase.auth.signInWithOtp({
      email: emailAddress,
      options: {
        ...(redirectTo ? { emailRedirectTo: redirectTo } : {}),
      },
    });

    if (error) {
      return { error: error.message };
    }

    setEmail(emailAddress);
    localStorage.setItem(EMAIL_STORAGE_KEY, emailAddress);
    return { error: null };
  };

  const signOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  const isCaptured = !!email;

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        email,
        isCaptured,
        loading,
        configured: isSupabaseConfigured,
        signInWithMagicLink,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
