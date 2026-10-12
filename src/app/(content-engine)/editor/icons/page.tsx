'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface IconRow {
  id: string;
  tags: string[];
  description: string | null;
  source: 'live-app' | 'generated';
  approval_status: 'pending' | 'approved' | 'rejected';
  svg_path: string | null;
  png_path: string | null;
  created_at: string;
  approved_at: string | null;
}

const PALETTE = { ink: '#1A1A1A', paper: '#FAF6EE', coral: '#E88B5A' };

export default function IconsList() {
  const [icons, setIcons] = useState<IconRow[]>([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const url = status ? `/api/ce/icons?status=${status}` : '/api/ce/icons';
    const r = await fetch(url);
    const j = await r.json();
    if (r.ok) setIcons(j.icons || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, [status]);

  async function approve(id: string) {
    const r = await fetch(`/api/ce/icons/${id}/approve`, { method: 'POST' });
    if (r.ok) load();
  }
  async function reject(id: string) {
    const r = await fetch(`/api/ce/icons/${id}/reject`, { method: 'POST' });
    if (r.ok) load();
  }

  return (
    <div style={{ padding: '24px', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Link href="/editor" style={{ fontFamily: 'Georgia, serif', fontSize: 14, color: PALETTE.ink, textDecoration: 'none' }}>
          ← Posts
        </Link>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 40, fontWeight: 400, color: PALETTE.ink, margin: 0 }}>
          Icons
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
      ) : icons.length === 0 ? (
        <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: 14, color: 'rgba(26,26,26,0.5)' }}>No icons yet.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', background: '#FFFFFF', border: '1px solid rgba(26,26,26,0.12)' }}>
          <thead>
            <tr style={{ background: 'rgba(242,217,162,0.19)' }}>
              <th style={thStyle}>id</th>
              <th style={thStyle}>description</th>
              <th style={thStyle}>tags</th>
              <th style={thStyle}>source</th>
              <th style={thStyle}>status</th>
              <th style={thStyle}></th>
            </tr>
          </thead>
          <tbody>
            {icons.map((i) => (
              <tr key={i.id} style={{ borderTop: '1px solid rgba(26,26,26,0.08)' }}>
                <td style={tdStyle}>
                  <Link href={`/editor/icons/${i.id}`} style={{ color: PALETTE.ink }}>{i.id}</Link>
                </td>
                <td style={{ ...tdStyle, color: 'rgba(26,26,26,0.7)' }}>{i.description || '—'}</td>
                <td style={{ ...tdStyle, fontSize: 11, color: 'rgba(26,26,26,0.5)' }}>{(i.tags || []).join(', ')}</td>
                <td style={tdStyle}>{i.source}</td>
                <td style={tdStyle}><StatusBadge status={i.approval_status} /></td>
                <td style={tdStyle}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {i.approval_status === 'pending' && (
                      <>
                        <button onClick={() => approve(i.id)} style={tinyBtn}>Approve</button>
                        <button onClick={() => reject(i.id)} style={tinyBtn}>Reject</button>
                      </>
                    )}
                  </div>
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
      display: 'inline-block', padding: '2px 8px', background: s.bg, color: s.fg,
      fontFamily: 'system-ui, sans-serif', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase',
    }}>{status}</span>
  );
}

const selectStyle: React.CSSProperties = {
  padding: '10px 12px', background: 'rgba(242,217,162,0.19)', border: '2px solid rgba(26,26,26,0.20)',
  color: '#1A1A1A', fontSize: 14, fontFamily: 'system-ui, sans-serif', boxSizing: 'border-box',
};

const thStyle: React.CSSProperties = {
  textAlign: 'left', padding: '10px 12px', fontFamily: 'system-ui, sans-serif', fontSize: 11,
  letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(26,26,26,0.6)', fontWeight: 600,
};

const tdStyle: React.CSSProperties = {
  padding: '10px 12px', fontFamily: 'system-ui, sans-serif', fontSize: 13, color: '#1A1A1A',
};

const tinyBtn: React.CSSProperties = {
  background: '#FFFFFF', color: '#1A1A1A', border: '1px solid rgba(26,26,26,0.20)', padding: '4px 8px',
  fontFamily: 'system-ui, sans-serif', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer',
};
