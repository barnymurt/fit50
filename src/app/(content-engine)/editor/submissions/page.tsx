'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface SubmissionRow {
  id: string;
  member_id: string;
  type: 'progress' | 'book' | 'project';
  credit_as: string;
  status: 'pending' | 'approved' | 'rejected';
  withdrawn_at: string | null;
  created_at: string;
}

const PALETTE = { ink: '#1A1A1A', paper: '#FAF6EE', coral: '#E88B5A', rule: 'rgba(26,26,26,0.12)' };

export default function SubmissionsList() {
  const [subs, setSubs] = useState<SubmissionRow[]>([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const url = status ? `/api/ce/submissions?status=${status}` : '/api/ce/submissions';
    const r = await fetch(url);
    const j = await r.json();
    if (r.ok) setSubs(j.submissions || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, [status]);

  return (
    <div style={{ padding: '24px', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Link href="/editor" style={{ fontFamily: 'Georgia, serif', fontSize: 14, color: PALETTE.ink, textDecoration: 'none' }}>
          ← Posts
        </Link>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 40, fontWeight: 400, color: PALETTE.ink, margin: 0 }}>
          Submissions
        </h1>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ fontFamily: 'system-ui, sans-serif', fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(26,26,26,0.5)', marginRight: 8 }}>
          Status
        </label>
        <select value={status} onChange={(e) => setStatus(e.target.value)} style={selectStyle}>
          <option value="">all</option>
          <option value="pending">pending</option>
          <option value="approved">approved</option>
          <option value="rejected">rejected</option>
        </select>
      </div>

      {loading ? (
        <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: 14, color: 'rgba(26,26,26,0.5)' }}>Loading…</p>
      ) : subs.length === 0 ? (
        <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: 14, color: 'rgba(26,26,26,0.5)' }}>No submissions yet.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', background: '#FFFFFF', border: '1px solid rgba(26,26,26,0.12)' }}>
          <thead>
            <tr style={{ background: 'rgba(242,217,162,0.19)' }}>
              <th style={thStyle}>id</th>
              <th style={thStyle}>type</th>
              <th style={thStyle}>member</th>
              <th style={thStyle}>credit</th>
              <th style={thStyle}>status</th>
              <th style={thStyle}>withdrawn</th>
              <th style={thStyle}>created</th>
            </tr>
          </thead>
          <tbody>
            {subs.map((s) => (
              <tr key={s.id} style={{ borderTop: '1px solid rgba(26,26,26,0.08)' }}>
                <td style={tdStyle}>
                  <Link href={`/editor/submissions/${s.id}`} style={{ color: PALETTE.ink }}>{s.id.slice(0, 16)}…</Link>
                </td>
                <td style={tdStyle}>{s.type}</td>
                <td style={tdStyle}>{s.member_id.slice(0, 12)}…</td>
                <td style={tdStyle}>{s.credit_as}</td>
                <td style={tdStyle}><StatusBadge status={s.status} /></td>
                <td style={tdStyle}>{s.withdrawn_at ? new Date(s.withdrawn_at).toLocaleDateString() : '—'}</td>
                <td style={{ ...tdStyle, fontVariantNumeric: 'tabular-nums', color: 'rgba(26,26,26,0.7)' }}>
                  {new Date(s.created_at).toLocaleString()}
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
    pending: { bg: 'rgba(26,26,26,0.08)', fg: '#1A1A1A' },
    approved: { bg: 'rgba(74,155,155,0.18)', fg: '#1A1A1A' },
    rejected: { bg: 'rgba(232,139,90,0.18)', fg: '#1A1A1A' },
  };
  const s = map[status] || map.pending;
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

const selectStyle: React.CSSProperties = {
  padding: '10px 12px',
  background: 'rgba(242,217,162,0.19)',
  border: '2px solid rgba(26,26,26,0.20)',
  color: '#1A1A1A',
  fontSize: 14,
  fontFamily: 'system-ui, sans-serif',
  boxSizing: 'border-box',
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
