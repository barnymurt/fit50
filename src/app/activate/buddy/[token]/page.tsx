'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Section from '@/components/Section';
import Heading from '@/components/Heading';

interface Props {
  params: { token: string };
}

export default function ActivateBuddyPage({ params }: Props) {
  const { token } = params;
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);

  // The token is validated server-side during activation. We don't
  // show a separate "is this token valid" check on page load — that
  // would create an enumeration oracle. The first error paste back
  // tells the user if it's invalid.

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords don\u2019t match.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/buddy/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || 'Activation failed. Try again.');
        setSubmitting(false);
        return;
      }
      // The API returns a magic link; redirect to it so the user is
      // signed in immediately.
      if (data.action_link) {
        window.location.href = data.action_link;
        return;
      }
      router.push('/account?activated=1');
    } catch (err) {
      setError('Network error. Try again.');
      setSubmitting(false);
    }
  };

  return (
    <Section className="relative py-section min-h-[70vh] flex items-center" tone="paper" contained>
      <div className="max-w-md mx-auto w-full">
        <p className="font-body text-caption uppercase text-coral mb-3 text-center">
          Activate your seat
        </p>
        <Heading
          as="h1"
          size="display-2"
          className="text-ink text-center mb-4"
        >
          Set a password.
        </Heading>
        <p className="font-body text-base text-ink/70 mb-10 text-center">
          Set a password on your account. You don&apos;t have to start the 50 days
          today — start whenever you&apos;re ready.
        </p>

        <form onSubmit={handleSubmit} className="bg-paper border border-ink/10 p-8">
          <label htmlFor="password" className="block font-body text-caption uppercase tracking-widest text-ink/50 mb-3">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            required
            minLength={8}
            disabled={submitting}
            autoFocus
            className="w-full p-4 bg-cream/30 border-2 border-ink/20 text-ink font-body focus:border-ink outline-none rounded-none mb-4 disabled:opacity-50"
          />

          <label htmlFor="confirm" className="block font-body text-caption uppercase tracking-widest text-ink/50 mb-3">
            Confirm password
          </label>
          <input
            id="confirm"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Type it again"
            required
            disabled={submitting}
            className="w-full p-4 bg-cream/30 border-2 border-ink/20 text-ink font-body focus:border-ink outline-none rounded-none mb-4 disabled:opacity-50"
          />

          {error && (
            <p role="alert" className="font-body text-sm text-coral mb-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-ink text-paper font-body text-sm px-6 py-4 uppercase tracking-wider hover:bg-ink/85 transition-colors disabled:opacity-50"
          >
            {submitting ? 'Activating\u2026' : 'Activate my seat'}
          </button>

          <p className="font-body text-xs text-ink/50 mt-4 text-center">
            By activating, you agree to our terms and privacy policy.
          </p>
        </form>
      </div>
    </Section>
  );
}
