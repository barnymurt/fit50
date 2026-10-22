'use client';

// /account/reset-password
//
// The destination of the "Forgot password?" recovery email link.
// Supabase's resetPasswordForEmail exchanges the URL token for a
// short-lived recovery session; we render a "Set a new password"
// form that calls supabase.auth.updateUser({ password }) and then
// lands the user on /account.
//
// Three states, in render order:
//   1. Loading — useAuth().loading: render a neutral "Loading…".
//   2. Session present — render the form. Submit calls
//      supabase.auth.updateUser and shows the success card.
//   3. No session — render the "Expired or missing link" fallback
//      that re-fires resetPasswordForEmail with a new link.
//
// See docs/user-stories/password-reset-flow.md for the spec.

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Section from '@/components/Section';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase';

type Phase = 'idle' | 'loading' | 'sent';

export default function ResetPasswordPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const supabase = createClient();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formHint, setFormHint] = useState<string | null>(null);

  // State for the expired-link fallback (re-send flow).
  const [resendEmail, setResendEmail] = useState('');
  const [resendPhase, setResendPhase] = useState<Phase>('idle');
  const [resendError, setResendError] = useState<string | null>(null);

  const passwordLongEnough = newPassword.length >= 8;
  const passwordsMatch =
    newPassword.length > 0 && newPassword === confirmPassword;
  const canSubmit =
    !!user && passwordLongEnough && passwordsMatch && !submitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase || !user) {
      setFormError('Reset link is missing or expired.');
      setFormHint('Scroll down and request a new link below.');
      return;
    }
    if (!passwordLongEnough) {
      setFormError('Password must be at least 8 characters.');
      setFormHint(null);
      return;
    }
    if (!passwordsMatch) {
      setFormError('Passwords don’t match.');
      setFormHint(null);
      return;
    }
    setSubmitting(true);
    setFormError(null);
    setFormHint(null);
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    setSubmitting(false);
    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes('authsessionmissing') || msg.includes('session missing')) {
        setFormError('Reset link is missing or expired.');
        setFormHint('Request a new link below.');
      } else {
        setFormError(error.message);
      }
      return;
    }
    setDone(true);
  }

  async function handleResend(e: React.FormEvent) {
    e.preventDefault();
    setResendError(null);
    if (!resendEmail) {
      setResendError('Enter your email address.');
      return;
    }
    setResendPhase('loading');
    const origin = window.location.origin;
    const { error } = await supabase.auth.resetPasswordForEmail(
      resendEmail,
      { redirectTo: `${origin}/account/reset-password` }
    );
    if (error) {
      setResendPhase('idle');
      setResendError(error.message);
      return;
    }
    setResendPhase('sent');
  }

  return (
    <Section
      className="relative py-section min-h-[70vh] flex items-center"
      tone="paper"
      contained
    >
      <div className="max-w-md mx-auto w-full">
        <p className="font-body text-caption uppercase text-coral mb-3 text-center">
          Account
        </p>

        {loading ? (
          <>
            <h1 className="font-display text-display-2 text-ink mb-4 text-center">
              Loading…
            </h1>
            <p className="font-body text-base text-ink/70 text-center">
              Setting up your reset.
            </p>
          </>
        ) : done ? (
          <SuccessCard onContinue={() => router.push('/account')} />
        ) : user ? (
          <>
            <h1 className="font-display text-display-2 text-ink mb-4 text-center">
              Set a new password.
            </h1>
            <p className="font-body text-base text-ink/70 mb-10 text-center">
              Pick something you’ll remember. Min 8 characters.
            </p>
            <form
              onSubmit={handleSubmit}
              className="bg-paper border border-ink/10 p-8"
              aria-label="Set a new password"
            >
              <NewPasswordFields
                newPassword={newPassword}
                setNewPassword={setNewPassword}
                confirmPassword={confirmPassword}
                setConfirmPassword={setConfirmPassword}
                showPassword={showPassword}
                setShowPassword={setShowPassword}
                disabled={submitting}
              />
              {formError && (
                <p role="alert" className="font-body text-sm text-coral mb-2">
                  {formError}
                </p>
              )}
              {formHint && (
                <p className="font-body text-xs text-ink/50 mb-4">
                  {formHint}
                </p>
              )}
              <button
                type="submit"
                disabled={!canSubmit}
                aria-busy={submitting}
                className="w-full bg-coral text-paper font-body text-sm px-6 py-4 uppercase tracking-wider hover:bg-coral-deep transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Updating…' : 'Update password'}
              </button>
              <div className="mt-6 text-center">
                <Link
                  href="/account"
                  className="font-body text-sm text-ink/60 hover:text-ink"
                >
                  ← Back to sign in
                </Link>
              </div>
            </form>
          </>
        ) : (
          <ExpiredLinkCard
            email={resendEmail}
            setEmail={setResendEmail}
            phase={resendPhase}
            onSubmit={handleResend}
            error={resendError}
          />
        )}
      </div>
    </Section>
  );
}

