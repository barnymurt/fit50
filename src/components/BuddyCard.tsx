'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase';

interface BuddyActivation {
  pending: boolean;
  email?: string;
  name?: string;
  expires_at?: string;
}

// BuddyCard now only handles the "pending" state — a buyer has
// purchased a buddy but the buddy hasn't activated yet. Once
// activated, a buddy_pairs row exists and MyMotivator takes over
// with the full pair card (name + day + streak + 9-cell grid).
//
// Shows the most recent pending purchase only. With multiple pending
// purchases (a buyer can buy several), only the latest shows here;
// the rest are still tracked in /account/buddy for resend.
export default function BuddyCard() {
  const { user, profile } = useAuth();
  const [pending, setPending] = useState<BuddyActivation | null>(null);

  useEffect(() => {
    if (!user || !profile?.id) {
      setPending({ pending: false });
      return;
    }
    const supabase = createClient();
    if (!supabase) return;

    supabase
      .from('buddy_purchases')
      .select('id, buddy_email, buddy_name, expires_at, status')
      .eq('purchaser_user_id', profile.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data: p }: { data: { buddy_email: string; buddy_name: string; expires_at: string } | null }) => {
        if (p) {
          setPending({
            pending: true,
            email: p.buddy_email,
            name: p.buddy_name,
            expires_at: p.expires_at,
          });
        } else {
          setPending({ pending: false });
        }
      })
      .catch(() => setPending({ pending: false }));
  }, [user, profile]);

  if (!pending?.pending) return null;

  return (
    <div className="border border-ink/10 bg-cream/30 p-4 mb-6">
      <p className="font-body text-caption uppercase tracking-widest text-coral mb-1">
        Buddy pending
      </p>
      <p className="font-body text-base text-ink/80">
        We emailed your invite to{' '}
        <span className="font-medium">{pending.email}</span>. They have 14 days to
        activate. Check the{' '}
        <a href="/account/buddy" className="underline text-coral">
          buddy dashboard
        </a>{' '}
        for resend.
      </p>
    </div>
  );
}
