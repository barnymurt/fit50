'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface Props {
  // "compact" = render inline (used inside article copy)
  // "wide" = full-width cards, used as a primary CTA section
  variant?: 'compact' | 'wide';
  headline?: string;
  subheadline?: string;
}

function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

export default function BuddyPurchasePicker({
  variant = 'wide',
  headline = 'Bring a mate.',
  subheadline = 'Two seats, one price. €9.99. Better odds, better story.',
}: Props) {
  const { user } = useAuth();
  const [step, setStep] = useState<'choose' | 'form' | 'error'>(
    'choose'
  );
  const [buddyName, setBuddyName] = useState('');
  const [buddyEmail, setBuddyEmail] = useState('');
  const [personalNote, setPersonalNote] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [purchaserName, setPurchaserName] = useState('');
  useEffect(() => {
    if (user?.email) setPurchaserName(user.email.split('@')[0]);
  }, [user]);

  const submit = async () => {
    if (!isValidEmail(buddyEmail)) {
      setErrorMsg('Please enter a valid email for your buddy.');
      return;
    }
    if (!buddyName.trim()) {
      setErrorMsg('Please enter your buddy\u2019s first name.');
      return;
    }
    setErrorMsg(null);
    try {
      const res = await fetch('/api/buddy/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buddy_email: buddyEmail,
          buddy_name: buddyName.trim(),
          personal_note: personalNote.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setErrorMsg(data.error || 'Could not start checkout.');
        setStep('error');
        return;
      }
      window.location.href = data.url;
    } catch {
      setErrorMsg('Network error. Try again.');
      setStep('error');
    }
  };

  const containerCls =
    variant === 'wide'
      ? 'bg-paper border border-ink/10 p-6 md:p-8'
      : 'bg-paper border border-ink/10 p-5';

  if (step === 'choose') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => (window.location.href = '/#sign-up')}
          className="border border-ink/15 p-5 text-left hover:bg-cream/30 transition-colors"
        >
          <p className="font-body text-caption uppercase tracking-widest text-ink/50 mb-2">
            Solo
          </p>
          <p className="font-display text-h2 text-ink leading-none mb-1">€5.99</p>
          <p className="font-body text-sm text-ink/60">
            Just me, thanks.
          </p>
        </button>
        <button
          type="button"
          onClick={() => setStep('form')}
          className="border-2 border-coral p-5 text-left hover:bg-coral/5 transition-colors"
        >
          <p className="font-body text-caption uppercase tracking-widest text-coral mb-2">
            Buddy pair
          </p>
          <p className="font-display text-h2 text-coral leading-none mb-1">€9.99</p>
          <p className="font-body text-sm text-ink/60">
            Bring a mate. Better odds, better story.
          </p>
        </button>
      </div>
    );
  }

  return (
    <div className={containerCls}>
      <p className="font-body text-caption uppercase text-coral mb-2">Buddy pair</p>
      <p className="font-display text-h2 text-ink leading-tight mb-1">{headline}</p>
      <p className="font-body text-base text-ink/70 mb-6">{subheadline}</p>

      {!user ? (
        <div className="border border-ink/10 p-4 bg-cream/30 mb-4">
          <p className="font-body text-sm text-ink/80">
            <a href="/account?next=/#sign-up" className="text-coral underline">
              Sign in
            </a>
            {' '}first to buy a buddy pair. We need your account so we can pair the two seats.
          </p>
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <p className="font-body text-caption uppercase text-ink/50 mb-1">You</p>
          <p className="font-body text-base text-ink/80 mb-4">
            {user.email} — {purchaserName}
          </p>

          <label htmlFor="buddy-name" className="block font-body text-caption uppercase tracking-widest text-ink/50 mb-3">
            Your buddy&apos;s first name
          </label>
          <input
            id="buddy-name"
            type="text"
            value={buddyName}
            onChange={(e) => setBuddyName(e.target.value)}
            placeholder="Barnaby"
            required
            maxLength={60}
            className="w-full p-4 bg-cream/30 border-2 border-ink/20 text-ink font-body focus:border-ink outline-none rounded-none mb-4"
          />

          <label htmlFor="buddy-email" className="block font-body text-caption uppercase tracking-widest text-ink/50 mb-3">
            Your buddy&apos;s email
          </label>
          <input
            id="buddy-email"
            type="email"
            value={buddyEmail}
            onChange={(e) => setBuddyEmail(e.target.value)}
            placeholder="buddy@email.com"
            required
            className="w-full p-4 bg-cream/30 border-2 border-ink/20 text-ink font-body focus:border-ink outline-none rounded-none mb-4"
          />

          <label htmlFor="personal-note" className="block font-body text-caption uppercase tracking-widest text-ink/50 mb-3">
            Personal note (optional)
          </label>
          <textarea
            id="personal-note"
            value={personalNote}
            onChange={(e) => setPersonalNote(e.target.value)}
            placeholder="Fancy doing this with me?"
            maxLength={200}
            rows={2}
            className="w-full p-4 bg-cream/30 border-2 border-ink/20 text-ink font-body focus:border-ink outline-none rounded-none mb-4"
          />
          <p className="font-body text-xs text-ink/50 -mt-2 mb-4">
            {200 - personalNote.length} characters left.
          </p>

          <p className="font-body text-xs text-ink/50 mb-4">
            By continuing you confirm you have permission to share your buddy&apos;s email.
          </p>

          {errorMsg && (
            <p role="alert" className="font-body text-sm text-coral mb-3">{errorMsg}</p>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={step === 'error'}
              className="bg-ink text-paper font-body text-sm px-6 py-4 uppercase tracking-wider hover:bg-ink/85 transition-colors disabled:opacity-50"
            >
              {step === 'error' ? 'Try again' : 'Buy for €9.99 →'}
            </button>
            <button
              type="button"
              onClick={() => setStep('choose')}
              className="border border-ink/30 text-ink px-6 py-4 uppercase font-body text-caption tracking-widest hover:bg-cream/30 transition-colors"
            >
              Back
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