function NewPasswordFields({
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  showPassword,
  setShowPassword,
  disabled,
}: {
  newPassword: string;
  setNewPassword: (v: string) => void;
  confirmPassword: string;
  setConfirmPassword: (v: string) => void;
  showPassword: boolean;
  setShowPassword: React.Dispatch<React.SetStateAction<boolean>>;
  disabled: boolean;
}) {
  return (
    <>
      <label
        htmlFor="new-password"
        className="block font-body text-caption uppercase tracking-widest text-ink/50 mb-3"
      >
        New password
      </label>
      <div className="relative mb-4">
        <input
          id="new-password"
          type={showPassword ? 'text' : 'password'}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="••••••••"
          required
          minLength={8}
          disabled={disabled}
          autoComplete="new-password"
          autoFocus
          className="w-full p-4 pr-12 bg-cream/30 border-2 border-ink/20 text-ink font-body focus:border-ink outline-none rounded-none disabled:opacity-50"
        />
        <button
          type="button"
          onClick={() => setShowPassword((v) => !v)}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          aria-pressed={showPassword}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-ink/40 hover:text-ink transition-colors"
          tabIndex={-1}
        >
          {showPassword ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>

      <label
        htmlFor="confirm-password"
        className="block font-body text-caption uppercase tracking-widest text-ink/50 mb-3"
      >
        Confirm password
      </label>
      <div className="relative mb-4">
        <input
          id="confirm-password"
          type={showPassword ? 'text' : 'password'}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="••••••••"
          required
          minLength={8}
          disabled={disabled}
          autoComplete="new-password"
          className="w-full p-4 bg-cream/30 border-2 border-ink/20 text-ink font-body focus:border-ink outline-none rounded-none disabled:opacity-50"
        />
      </div>
    </>
  );
}

function SuccessCard({ onContinue }: { onContinue: () => void }) {
  return (
    <>
      <h1 className="font-display text-display-2 text-ink mb-4 text-center">
        Password updated ✓
      </h1>
      <p className="font-body text-base text-ink/70 mb-10 text-center">
        You’re in on your new password. You can keep going.
      </p>
      <div className="bg-paper border border-ink/10 p-8 text-center">
        <button
          onClick={onContinue}
          className="w-full bg-coral text-paper font-body text-sm px-6 py-4 uppercase tracking-wider hover:bg-coral-deep transition-colors"
        >
          Continue to account →
        </button>
      </div>
    </>
  );
}

function ExpiredLinkCard({
  email,
  setEmail,
  phase,
  onSubmit,
  error,
}: {
  email: string;
  setEmail: (v: string) => void;
  phase: Phase;
  onSubmit: (e: React.FormEvent) => void;
  error: string | null;
}) {
  return (
    <>
      <h1 className="font-display text-display-2 text-ink mb-4 text-center">
        Link expired.
      </h1>
      <p className="font-body text-base text-ink/70 mb-10 text-center">
        Password reset links last 1 hour. Enter your email and we’ll
        send a fresh one.
      </p>

      {phase === 'sent' ? (
        <div className="bg-paper border border-ink/10 p-8 text-center">
          <p className="font-display text-h2 text-teal mb-3">
            Check your email ✓
          </p>
          <p className="font-body text-sm text-ink/70">
            New reset link sent to{' '}
            <span className="text-ink">{email}</span>. Click the link in
            the email to set a new password. The link expires in 1
            hour.
          </p>
          <Link
            href="/account"
            className="block mt-6 font-body text-caption uppercase text-coral hover:underline"
          >
            ← Back to sign in
          </Link>
        </div>
      ) : (
        <form
          onSubmit={onSubmit}
          className="bg-paper border border-ink/10 p-8"
        >
          <label
            htmlFor="resend-email"
            className="block font-body text-caption uppercase tracking-widest text-ink/50 mb-3"
          >
            Email address
          </label>
          <input
            id="resend-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            required
            disabled={phase === 'loading'}
            autoFocus
            className="w-full p-4 bg-cream/30 border-2 border-ink/20 text-ink font-body focus:border-ink outline-none rounded-none mb-4 disabled:opacity-50"
          />
          {error && (
            <p role="alert" className="font-body text-sm text-coral mb-2">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={phase === 'loading'}
            aria-busy={phase === 'loading'}
            className="w-full bg-ink text-paper font-body text-sm px-6 py-4 uppercase tracking-wider hover:bg-ink/85 transition-colors disabled:opacity-50"
          >
            {phase === 'loading' ? 'Sending…' : 'Send new reset link'}
          </button>
          <div className="mt-6 text-center">
            <Link
              href="/account"
              className="font-body text-sm text-ink/60 hover:text-ink"
            >
              ← Back to sign in
            </Link>
          </div>
        </form>
      )}
    </>
  );
}

function EyeIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <path d="M14.12 14.12A3 3 0 1 1 9.88 9.88" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}
