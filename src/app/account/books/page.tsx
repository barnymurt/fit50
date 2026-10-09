'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ConsentStatement } from '@/components/member/ConsentStatement';

const PALETTE = { ink: '#1A1A1A', paper: '#FAF6EE' };

export default function BooksForm() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [ideas, setIdeas] = useState<string[]>(['', '', '']);
  const [attributed, setAttributed] = useState('');
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
      setConsentError('You need to agree to the consent statement before submitting.');
      return;
    }
    if (!user) {
      setSubmitError('Sign in first.');
      return;
    }
    setSubmitting(true);
    const cleanedIdeas = ideas.map((s) => s.trim()).filter(Boolean);
    if (attributed && attributed.split(/\s+/).length > 30) {
      setSubmitError('Quoted line must be under 30 words.');
      setSubmitting(false);
      return;
    }
    const r = await fetch('/api/ce/submissions', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        member_id: user.id,
        type: 'book',
        answers: {
          title,
          author,
          ideas: cleanedIdeas,
          attributed_line: attributed,
        },
        photo_paths: photoPaths.split('\n').map((s) => s.trim()).filter(Boolean),
        credit_as: creditAs,
        consent_scope: 'books-members-read',
        consent_at: new Date().toISOString(),
      }),
    });
    setSubmitting(false);
    const j = await r.json();
    if (r.ok) {
      router.push(`/account?submitted=book`);
    } else {
      setSubmitError(j.error || 'Submit failed.');
    }
  }

  return (
    <div style={{ padding: '32px 24px', maxWidth: 720, margin: '0 auto' }}>
      <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 40, fontWeight: 400, color: PALETTE.ink, margin: '0 0 8px' }}>
        Book pick
      </h1>
      <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: 14, color: 'rgba(26,26,26,0.7)', margin: '0 0 24px' }}>
        What you are reading. The book and 1–3 ideas in your own words. One short quoted line, if any.
      </p>
      {!user && (
        <p style={{ background: 'rgba(232,139,90,0.10)', border: '1px solid #E88B5A', padding: 12, fontFamily: 'system-ui, sans-serif', fontSize: 13, color: '#1A1A1A' }}>
          You need to be signed in. <a href="/account?next=/account/books" style={{ color: '#E88B5A' }}>Sign in first</a>.
        </p>
      )}
      <form onSubmit={submit} style={{ display: 'grid', gap: 16 }}>
        <Field label="Title">
          <input value={title} onChange={(e) => setTitle(e.target.value)} required style={inputStyle} />
        </Field>
        <Field label="Author">
          <input value={author} onChange={(e) => setAuthor(e.target.value)} required style={inputStyle} />
        </Field>
        <Field label="Ideas (1–3, in your own words)">
          {[0, 1, 2].map((i) => (
            <input
              key={i}
              value={ideas[i]}
              onChange={(e) => setIdeas((a) => a.map((v, j) => (i === j ? e.target.value : v)))}
              placeholder={`Idea ${i + 1}`}
              style={inputStyle}
            />
          ))}
        </Field>
        <Field label="One short quoted line (optional, under 30 words)">
          <textarea
            value={attributed}
            onChange={(e) => setAttributed(e.target.value)}
            rows={2}
            style={{ ...inputStyle, height: 'auto', resize: 'vertical', fontFamily: 'system-ui, sans-serif' }}
          />
        </Field>
        <Field label="Photo paths (cover image, one per line)">
          <textarea
            value={photoPaths}
            onChange={(e) => setPhotoPaths(e.target.value)}
            rows={2}
            style={{ ...inputStyle, height: 'auto', resize: 'vertical', fontFamily: 'system-ui, sans-serif' }}
          />
        </Field>
        <Field label="Credit preference">
          <select value={creditAs} onChange={(e) => setCreditAs(e.target.value as any)} style={inputStyle}>
            <option value="full_name">{profile?.display_name || 'full name'}</option>
            <option value="first_name">first name only</option>
            <option value="anonymous">anonymous</option>
          </select>
        </Field>
        <ConsentStatement type="book" checked={agreed} onChange={setAgreed} error={consentError} />
        {submitError && <p style={{ color: '#E88B5A', fontFamily: 'system-ui, sans-serif', fontSize: 13 }} role="alert">{submitError}</p>}
        <button type="submit" disabled={submitting} style={{
          background: '#1A1A1A', color: '#FAF6EE', border: 0, padding: '14px 20px',
          fontFamily: 'system-ui, sans-serif', fontSize: 12, letterSpacing: '0.12em',
          textTransform: 'uppercase', cursor: submitting ? 'default' : 'pointer', opacity: submitting ? 0.5 : 1,
        }}>
          {submitting ? 'Submitting…' : 'Submit book pick'}
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
