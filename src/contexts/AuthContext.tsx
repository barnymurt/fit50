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
  buddy_user_id?: string | null;
}

export type AuthError = {
  message: string;
  hint?: string;
};

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  email: string | null;
  loading: boolean;
  configured: boolean;
  hasPasskey: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signInWithPasskey: () => Promise<{ error: AuthError | null }>;
  enrollPasskey: () => Promise<{ error: AuthError | null; credentialId?: string }>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasPasskey, setHasPasskey] = useState(false);

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

  const checkPasskey = async (userId: string) => {
    if (!supabase) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from('user_factors')
        .select('factor_type')
        .eq('user_id', userId)
        .eq('factor_type', 'webauthn');
      setHasPasskey((data?.length ?? 0) > 0);
    } catch {
      setHasPasskey(false);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      const p = await fetchProfile(user.id);
      setProfile(p);
      await checkPasskey(user.id);
    }
  };

  useEffect(() => {
    let mounted = true;

    if (!supabase) {
      setLoading(false);
      return;
    }

    const init = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!mounted) return;

      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.user) {
        const p = await fetchProfile(currentSession.user.id);
        if (mounted) {
          setProfile(p);
          if (p) setEmail(p.email);
        }
        await checkPasskey(currentSession.user.id);
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
          if (p) setEmail(p.email);
          await checkPasskey(newSession.user.id);
        } else {
          setProfile(null);
          setHasPasskey(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const signIn = async (emailAddress: string, password: string) => {
    if (!supabase) {
      console.error('[auth] signIn called but Supabase client is null. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
      return { error: { message: 'Auth not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel env vars.' } };
    }

    if (typeof window !== 'undefined') {
      console.log('[auth] signIn attempt', { email: emailAddress, configured: true });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: emailAddress,
      password,
    });

    if (error) {
      if (typeof window !== 'undefined') {
        console.error('[auth] signIn error', error.message, error.status);
      }
      const msg = error.message.toLowerCase();
      if (msg.includes('invalid login') || msg.includes('invalid credentials')) {
        return { error: { message: 'Email or password is incorrect.', hint: 'Check your details, or create an account if you don\'t have one yet.' } };
      }
      if (msg.includes('email not confirmed')) {
        return {
          error: {
            message: 'Email not confirmed.',
            hint: 'Check your inbox for a confirmation link. In Supabase dashboard → Authentication → Providers → Email → turn off "Confirm email" to skip this step.',
          },
        };
      }
      return { error: { message: error.message } };
    }

    if (typeof window !== 'undefined') {
      console.log('[auth] signIn success', { userId: data?.user?.id });
    }

    return { error: null };
  };

  const signUp = async (emailAddress: string, password: string) => {
    if (!supabase) {
      return { error: { message: 'Supabase not configured.' } };
    }

    if (password.length < 8) {
      return { error: { message: 'Password must be at least 8 characters.' } };
    }

    const { error } = await supabase.auth.signUp({
      email: emailAddress,
      password,
    });

    if (error) {
      if (error.message.toLowerCase().includes('already registered') || error.message.toLowerCase().includes('already been registered')) {
        return { error: { message: 'An account with this email already exists.', hint: 'Try signing in instead, or use the forgot password link.' } };
      }
      return { error: { message: error.message } };
    }

    return { error: null };
  };

  const signInWithPasskey = async () => {
    if (!supabase) {
      return { error: { message: 'Supabase not configured.' } };
    }
    if (typeof window === 'undefined' || !window.PublicKeyCredential) {
      return { error: { message: 'Passkeys not supported in this browser. Use email + password instead.' } };
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.auth as any).signInWithWebAuthn();
      if (error) return { error: { message: error.message ?? 'Passkey sign-in failed.' } };
      return { error: null };
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Passkey sign-in failed.';
      return { error: { message: msg } };
    }
  };

  const enrollPasskey = async () => {
    if (!supabase || !user) {
      return { error: { message: 'Sign in first before adding a passkey.' } };
    }
    if (typeof window === 'undefined' || !window.PublicKeyCredential) {
      return { error: { message: 'Passkeys not supported in this browser.' } };
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.auth as any).signUpWebAuthn({
        friendlyName: 'This device',
      });
      if (error) return { error: { message: error.message ?? 'Could not register passkey.' } };
      await checkPasskey(user.id);
      return { error: null, credentialId: data?.id };
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not register passkey.';
      return { error: { message: msg } };
    }
  };

  const resetPassword = async (emailAddress: string) => {
    if (!supabase) {
      return { error: { message: 'Supabase not configured.' } };
    }

    const { error } = await supabase.auth.resetPasswordForEmail(emailAddress, {
      redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/account`,
    });

    if (error) {
      return { error: { message: error.message } };
    }

    return { error: null };
  };

  const signOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setSession(null);
    setProfile(null);
    setHasPasskey(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        email,
        loading,
        configured: isSupabaseConfigured,
        hasPasskey,
        signIn,
        signUp,
        signInWithPasskey,
        enrollPasskey,
        resetPassword,
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
