'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Section from '@/components/Section';
import Heading from '@/components/Heading';
import { useAuth } from '@/contexts/AuthContext';

interface BuddyStatus {
  has_buddy: boolean;
  id?: string;
  buddy_email?: string;
  buddy_name?: string;
  status?: 'pending' | 'activated' | 'expired_gifted' | 'expired_refunded';
  created_at?: string;
  expires_at?: string;
  activated_at?: string;
}

function daysUntil(iso: string): number {
  const ms = new Date(iso).getTime() - Date.now();
  return Math.ceil(ms / 86_400_000);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

export default function BuddyDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [status, setStatus] = useState<BuddyStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [resendTooSoon, setResendTooSoon] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/account?next=/account/buddy');
      return;
    }
    refresh();
  }, [user, authLoading, router]);

  async function refresh() {
    setLoading(true);
    try {
      const res = await fetch('/api/buddy/status');
      const data = await res.json();
      setStatus(data);
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setResending(true);
    setResendMessage(null);
    setResendTooSoon(false);
    try {
      const res = await fetch('/api/buddy/resend', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setResendMessage(data.error || 'Could not resend.');
        if (res.status === 429) setResendTooSoon(true);
      } else {
        setResendMessage('Invite sent. Check your buddy\u2019s spam just in case.');
      }
    } finally {
      setResending(false);
    }
  }

  if (authLoading || loading) {
    return (
      <Section className="relative py-section min-h-[70vh] flex items-center justify-center" tone="paper" contained>
        <p className="font-body text-ink/50">Loading…</p>
      </Section>
    );
  }

  if (!status) return null;

  if (!status.has_buddy) {
    return (
      <Section className="relative py-section min-h-[70vh] flex items-center" tone="paper" contained>
        <div className="max-w-md mx-auto w-full text-center">
          <p className="font-body text-caption uppercase text-coral mb-3">Buddy</p>
          <Heading as="h1" size="display-2" className="text-ink mb-4">No buddy yet.</Heading>
          <p className="font-body text-base text-ink/70 mb-8">
            Don&apos;t have a buddy yet? Pair up for €9.99. Better odds, better story.
          </p>
          <a
            href="/#sign-up"
            className="inline-flex items-center justify-center bg-coral text-paper font-body text-sm px-8 py-4 uppercase tracking-wider hover:bg-coral/85 transition-colors"
          >
            Bring a mate
          </a>
        </div>
      </Section>
    );
  }

  const days = status.expires_at ? daysUntil(status.expires_at) : 0;

  return (
    <Section className="relative py-section min-h-[70vh] flex items-center" tone="paper" contained>
      <div className="max-w-2xl mx-auto w-full">
        <p className="font-body text-caption uppercase text-coral mb-3">Buddy</p>
        <Heading as="h1" size="display-2" className="text-ink mb-4">
          Your buddy pair.
        </Heading>

        <div className="bg-paper border border-ink/10 p-6 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <p className="font-body text-caption uppercase text-ink/50 mb-1">Buddy</p>
              <p className="font-display text-h2 text-ink leading-tight">{status.buddy_name}</p>
              <p className="font-body text-sm text-ink/60 mt-1">{status.buddy_email}</p>
            </div>
            <div>
              <p className="font-body text-caption uppercase text-ink/50 mb-1">Status</p>
              <StatusBadge status={status.status} />
            </div>
          </div>

          {status.status === 'pending' && (
            <>
              <div className="border-t border-ink/10 pt-4 mb-4">
                <p className="font-body text-base text-ink/80">
                  {status.buddy_name} hasn&apos;t activated yet. {days > 0
                    ? `${days} day${days === 1 ? '' : 's'} left to activate.`
                    : 'Window is closed — the seat is being converted to a gift code.'}
                </p>
                {status.expires_at && (
                  <p className="font-body text-caption uppercase text-ink/50 mt-2">
                    Activated before {formatDate(status.expires_at)} or the seat becomes a gift code.
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleResend}
                  disabled={resending}
                  className="bg-ink text-paper font-body text-caption uppercase tracking-widest px-6 py-3 hover:bg-ink/85 transition-colors disabled:opacity-50"
                >
                  {resending ? 'Sending…' : 'Resend invite'}
                </button>
              </div>
              {resendMessage && (
                <p className={`mt-4 font-body text-sm ${resendTooSoon ? 'text-ink/70' : 'text-coral'}`}>
                  {resendMessage}
                </p>
              )}
            </>
          )}

          {status.status === 'activated' && (
            <div className="border-t border-ink/10 pt-4">
              <p className="font-body text-base text-ink/80">
                Activated on {status.activated_at ? formatDate(status.activated_at) : ''}. You&apos;re
                paired up — both streaks visible on the tracker.
              </p>
            </div>
          )}

          {status.status === 'expired_gifted' && (
            <div className="border-t border-ink/10 pt-4">
              <p className="font-body text-base text-ink/80">
                The 14-day window passed without activation. The seat was converted to a gift code
                and emailed to you. Check your inbox for the code.
              </p>
            </div>
          )}
        </div>
      </div>
    </Section>
  );
}

function StatusBadge({ status }: { status?: string }) {
  const map: Record<string, { label: string; bg: string; color: string }> = {
    pending: { label: 'Pending', bg: 'bg-cream/40', color: 'text-ink/70' },
    activated: { label: 'Activated', bg: 'bg-teal/10', color: 'text-teal' },
    expired_gifted: { label: 'Expired', bg: 'bg-ink/5', color: 'text-ink/50' },
  };
  const s = status ? map[status] : null;
  if (!s) return null;
  return (
    <span className={`inline-flex items-center px-3 py-1 ${s.bg} ${s.color} font-body text-caption uppercase tracking-widest`}>
      {s.label}
    </span>
  );
}
