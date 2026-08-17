'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Section from '@/components/Section';
import Heading from '@/components/Heading';

export default function RedeemGiftPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If user already signed in, pre-fill email.
  useEffect(() => {
    if (user?.email) setEmail(user.email);
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length < 4) {
      setError('Please enter the code.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/buddy/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, email, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || 'Could not redeem.');
        setSubmitting(false);
        return;
      }
      if (data.action_link) {
        window.location.href = data.action_link;
      } else {
        router.push('/account?activated=1');
      }
    } catch {
      setError('Network error. Try again.');
      setSubmitting(false);
    }
  };

  return (
    <Section className="relative py-section min-h-[70vh] flex items-center" tone="paper" contained>
      <div className="max-w-md mx-auto w-full">
        <p className="font-body text-caption uppercase text-coral mb-3 text-center">Redeem</p>
        <Heading
          as="h1"
          size="display-2"
          className="text-ink text-center mb-4"
        >
          Got a gift code?
        </Heading>
        <p className="font-body text-base text-ink/70 mb-10 text-center">
          Enter the code from your friend and set up your account.
        </p>

        <form onSubmit={handleSubmit} className="bg-paper border border-ink/10 p-8">
          <label htmlFor="code" className="block font-body text-caption uppercase tracking-widest text-ink/50 mb-3">
            Gift code
          </label>
          <input
            id="code"
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="FIT50-XXXX-XXXX"
            required
            disabled={submitting}
            autoFocus
            className="w-full p-4 bg-cream/30 border-2 border-ink/20 text-ink font-body font-mono uppercase tracking-widest focus:border-ink outline-none rounded-none mb-4 disabled:opacity-50"
          />

          <label htmlFor="email" className="block font-body text-caption uppercase tracking-widest text-ink/50 mb-3">
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
            className="w-full p-4 bg-cream/30 border-2 border-ink/20 text-ink font-body focus:border-ink outline-none rounded-none mb-4 disabled:opacity-50"
          />

          <label htmlFor="password" className="block font-body text-caption uppercase tracking-widest text-ink/50 mb-3">
            Set a password
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
            {submitting ? 'Redeeming\u2026' : 'Redeem and start'}
          </button>
        </form>
      </div>
    </Section>
  );
}
