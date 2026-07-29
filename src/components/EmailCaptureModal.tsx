'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface EmailCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
}

export default function EmailCaptureModal({
  isOpen,
  onClose,
  title = 'Save your progress',
  message = 'Enter your email — we\'ll send a one-tap link to save your progress across devices and unlock your completion certificate.',
}: EmailCaptureModalProps) {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signInWithMagicLink } = useAuth();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setSubmitting(true);
    setError(null);

    const { error: signInError } = await signInWithMagicLink(email);

    setSubmitting(false);

    if (signInError) {
      setError(signInError);
      return;
    }

    setSent(true);
  };

  const handleClose = () => {
    setEmail('');
    setSent(false);
    setError(null);
    setSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-ink/80 backdrop-blur-sm"
        onClick={handleClose}
      />
      <div className="relative bg-paper border border-ink/10 p-8 max-w-md w-full mx-4 shadow-2xl">
        <h3 className="font-display text-2xl text-ink mb-2">
          {sent ? 'Check your email ✓' : title}
        </h3>
        <p className="font-body text-ink/70 mb-6">
          {sent
            ? `Sign-in link sent to ${email}. Click the link in the email to save your progress. The link expires in 1 hour.`
            : message}
        </p>

        {!sent ? (
          <>
            <form onSubmit={handleSubmit}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                className="w-full p-4 bg-paper border-2 border-ink/20 text-ink font-body focus:border-ink outline-none mb-4"
                autoFocus
                required
                disabled={submitting}
              />

              {error && (
                <p className="font-body text-sm text-coral mb-4">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-ink text-paper font-body text-sm px-6 py-4 uppercase tracking-wider hover:bg-ink/85 transition-colors mb-3 disabled:opacity-50"
              >
                {submitting ? 'Sending…' : 'Send sign-in link'}
              </button>
            </form>

            <button
              onClick={handleClose}
              className="w-full text-ink/50 font-body text-sm hover:text-ink/80 transition-colors"
            >
              Continue without saving
            </button>
          </>
        ) : (
          <button
            onClick={handleClose}
            className="w-full bg-ink text-paper font-body text-sm px-6 py-4 uppercase tracking-wider hover:bg-ink/85 transition-colors"
          >
            Got it
          </button>
        )}
      </div>
    </div>
  );
}
