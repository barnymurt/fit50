'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface SubmissionRow {
  id: string;
  member_id: string;
  type: 'progress' | 'book' | 'project';
  answers: any;
  photo_paths: string[];
  credit_as: string;
  consent_scope: string;
  consent_at: string;
  withdrawn_at: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

const PALETTE = { ink: '#1A1A1A', paper: '#FAF6EE', coral: '#E88B5A', rule: 'rgba(26,26,26,0.12)' };

export default function SubmissionDetail({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [sub, setSub] = useState<SubmissionRow | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pillar, setPillar] = useState<'member-progress' | 'books-members-read' | 'passion-projects'>('member-progress');
  const [id, setId] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => { const { id } = await params; if (!cancelled) setId(id); })();
    return () => { cancelled = true; };
  }, [params]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const r = await fetch(`/api/ce/submissions/${id}`);
      const j = await r.json();
      if (r.ok) {
        setSub(j.submission);
        // Pick a default pillar matching the submission type
        if (j.submission.type === 'progress') setPillar('member-progress');
        if (j.submission.type === 'book') setPillar('books-members-read');
        if (j.submission.type === 'project') setPillar('passion-projects');
      } else {
        setError(j.error || 'failed to load');
      }
    })();
  }, [id]);

  const approve = useCallback(async () => {
    if (!sub) return;
    setBusy(true); setError(null);
    const r = await fetch(`/api/ce/submissions/${sub.id}/approve`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ generate_post: true, pillar }),
    });
    setBusy(false);
    const j = await r.json();
    if (r.ok) {
      if (j.post) router.push(`/editor/${j.post.id}`);
      else router.push('/editor');
    } else {
      setError(j.error || 'approve failed');
    }
  }, [sub, pillar, router]);

  const reject = useCallback(async () => {
    if (!sub) return;
    setBusy(true); setError(null);
    const r = await fetch(`/api/ce/submissions/${sub.id}/reject`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    });
    setBusy(false);
    const j = await r.json();
    if (r.ok) router.push('/editor/submissions');
    else setError(j.error || 'reject failed');
  }, [sub, router]);

  const withdraw = useCallback(async () => {
    if (!sub) return;
    if (!confirm('Withdraw this submission? Every post using it will be flagged for takedown.')) return;
    setBusy(true); setError(null);
    const r = await fetch(`/api/ce/submissions/${sub.id}/withdraw`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({}),
    });
    setBusy(false);
    const j = await r.json();
    if (r.ok) {
      alert(`Withdrawn. ${j.flaggedPosts?.length || 0} post(s) flagged.`);
      router.push('/editor/submissions');
    } else {
      setError(j.error || 'withdraw failed');
    }
  }, [sub, router]);

  if (!sub) return <div style={{ padding: 40, fontFamily: 'system-ui, sans-serif' }}>{error || 'Loading…'}</div>;

  return (
    <div style={{ padding: '24px', maxWidth: 800, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <Link href="/editor/submissions" style={{ fontFamily: 'Georgia, serif', fontSize: 14, color: PALETTE.ink, textDecoration: 'none' }}>
          ← Submissions
        </Link>
        <span style={{ background: 'rgba(26,26,26,0.08)', color: PALETTE.ink, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '2px 8px' }}>
          {sub.type}
        </span>
        <span style={{ background: 'rgba(74,155,155,0.18)', color: PALETTE.ink, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '2px 8px' }}>
          {sub.status}
        </span>
        {sub.withdrawn_at && (
          <span style={{ background: 'rgba(26,26,26,0.85)', color: '#FAF6EE', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '2px 8px' }}>
            withdrawn
          </span>
        )}
      </div>

      <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 32, fontWeight: 400, color: PALETTE.ink, margin: '0 0 8px' }}>
        {renderTitle(sub)}
      </h1>
      <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: 12, color: 'rgba(26,26,26,0.5)', margin: '0 0 24px' }}>
        member {sub.member_id.slice(0, 12)}… · credit {sub.credit_as} · {new Date(sub.created_at).toLocaleString()}
      </p>

      <div style={{ background: '#FFFFFF', border: '1px solid rgba(26,26,26,0.12)', padding: 20, marginBottom: 20 }}>
        <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(26,26,26,0.5)', margin: '0 0 8px' }}>
          Answers
        </p>
        <pre style={{ fontFamily: 'system-ui, sans-serif', fontSize: 13, color: PALETTE.ink, whiteSpace: 'pre-wrap', margin: 0 }}>
          {JSON.stringify(sub.answers, null, 2)}
        </pre>
        {sub.photo_paths.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(26,26,26,0.5)', margin: '0 0 4px' }}>
              Photo paths
            </p>
            {sub.photo_paths.map((p, i) => (
              <p key={i} style={{ fontFamily: 'system-ui, sans-serif', fontSize: 12, color: PALETTE.ink, margin: '2px 0' }}>{p}</p>
            ))}
          </div>
        )}
      </div>

      <div style={{ background: '#FFFFFF', border: '1px solid rgba(26,26,26,0.12)', padding: 20, marginBottom: 20 }}>
        <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(26,26,26,0.5)', margin: '0 0 8px' }}>
          Consent (member agreed to)
        </p>
        <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: 12, color: PALETTE.ink, margin: '0 0 4px' }}>
          scope: {sub.consent_scope}
        </p>
        <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: 12, color: PALETTE.ink, margin: '0 0 4px' }}>
          at: {new Date(sub.consent_at).toLocaleString()}
        </p>
        <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: 12, color: PALETTE.ink, margin: '0 0 4px' }}>
          credit: {sub.credit_as}
        </p>
        {sub.withdrawn_at && (
          <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: 12, color: '#E88B5A', margin: '8px 0 0' }}>
            withdrawn at: {new Date(sub.withdrawn_at).toLocaleString()}
          </p>
        )}
      </div>

      {error && <p style={{ color: '#E88B5A', fontFamily: 'system-ui, sans-serif', fontSize: 13 }} role="alert">{error}</p>}

      {sub.status === 'pending' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
          <label style={{ fontFamily: 'system-ui, sans-serif', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(26,26,26,0.5)', marginRight: 8 }}>
            Approve as
          </label>
          <select value={pillar} onChange={(e) => setPillar(e.target.value as any)} style={selectStyle}>
            <option value="member-progress">member-progress</option>
            <option value="books-members-read">books-members-read</option>
            <option value="passion-projects">passion-projects</option>
          </select>
          <button onClick={approve} disabled={busy} style={primaryBtn}>Approve + create post</button>
          <button onClick={reject} disabled={busy} style={secondaryBtn}>Reject</button>
        </div>
      )}

      {sub.status === 'approved' && !sub.withdrawn_at && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
          <button onClick={withdraw} disabled={busy} style={secondaryBtn}>Withdraw</button>
        </div>
      )}
    </div>
  );
}

function renderTitle(sub: SubmissionRow): string {
  const a = sub.answers || {};
  if (sub.type === 'progress') return a.feeling ? `Progress: ${a.feeling}` : 'Progress update';
  if (sub.type === 'book') return a.title ? `Book: ${a.title}` : 'Book pick';
  if (sub.type === 'project') return a.title ? `Project: ${a.title}` : 'Passion project';
  return 'Submission';
}

const primaryBtn: React.CSSProperties = {
  background: '#1A1A1A',
  color: '#FAF6EE',
  border: 0,
  padding: '10px 16px',
  fontFamily: 'system-ui, sans-serif',
  fontSize: 11,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  cursor: 'pointer',
};

const secondaryBtn: React.CSSProperties = {
  ...primaryBtn,
  background: '#FFFFFF',
  color: '#1A1A1A',
  border: '1px solid rgba(26,26,26,0.20)',
};

const selectStyle: React.CSSProperties = {
  padding: '10px 12px',
  background: 'rgba(242,217,162,0.19)',
  border: '2px solid rgba(26,26,26,0.20)',
  color: '#1A1A1A',
  fontSize: 14,
  fontFamily: 'system-ui, sans-serif',
  boxSizing: 'border-box',
};
