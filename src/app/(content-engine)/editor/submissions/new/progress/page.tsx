'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ConsentStatement } from '@/components/member/ConsentStatement';

// Marketing-team intake for member-progress submissions. Lives
// behind the editor's env-var password gate. The form posts to
// /api/ce/submissions, which (in this same change) requires the
// editor session cookie. member_id is set to a stable marketing
// placeholder so the submission is attributable in the audit log.

const PALETTE = { ink: '#1A1A1A', paper: '#FAF6EE' };
const MARKETING_MEMBER_ID = 'marketing-team';

export default function ProgressForm() {
  const router = useRouter();
  const [habits, setHabits] = useState<string[]>(['', '', '']);
  const [streak, setStreak] = useState('');
  const [feeling, setFeeling] = useState('');
  const [creditAs, setCreditAs] = useState<'full_name' | 'first_name' | 'anonymous'>('first_name');
  const [agreed, setAgreed] = useState(false);
  const [consentError, setConsentError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [photoPaths, setPhotoPaths] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setConsentError(null);
    setSubmitError(null);
    if (!agreed) {
      setConsentError('Tick the consent box before saving.');
      return;
    }
    setSubmitting(true);
    const photos = photoPaths.split('\n').map((s) => s.trim()).filter(Boolean);
    const cleanedHabits = habits.map((h) => h.trim()).filter(Boolean);
    const r = await fetch('/api/ce/submissions', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        member_id: MARKETING_MEMBER_ID,
        type: 'progress',
        answers: {
          habits: cleanedHabits,
          streak: parseInt(streak || '0', 10) || 0,
          feeling,
        },
        photo_paths: photos,
        credit_as: creditAs,
        consent_scope: 'member-progress',
        consent_at: new Date().toISOString(),
      }),
    });
    setSubmitting(false);
    const j = await r.json();
    if (r.ok) {
      router.push('/editor/submissions');
    } else {
      setSubmitError(j.error || 'Save failed.');
    }
  }

  return (
    <div style={{ padding: '32px 24px', maxWidth: 720, margin: '0 auto' }}>
      <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#E88B5A', margin: '0 0 8px' }}>
        Marketing tool · progress
      </p>
      <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 40, fontWeight: 400, color: PALETTE.ink, margin: '0 0 8px' }}>
        New member-progress submission
      </h1>
      <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: 14, color: 'rgba(26,26,26,0.7)', margin: '0 0 24px' }}>
        What the member actually did in the last stretch. Habits, the streak, and how they felt. Submit to the editor's review queue.
      </p>
      <form onSubmit={submit} style={{ display: 'grid', gap: 16 }}>
        <Field label="Habits (1–3)">
          {[0, 1, 2].map((i) => (
            <input
              key={i}
              value={habits[i]}
              onChange={(e) => setHabits((h) => h.map((v, j) => (i === j ? e.target.value : v)))}
              placeholder={`Habit ${i + 1}`}
              style={inputStyle}
            />
          ))}
        </Field>
        <Field label="Streak (days, 0–50)">
          <input
            type="number"
            min={0}
            max={50}
            value={streak}
            onChange={(e) => setStreak(e.target.value)}
            placeholder="0"
            style={inputStyle}
          />
        </Field>
        <Field label="How they felt (one line)">
          <input value={feeling} onChange={(e) => setFeeling(e.target.value)} placeholder="Rougher day 32 than I expected" style={inputStyle} />
        </Field>
        <Field label="Photo paths (one per line, optional)">
          <textarea
            value={photoPaths}
            onChange={(e) => setPhotoPaths(e.target.value)}
            placeholder={'/path/to/day-1.jpg\n/path/to/day-50.jpg'}
            rows={3}
            style={{ ...inputStyle, height: 'auto', resize: 'vertical', fontFamily: 'system-ui, sans-serif' }}
          />
        </Field>
        <Field label="Credit preference">
          <select value={creditAs} onChange={(e) => setCreditAs(e.target.value as any)} style={inputStyle}>
            <option value="full_name">full name</option>
            <option value="first_name">first name only</option>
            <option value="anonymous">anonymous</option>
          </select>
        </Field>
        <ConsentStatement type="progress" checked={agreed} onChange={setAgreed} error={consentError} />
        {submitError && <p style={{ color: '#E88B5A', fontFamily: 'system-ui, sans-serif', fontSize: 13 }} role="alert">{submitError}</p>}
        <button type="submit" disabled={submitting} style={{
          background: '#1A1A1A', color: '#FAF6EE', border: 0, padding: '14px 20px',
          fontFamily: 'system-ui, sans-serif', fontSize: 12, letterSpacing: '0.12em',
          textTransform: 'uppercase', cursor: submitting ? 'default' : 'pointer', opacity: submitting ? 0.5 : 1,
        }}>
          {submitting ? 'Saving…' : 'Save to review queue'}
        </button>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'block' }}>
      <span style={{ display: 'block', fontFamily: 'system-ui, sans-serif', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(26,26,26,0.5)', marginBottom: 4 }}>
        {label}
      </span>
      <div style={{ display: 'grid', gap: 6 }}>{children}</div>
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  background: 'rgba(242,217,162,0.19)',
  border: '2px solid rgba(26,26,26,0.20)',
  color: '#1A1A1A',
  fontSize: 14,
  fontFamily: 'system-ui, sans-serif',
  boxSizing: 'border-box',
};
