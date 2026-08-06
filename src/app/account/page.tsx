'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Section from '@/components/Section';
import Button from '@/components/Button';
import Timer from '@/components/Timer';
import { useAuth } from '@/contexts/AuthContext';

type AuthMode = 'signin' | 'signup' | 'forgot' | 'reset-sent';

export default function AccountPage() {
  const router = useRouter();
  const { user, profile, loading, signIn, signUp, signInWithPasskey, enrollPasskey, resetPassword, signOut } = useAuth();

  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

  // When the user just reset their password, Supabase signs them in
  // automatically once they click the link. So if we land here with
  // a fresh session, just show the account content.
  useEffect(() => {
    if (!loading && user) {
      setMode('signin');
    }
  }, [user, loading]);

  if (loading) {
    return (
      <Section className="relative py-section min-h-[70vh] flex items-center justify-center" contained>
        <p className="font-body text-ink/50">Loading…</p>
      </Section>
    );
  }

  // Not signed in — show the auth form
  if (!user) {
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!email) return;
      setError(null);
      setHint(null);
      setSubmitting(true);

      if (mode === 'signin') {
        const { error: err } = await signIn(email, password);
        if (err) {
          setError(err.message);
          if (err.hint) setHint(err.hint);
        }
      } else if (mode === 'signup') {
        const { error: err } = await signUp(email, password);
        if (err) {
          setError(err.message);
          if (err.hint) setHint(err.hint);
        } else {
          // Supabase auto-signs in after sign up
          // (if email confirmation is required, this won't fire)
        }
      } else if (mode === 'forgot') {
        const { error: err } = await resetPassword(email);
        if (err) {
          setError(err.message);
        } else {
          setResetSent(true);
          setMode('reset-sent');
        }
      }

      setSubmitting(false);
    };

    const handlePasskeySignIn = async () => {
      setError(null);
      setHint(null);
      setSubmitting(true);
      const { error: err } = await signInWithPasskey();
      setSubmitting(false);
      if (err) {
        setError(err.message);
      }
    };

    return (
      <Section className="relative py-section min-h-[70vh] flex items-center" contained>
        <div className="max-w-md mx-auto w-full">
          <p className="font-body text-caption uppercase text-coral mb-3 text-center">
            Account
          </p>
          <h1 className="font-display text-display-2 text-ink mb-4 text-center">
            {mode === 'signup' && 'Create account.'}
            {mode === 'signin' && 'Sign in.'}
            {mode === 'forgot' && 'Reset password.'}
            {mode === 'reset-sent' && 'Check your email.'}
          </h1>
          <p className="font-body text-base text-ink/70 mb-10 text-center">
            {mode === 'signup' && 'Pick a password, start your 50 days.'}
            {mode === 'signin' && 'Welcome back.'}
            {mode === 'forgot' && 'We\u2019ll email you a reset link.'}
            {mode === 'reset-sent' && `Reset link sent to ${email}.`}
          </p>

          {mode === 'reset-sent' ? (
            <div className="bg-paper border border-ink/10 p-8 text-center">
              <p className="font-body text-sm text-ink/70 mb-6">
                Check your inbox and click the link to set a new password. The link expires in 1 hour.
              </p>
              <button
                onClick={() => { setMode('signin'); setResetSent(false); setPassword(''); }}
                className="font-body text-caption uppercase text-coral hover:underline"
              >
                ← Back to sign in
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-paper border border-ink/10 p-8">
              {mode !== 'forgot' && (
                <>
                  <label htmlFor="email" className="font-body text-caption uppercase text-ink/50 block mb-3">
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@email.com"
                    required
                    disabled={submitting}
                    className="w-full p-4 bg-cream/30 border-2 border-ink/20 text-ink font-body focus:border-coral outline-none rounded-none mb-4 disabled:opacity-50"
                    autoFocus
                  />
                </>
              )}

              {mode === 'forgot' && (
                <>
                  <label htmlFor="email" className="font-body text-caption uppercase text-ink/50 block mb-3">
                    Your email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@email.com"
                    required
                    disabled={submitting}
                    className="w-full p-4 bg-cream/30 border-2 border-ink/20 text-ink font-body focus:border-coral outline-none rounded-none mb-4 disabled:opacity-50"
                    autoFocus
                  />
                </>
              )}

              {mode !== 'forgot' && (
                <>
                  <label htmlFor="password" className="font-body text-caption uppercase text-ink/50 block mb-3">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={8}
                    disabled={submitting}
                    className="w-full p-4 bg-cream/30 border-2 border-ink/20 text-ink font-body focus:border-coral outline-none rounded-none mb-4 disabled:opacity-50"
                  />
                </>
              )}

              {error && (
                <p className="font-body text-sm text-coral mb-2">{error}</p>
              )}
              {hint && (
                <p className="font-body text-xs text-ink/50 mb-4">{hint}</p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-ink text-paper font-body text-sm px-6 py-4 uppercase tracking-wider hover:bg-ink/85 transition-colors disabled:opacity-50"
              >
                {submitting
                  ? '...'
                  : mode === 'signin'
                  ? 'Sign in'
                  : mode === 'signup'
                  ? 'Create account'
                  : 'Send reset link'}
              </button>

              {/* Mode switches */}
              <div className="mt-6 space-y-2 text-center">
                {mode === 'signin' && (
                  <>
                    <button
                      type="button"
                      onClick={() => { setMode('signup'); setError(null); setHint(null); }}
                      className="block w-full font-body text-sm text-ink/60 hover:text-ink"
                    >
                      Don&apos;t have an account? <span className="text-coral">Create one</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setMode('forgot'); setError(null); setHint(null); }}
                      className="block w-full font-body text-sm text-ink/60 hover:text-ink"
                    >
                      Forgot password?
                    </button>
                  </>
                )}
                {mode === 'signup' && (
                  <button
                    type="button"
                    onClick={() => { setMode('signin'); setError(null); setHint(null); }}
                    className="block w-full font-body text-sm text-ink/60 hover:text-ink"
                  >
                    Already have an account? <span className="text-coral">Sign in</span>
                  </button>
                )}
                {mode === 'forgot' && (
                  <button
                    type="button"
                    onClick={() => { setMode('signin'); setError(null); setHint(null); }}
                    className="block w-full font-body text-sm text-ink/60 hover:text-ink"
                  >
                    ← Back to sign in
                  </button>
                )}
              </div>

              {mode !== 'forgot' && (
                <>
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-ink/10" />
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-paper px-3 font-body text-caption uppercase text-ink/40">or</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handlePasskeySignIn}
                    disabled={submitting}
                    className="w-full border-2 border-ink/20 text-ink font-body text-sm px-6 py-4 uppercase tracking-wider hover:border-ink/40 transition-colors disabled:opacity-50"
                  >
                    Sign in with passkey
                  </button>
                </>
              )}
            </form>
          )}
        </div>
      </Section>
    );
  }

  return (
    <Section className="relative py-section" contained>
      <AccountContent
        user={user}
        profile={profile}
        hasPasskey={false}
        onSignOut={async () => { await signOut(); router.push('/'); }}
        onEnrollPasskey={async () => {
          setEnrolling(true);
          const { error: err } = await enrollPasskey();
          setEnrolling(false);
          if (err) setError(err.message);
        }}
        error={error}
        clearError={() => setError(null)}
        enrolling={enrolling}
      />
    </Section>
  );
}

