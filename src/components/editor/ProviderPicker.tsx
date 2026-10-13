'use client';

import { useEffect, useState } from 'react';

interface Status {
  available: Array<'anthropic' | 'minimax' | null>;
  active: 'anthropic' | 'minimax' | null;
}

const MODELS: Record<string, { label: string; models: string[] }> = {
  anthropic: {
    label: 'Anthropic',
    models: [
      'claude-3-5-haiku-latest',
      'claude-3-5-sonnet-latest',
      'claude-3-opus-latest',
    ],
  },
  minimax: {
    label: 'MiniMax',
    models: ['MiniMax-Text-01', 'MiniMax-M3', 'MiniMax-H3'],
  },
};

interface Props {
  /** Optional override: shows the picker without a label heading. */
  compact?: boolean;
}

export function ProviderPicker({ compact }: Props) {
  const [status, setStatus] = useState<Status | null>(null);
  const [selected, setSelected] = useState<'anthropic' | 'minimax' | ''>('');
  const [model, setModel] = useState('');
  const [saving, setSaving] = useState(false);

  async function refresh() {
    const r = await fetch('/api/ce/llm/status');
    const j = await r.json();
    setStatus(j);
    if (!selected && j.active) setSelected(j.active);
    if (!model && j.active) {
      const m = MODELS[j.active as keyof typeof MODELS]?.models?.[0];
      if (m) setModel(m);
    }
  }

  useEffect(() => { refresh(); }, []);

  async function setProvider(p: 'anthropic' | 'minimax' | '') {
    setSaving(true);
    setSelected(p);
    await fetch('/api/ce/llm/status', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ provider: p }),
    });
    setModel(MODELS[p as keyof typeof MODELS]?.models?.[0] || '');
    setSaving(false);
    refresh();
  }

  const active = selected || status?.active || null;
  const activeMeta = active ? MODELS[active] : null;

  if (status && status.available.length === 0) {
    return (
      <div style={boxStyle}>
        <div style={headStyle}>LLM provider</div>
        <p style={mutedStyle}>
          No provider configured. Set <code>ANTHROPIC_API_KEY</code> or <code>MINIMAX_API_KEY</code> in your env to enable the LLM storyboard path.
          (Otherwise the platform-aware heuristic runs.)
        </p>
      </div>
    );
  }

  return (
    <div style={boxStyle}>
      <div style={headStyle}>LLM provider</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
        {status?.available?.map((p) => p && (
          <button
            key={p}
            type="button"
            onClick={() => setProvider(p)}
            disabled={saving}
            style={active === p ? primaryBtn : ghostBtn}
          >
            {MODELS[p]?.label || p}
          </button>
        ))}
        {active && (
          <button
            type="button"
            onClick={() => setProvider('')}
            disabled={saving}
            style={ghostBtn}
          >
            Auto (default priority)
          </button>
        )}
      </div>
      {activeMeta && (
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'system-ui, sans-serif', fontSize: 12, color: 'rgba(26,26,26,0.7)' }}>
          <span>Model</span>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            disabled={!active}
            style={{ ...selectStyle, maxWidth: 360 }}
          >
            {activeMeta.models.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </label>
      )}
      <p style={mutedStyle}>
        The active provider drives the storyboard generator. Auto picks the first available key. The cookie is sent with every request and falls back to auto when empty.
      </p>
    </div>
  );
}

const boxStyle: React.CSSProperties = {
  background: '#FFFFFF',
  border: '1px solid rgba(26,26,26,0.12)',
  padding: 16,
  marginBottom: 16,
};
const headStyle: React.CSSProperties = {
  fontFamily: 'system-ui, sans-serif',
  fontSize: 11,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'rgba(26,26,26,0.5)',
  marginBottom: 8,
};
const mutedStyle: React.CSSProperties = {
  fontFamily: 'system-ui, sans-serif',
  fontSize: 11,
  color: 'rgba(26,26,26,0.5)',
  margin: 0,
};
const primaryBtn: React.CSSProperties = {
  background: '#1A1A1A', color: '#FAF6EE', border: 0, padding: '6px 12px',
  fontFamily: 'system-ui, sans-serif', fontSize: 11, letterSpacing: '0.08em',
  textTransform: 'uppercase', cursor: 'pointer',
};
const ghostBtn: React.CSSProperties = {
  ...primaryBtn,
  background: '#FFFFFF', color: '#1A1A1A', border: '1px solid rgba(26,26,26,0.20)',
};
const selectStyle: React.CSSProperties = {
  padding: '4px 8px',
  background: '#FFFFFF',
  border: '1px solid rgba(26,26,26,0.20)',
  color: '#1A1A1A',
  fontSize: 12,
  fontFamily: 'system-ui, sans-serif',
  boxSizing: 'border-box',
};
