'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ConsentStatement } from '@/components/member/ConsentStatement';

const PALETTE = { ink: '#1A1A1A', paper: '#FAF6EE' };

interface Milestone {
  date: string;
  text: string;
}

export default function ProjectsForm() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [title, setTitle] = useState('');
  const [milestones, setMilestones] = useState<Milestone[]>([
    { date: '', text: '' },
    { date: '', text: '' },
    { date: '', text: '' },
  ]);
  const [finished, setFinished] = useState('');
  const [creditAs, setCreditAs] = useState<'full_name' | 'first_name' | 'anonymous'>('first_name');
  const [agreed, setAgreed] = useState(false);
  const [consentError, setConsentError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [photoPaths, setPhotoPaths] = useState('');

  function addMilestone() {
    setMilestones((m) => [...m, { date: '', text: '' }]);
  }
  function removeMilestone(i: number) {
    setMilestones((m) => m.filter((_, j) => j !== i));
  }

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
    const cleaned = milestones.filter((m) => m.date && m.text.trim());
    if (cleaned.length < 3) {
      setSubmitError('At least 3 milestones with a date and a line each.');
      return;
    }
    setSubmitting(true);
    const r = await fetch('/api/ce/submissions', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        member_id: user.id,
        type: 'project',
        answers: {
          title,
          milestones: cleaned,
          finished,
        },
        photo_paths: photoPaths.split('\n').map((s) => s.trim()).filter(Boolean),
        credit_as: creditAs,
        consent_scope: 'passion-projects',
        consent_at: new Date().toISOString(),
      }),
    });
    setSubmitting(false);
    const j = await r.json();
    if (r.ok) {
      router.push(`/account?submitted=project`);
    } else {
      setSubmitError(j.error || 'Submit failed.');
    }
  }

  return (
    <div style={{ padding: '32px 24px', maxWidth: 720, margin: '0 auto' }}>
      <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 40, fontWeight: 400, color: PALETTE.ink, margin: '0 0 8px' }}>
        Passion project
      </h1>
      <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: 14, color: 'rgba(26,26,26,0.7)', margin: '0 0 24px' }}>
        What you built across the 50 days. 3–5 milestones with dates and a one-line description of the finished artefact.
      </p>
      {!user && (
        <p style={{ background: 'rgba(232,139,90,0.10)', border: '1px solid #E88B5A', padding: 12, fontFamily: 'system-ui, sans-serif', fontSize: 13, color: '#1A1A1A' }}>
          You need to be signed in. <a href="/account?next=/account/projects" style={{ color: '#E88B5A' }}>Sign in first</a>.
        </p>
      )}
      <form onSubmit={submit} style={{ display: 'grid', gap: 16 }}>
        <Field label="Project title">
          <input value={title} onChange={(e) => setTitle(e.target.value)} required style={inputStyle} />
        </Field>
        <Field label={`Milestones (3–5, date + one line each)`}>
          {milestones.map((m, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '160px 1fr auto', gap: 6, alignItems: 'center' }}>
              <input type="date" value={m.date} onChange={(e) => setMilestones((arr) => arr.map((x, j) => (i === j ? { ...x, date: e.target.value } : x)))} style={inputStyle} />
              <input value={m.text} onChange={(e) => setMilestones((arr) => arr.map((x, j) => (i === j ? { ...x, text: e.target.value } : x)))} placeholder={`Milestone ${i + 1}`} style={inputStyle} />
              <button type="button" onClick={() => removeMilestone(i)} style={{ background: 'transparent', border: '1px solid rgba(26,26,26,0.20)', padding: '8px 12px', fontFamily: 'system-ui, sans-serif', fontSize: 11, cursor: 'pointer' }}>
                ×
              </button>
            </div>
          ))}
          {milestones.length < 5 && (
            <button type="button" onClick={addMilestone} style={{ background: 'transparent', border: '1px dashed rgba(26,26,26,0.30)', padding: '8px 12px', fontFamily: 'system-ui, sans-serif', fontSize: 11, cursor: 'pointer', width: 'fit-content' }}>
              + Add milestone
            </button>
          )}
        </Field>
        <Field label="The finished artefact (one short description)">
          <textarea value={finished} onChange={(e) => setFinished(e.target.value)} rows={3} style={{ ...inputStyle, height: 'auto', resize: 'vertical', fontFamily: 'system-ui, sans-serif' }} />
        </Field>
        <Field label="Photo paths (one per line)">
          <textarea value={photoPaths} onChange={(e) => setPhotoPaths(e.target.value)} rows={2} style={{ ...inputStyle, height: 'auto', resize: 'vertical', fontFamily: 'system-ui, sans-serif' }} />
        </Field>
        <Field label="Credit preference">
          <select value={creditAs} onChange={(e) => setCreditAs(e.target.value as any)} style={inputStyle}>
            <option value="full_name">{profile?.display_name || 'full name'}</option>
            <option value="first_name">first name only</option>
            <option value="anonymous">anonymous</option>
          </select>
        </Field>
        <ConsentStatement type="project" checked={agreed} onChange={setAgreed} error={consentError} />
        {submitError && <p style={{ color: '#E88B5A', fontFamily: 'system-ui, sans-serif', fontSize: 13 }} role="alert">{submitError}</p>}
        <button type="submit" disabled={submitting} style={{
          background: '#1A1A1A', color: '#FAF6EE', border: 0, padding: '14px 20px',
          fontFamily: 'system-ui, sans-serif', fontSize: 12, letterSpacing: '0.12em',
          textTransform: 'uppercase', cursor: submitting ? 'default' : 'pointer', opacity: submitting ? 0.5 : 1,
        }}>
          {submitting ? 'Submitting…' : 'Submit project'}
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
