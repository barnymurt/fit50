'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface PostRow {
  id: string;
  pillar: string;
  status: string;
  brief: string | null;
  aspect: string;
  platform: string;
  last_rendered_at: string | null;
  updated_at: string;
}

export default function EditorList() {
  const router = useRouter();
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [newPillar, setNewPillar] = useState('drinks-recipes');
  const [newPlatform, setNewPlatform] = useState('instagram');
  const [newAspect, setNewAspect] = useState('4:5');
  const [newBrief, setNewBrief] = useState('');
  const [newBusy, setNewBusy] = useState(false);

  async function load() {
    setLoading(true);
    const url = status ? `/api/ce/posts?status=${status}` : '/api/ce/posts';
    const r = await fetch(url);
    const j = await r.json();
    if (r.ok) setPosts(j.posts || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, [status]);

  async function createPost() {
    setNewBusy(true);
    const r = await fetch('/api/ce/posts', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        pillar: newPillar,
        platform: newPlatform,
        aspect: newAspect,
        brief: newBrief,
        marquee: 'marquee_default',
      }),
    });
    const j = await r.json();
    setNewBusy(false);
    if (r.ok) router.push(`/editor/${j.post.id}`);
  }

  return (
    <div style={{ padding: '24px', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 40, fontWeight: 400, color: '#1A1A1A', margin: 0 }}>
          Posts
        </h1>
        <button
          onClick={() => setShowNew((v) => !v)}
          style={{
            background: '#E88B5A',
            color: '#FAF6EE',
            border: 0,
            padding: '14px 24px',
            fontFamily: 'system-ui, sans-serif',
            fontSize: 12,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            cursor: 'pointer',
          }}
        >
          {showNew ? 'Cancel' : 'New post'}
        </button>
      </div>

      {showNew && (
        <div style={{ background: '#FFFFFF', border: '1px solid rgba(26,26,26,0.12)', padding: 20, marginBottom: 24 }}>
          <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#E88B5A', margin: '0 0 12px' }}>
            New draft
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
            <Field label="Pillar">
              <select value={newPillar} onChange={(e) => setNewPillar(e.target.value)} style={selectStyle}>
                {['drinks-recipes', 'workouts', 'origin-story', 'quit-smoking', 'member-progress', 'books-members-read', 'passion-projects', 'challenge-explainers'].map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </Field>
            <Field label="Platform">
              <select value={newPlatform} onChange={(e) => setNewPlatform(e.target.value)} style={selectStyle}>
                <option value="instagram">instagram</option>
                <option value="facebook">facebook</option>
                <option value="tiktok">tiktok</option>
              </select>
            </Field>
            <Field label="Aspect">
              <select value={newAspect} onChange={(e) => setNewAspect(e.target.value)} style={selectStyle}>
                <option value="4:5">4:5</option>
                <option value="9:16">9:16</option>
              </select>
            </Field>
          </div>
          <Field label="Brief">
            <textarea
              value={newBrief}
              onChange={(e) => setNewBrief(e.target.value)}
              placeholder="One line. What's the one message?"
              rows={2}
              style={{ ...inputStyle, height: 'auto', resize: 'vertical', fontFamily: 'system-ui, sans-serif' }}
            />
          </Field>
          <div style={{ marginTop: 12 }}>
            <button onClick={createPost} disabled={newBusy} style={{
              background: '#1A1A1A', color: '#FAF6EE', border: 0, padding: '12px 20px',
              fontFamily: 'system-ui, sans-serif', fontSize: 12, letterSpacing: '0.12em',
              textTransform: 'uppercase', cursor: newBusy ? 'default' : 'pointer', opacity: newBusy ? 0.5 : 1,
            }}>
              {newBusy ? 'Creating…' : 'Create draft'}
            </button>
          </div>
        </div>
      )}

      <div style={{ marginBottom: 16 }}>
        <label style={{ fontFamily: 'system-ui, sans-serif', fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(26,26,26,0.5)', marginRight: 8 }}>
          Status
        </label>
        <select value={status} onChange={(e) => setStatus(e.target.value)} style={selectStyle}>
          <option value="">all</option>
          <option value="draft">draft</option>
          <option value="review">review</option>
          <option value="approved">approved</option>
          <option value="exported">exported</option>
        </select>
      </div>

      {loading ? (
        <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: 14, color: 'rgba(26,26,26,0.5)' }}>Loading…</p>
      ) : posts.length === 0 ? (
        <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: 14, color: 'rgba(26,26,26,0.5)' }}>No posts yet.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', background: '#FFFFFF', border: '1px solid rgba(26,26,26,0.12)' }}>
          <thead>
            <tr style={{ background: 'rgba(242,217,162,0.19)' }}>
              <th style={thStyle}>id</th>
              <th style={thStyle}>pillar</th>
              <th style={thStyle}>status</th>
              <th style={thStyle}>platform / aspect</th>
              <th style={thStyle}>brief</th>
              <th style={thStyle}>updated</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((p) => (
              <tr key={p.id} style={{ borderTop: '1px solid rgba(26,26,26,0.08)' }}>
                <td style={tdStyle}>
                  <Link href={`/editor/${p.id}`} style={{ color: '#1A1A1A' }}>{p.id}</Link>
                </td>
                <td style={tdStyle}>{p.pillar}</td>
                <td style={tdStyle}><StatusBadge status={p.status} /></td>
                <td style={tdStyle}>{p.platform} · {p.aspect}</td>
                <td style={{ ...tdStyle, color: 'rgba(26,26,26,0.7)' }}>{p.brief || '—'}</td>
                <td style={{ ...tdStyle, fontVariantNumeric: 'tabular-nums', color: 'rgba(26,26,26,0.7)' }}>
                  {new Date(p.updated_at).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; fg: string }> = {
    draft: { bg: 'rgba(26,26,26,0.08)', fg: '#1A1A1A' },
    review: { bg: 'rgba(74,155,155,0.18)', fg: '#1A1A1A' },
    approved: { bg: 'rgba(232,139,90,0.18)', fg: '#1A1A1A' },
    exported: { bg: 'rgba(26,26,26,0.85)', fg: '#FAF6EE' },
  };
  const s = map[status] || map.draft;
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 8px',
      background: s.bg,
      color: s.fg,
      fontFamily: 'system-ui, sans-serif',
      fontSize: 11,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
    }}>{status}</span>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'block' }}>
      <span style={{
        display: 'block',
        fontFamily: 'system-ui, sans-serif',
        fontSize: 11,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: 'rgba(26,26,26,0.5)',
        marginBottom: 4,
      }}>{label}</span>
      {children}
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
  boxSizing: 'border-box',
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  appearance: 'auto',
};

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '10px 12px',
  fontFamily: 'system-ui, sans-serif',
  fontSize: 11,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'rgba(26,26,26,0.6)',
  fontWeight: 600,
};

const tdStyle: React.CSSProperties = {
  padding: '10px 12px',
  fontFamily: 'system-ui, sans-serif',
  fontSize: 13,
  color: '#1A1A1A',
};