function AccountContent({
  user,
  profile,
  hasPasskey,
  onSignOut,
  onEnrollPasskey,
  error,
  clearError,
  enrolling,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  user: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  profile: any;
  hasPasskey: boolean;
  onSignOut: () => void;
  onEnrollPasskey: () => void;
  error: string | null;
  clearError: () => void;
  enrolling: boolean;
}) {
  const challengeStarted = profile?.challenge_started_at
    ? new Date(profile.challenge_started_at).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '—';

  return (
    <div className="max-w-3xl mx-auto">
      <p className="font-body text-caption uppercase text-coral mb-3">
        Account
      </p>
      <h1 className="font-display text-display-2 text-ink mb-12">
        You&apos;re in.
      </h1>

      <div className="space-y-12">
        <div>
          <p className="font-body text-caption uppercase text-ink/50 mb-2">
            Signed in as
          </p>
          <p className="font-display text-h2 text-ink mb-4">
            {user.email}
          </p>
          <button
            onClick={onSignOut}
            className="font-body text-caption uppercase text-ink/60 hover:text-ink transition-colors"
          >
            Sign out
          </button>
        </div>

        <div className="pt-8 border-t border-rule">
          <p className="font-body text-caption uppercase text-ink/50 mb-2">
            Challenge
          </p>
          <p className="font-body text-ink">
            Started {challengeStarted}
          </p>
        </div>

        <div className="pt-8 border-t border-rule">
          <p className="font-body text-caption uppercase text-ink/50 mb-3">
            Security
          </p>
          <p className="font-body text-sm text-ink/60 mb-3">
            Passkeys (Face ID, Touch ID, Windows Hello) sign you in with one tap — no password, no email.
          </p>
          {error && (
            <p className="font-body text-sm text-coral mb-3">{error}</p>
          )}
          <button
            onClick={() => { clearError(); onEnrollPasskey(); }}
            disabled={enrolling}
            className="border-2 border-ink/20 text-ink font-body text-sm px-6 py-3 uppercase tracking-wider hover:border-ink/40 transition-colors disabled:opacity-50"
          >
            {enrolling ? 'Setting up…' : hasPasskey ? 'Add another device' : 'Set up passkey'}
          </button>
        </div>

        <div className="pt-8 border-t border-rule">
          <p className="font-body text-caption uppercase text-ink/50 mb-3">
            Premium
          </p>
          {profile?.is_premium ? (
            <div>
              <p className="font-display text-h3 text-teal">
                ✓ Premium unlocked
              </p>
              <p className="font-body text-sm text-ink/60 mt-2">
                Cloud sync, streak protection, daily reminders, photo proof, and the completion certificate are all active.
              </p>
            </div>
          ) : (
            <div>
              <p className="font-body text-ink mb-3">
                Free tier. Track locally on this device.
              </p>
              <p className="font-body text-sm text-ink/60 mb-6">
                Unlock cloud sync, streak protection, daily reminders, and the completion certificate.
              </p>
              <Button href="/upgrade" variant="primary" tone="light">
                Unlock for €7.99
              </Button>
            </div>
          )}
        </div>

        {profile?.is_premium && (
          <div className="pt-8 border-t border-rule">
            <p className="font-body text-caption uppercase text-ink/50 mb-2">
              Tools
            </p>
            <p className="font-display text-h2 text-ink mb-6">
              Built-in timer.
            </p>
            <p className="font-body text-base text-ink/70 mb-8 max-w-lg">
              Pick a duration, hit start, get on with it. The 30-min default fits the Feed Your Brain rule perfectly.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Timer label="Default · 30 min" defaultMinutes={30} />
              <Timer label="Quick set · 15 min" defaultMinutes={15} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
