'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface Props {
  variant?: 'compact' | 'wide';
  mode?: 'pair' | 'add_buddy';
  // Override the auto-derived headline / subheadline.
  headline?: string;
  subheadline?: string;
  // Suppress the loyalty path (used on the homepage where we want
  // a single clear price for all visitors).
  hideLoyaltyPath?: boolean;
}

const UPSELL = 'Shout a mate. Mates finish this at nearly twice the rate of solo starters.';

function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

export default function BuddyPurchasePicker({
  variant = 'wide',
  mode = 'pair',
  headline: hl,
  subheadline: sl,
  hideLoyaltyPath = false,
}: Props) {
  const { user, profile, loading: authLoading } = useAuth();

  const [purchaserName, setPurchaserName] = useState('');
  const [purchaserEmail, setPurchaserEmail] = useState('');
  const [buddyName, setBuddyName] = useState('');
  const [buddyEmail, setBuddyEmail] = useState('');
  const [personalNote, setPersonalNote] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Pre-fill from the signed-in user's profile. Don't pre-fill on
  // unauthenticated renders — the visitor types in their own details.
  useEffect(() => {
    if (user?.email) setPurchaserEmail(user.email);
    if (profile?.display_name) setPurchaserName(profile.display_name);
  }, [user?.email, profile?.display_name]);

  const containerCls =
    variant === 'wide'
      ? 'bg-paper border border-ink/10 p-6 md:p-8'
      : 'bg-paper border border-ink/10 p-5';

  // Per-mode copy. The headline and subheadline can be overridden
  // by the caller.
  const isAddBuddy = mode === 'add_buddy';
  const defaultHeadline = isAddBuddy
    ? 'Start together.'
    : 'Shout a mate that caneca.';
  const defaultSubheadline = isAddBuddy
    ? 'Finish together. Or just be in it for the craic!'
    : 'Mates finish this at nearly twice the rate of solo starters. (Your mate gets an email to activate. If they don’t within 14 days, we’ll turn their spot into a gift code you can pass on.)';
  const headline = hl ?? defaultHeadline;
  const subheadline = sl ?? defaultSubheadline;
  const priceLabel = isAddBuddy
    ? 'Add a buddy for €5.99 →'
    : 'Buy for €9.99 →';

  const submit = async () => {
    if (!isValidEmail(purchaserEmail)) {
      setErrorMsg('Please enter a valid email for you.');
      return;
    }
    if (!purchaserName.trim()) {
      setErrorMsg('Please enter your first name.');
      return;
    }
    if (!isValidEmail(buddyEmail)) {
      setErrorMsg('Please enter a valid email for your buddy.');
      return;
    }
    if (!buddyName.trim()) {
      setErrorMsg('Please enter your buddy’s first name.');
      return;
    }
    if (purchaserEmail.toLowerCase() === buddyEmail.toLowerCase()) {
      setErrorMsg('You can’t pair with yourself.');
      return;
    }
    setErrorMsg(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/buddy/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          purchaser_email: purchaserEmail.trim(),
          purchaser_name: purchaserName.trim(),
          buddy_email: buddyEmail.trim(),
          buddy_name: buddyName.trim(),
          personal_note: personalNote.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setErrorMsg(data.error || 'Could not start checkout.');
        setSubmitting(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setErrorMsg('Network error. Try again.');
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className={containerCls}>
        <p className="font-body text-caption uppercase tracking-widest text-ink/50">
          Loading…
        </p>
      </div>
    );
  }

  return (
    <div className={containerCls}>
      <p className="font-body text-caption uppercase text-coral mb-2">
        {isAddBuddy ? 'Buddy' : 'Buddy pair'}
      </p>
      <p className="font-display text-h2 text-ink leading-tight mb-1">
        {headline}
      </p>
      <p className="font-body text-base text-ink/70 mb-6">{subheadline}</p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <p className="font-body text-caption uppercase text-ink/50 mb-1">
          You
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <input
            type="text"
            value={purchaserName}
            onChange={(e) => setPurchaserName(e.target.value)}
            placeholder="Your first name"
            required
            maxLength={60}
            disabled={submitting}
            className="w-full px-3 py-3 bg-cream/30 border-2 border-ink/20 text-ink font-body focus:border-ink outline-none disabled:opacity-50"
          />
          <input
            type="email"
            value={purchaserEmail}
            onChange={(e) => setPurchaserEmail(e.target.value)}
            placeholder="you@email.com"
            required
            disabled={submitting || !!user}
            className="w-full px-3 py-3 bg-cream/30 border-2 border-ink/20 text-ink font-body focus:border-ink outline-none disabled:opacity-50"
          />
        </div>

        <p className="font-body text-caption uppercase text-ink/50 mb-1 mt-2">
          Pair with a mate
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <input
            type="text"
            value={buddyName}
            onChange={(e) => setBuddyName(e.target.value)}
            placeholder="Their first name"
            required
            maxLength={60}
            disabled={submitting}
            className="w-full px-3 py-3 bg-cream/30 border-2 border-ink/20 text-ink font-body focus:border-ink outline-none disabled:opacity-50"
          />
          <input
            type="email"
            value={buddyEmail}
            onChange={(e) => setBuddyEmail(e.target.value)}
            placeholder="buddy@email.com"
            required
            disabled={submitting}
            className="w-full px-3 py-3 bg-cream/30 border-2 border-ink/20 text-ink font-body focus:border-ink outline-none disabled:opacity-50"
          />
        </div>
        <textarea
          value={personalNote}
          onChange={(e) => setPersonalNote(e.target.value)}
          placeholder="Fancy doing this with me?"
          maxLength={200}
          rows={2}
          disabled={submitting}
          className="w-full px-3 py-3 bg-cream/30 border-2 border-ink/20 text-ink font-body focus:border-ink outline-none rounded-none mb-2 disabled:opacity-50"
        />
        <p className="font-body text-xs text-ink/50 mb-4 text-right">
          {200 - personalNote.length} characters left
        </p>

        {!user && (
          <p className="font-body text-xs text-ink/50 mb-4">
            No account yet? We’ll create one for you and your buddy
            when the payment clears. You’ll get an email to set a
            password.
          </p>
        )}

        {errorMsg && (
          <p role="alert" className="font-body text-sm text-coral mb-3">
            {errorMsg}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-ink text-paper font-body text-caption uppercase tracking-widest px-6 py-3 hover:bg-ink/85 transition-colors disabled:opacity-50"
        >
          {authLoading
            ? 'Loading…'
            : submitting
            ? 'Redirecting…'
            : priceLabel}
        </button>

        {/* Checkout upsell — only on the pair path. Encourages the
            €9.99 buy-now over a later €5.99 add-buddy. */}
        {!isAddBuddy && (
          <p className="font-body text-xs text-ink/60 mt-3 text-center">
            {UPSELL}
          </p>
        )}
      </form>
    </div>
  );
}
