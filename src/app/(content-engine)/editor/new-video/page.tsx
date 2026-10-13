'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const PLATFORMS = [
  { value: 'tiktok',    label: 'TikTok',                aspect: '9:16' },
  { value: 'reels',     label: 'Instagram Reels',       aspect: '9:16' },
  { value: 'shorts',    label: 'YouTube Shorts',        aspect: '9:16' },
  { value: 'instagram', label: 'Instagram feed',        aspect: '4:5' },
  { value: 'facebook',  label: 'Facebook feed',         aspect: '1:1' },
] as const;

const GOALS = [
  { value: 'reach',        label: 'Reach' },
  { value: 'saves',        label: 'Saves' },
  { value: 'signups',      label: 'Sign-ups to premium' },
  { value: 'link-clicks',  label: 'Link clicks' },
] as const;

export default function NewVideoPage() {
  const router = useRouter();
  const [idea, setIdea] = useState('');
  const [messageGoal, setMessageGoal] = useState<typeof GOALS[number]['value']>('reach');
  const [formats, setFormats] = useState<string[]>(['tiktok', 'reels']);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!idea.trim()) { setError('The idea is required.'); return; }
    if (formats.length === 0) { setError('Pick at least one platform.'); return; }
    setSubmitting(true);
    setError(null);
    const r = await fetch('/api/ce/storyboards', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ idea: idea.trim(), message_goal: messageGoal, platforms: formats }),
    });
    const j = await r.json();
    setSubmitting(false);
    if (r.ok && j.storyboard_id) {
      router.push(`/editor/new-video/${j.storyboard_id}/storyboard`);
    } else {
      setError(j.error || 'Generation failed.');
    }
  }

  return (
    <div style={{ padding: '32px 24px', maxWidth: 760, margin: '0 auto' }}>
      <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#E88B5A', margin: '0 0 8px' }}>
        Content engine · new video
      </p>
      <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 40, fontWeight: 400, color: '#1A1A1A', margin: '0 0 8px' }}>
        New video from a brief
      </h1>
      <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: 14, color: 'rgba(26,26,26,0.7)', margin: '0 0 24px' }}>
        Type the idea. Pick the message goal. Pick the platforms. The engine generates the scenes, picks the right aspect for each, and runs the animate pipeline to produce an MP4 per platform.
      </p>
      <form onSubmit={submit} style={{ display: 'grid', gap: 18 }}>
        <Field label="The idea">
          <textarea
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            placeholder="FIT50 just released a 5-minute Line B workout..."
            rows={6}
            style={{ ...inputStyle, height: 'auto', resize: 'vertical', fontFamily: 'system-ui, sans-serif' }}
            required
          />
        </Field>
        <Field label="Message goal">
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {GOALS.map((g) => (
              <label key={g.value} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: messageGoal === g.value ? 'rgba(232,139,90,0.15)' : 'rgba(242,217,162,0.19)', border: `1px solid ${messageGoal === g.value ? '#E88B5A' : 'rgba(26,26,26,0.20)'}`, cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="goal"
                  value={g.value}
                  checked={messageGoal === g.value}
                  onChange={() => setMessageGoal(g.value)}
                  style={{ width: 16, height: 16 }}
                />
                <span style={{ fontFamily: 'system-ui, sans-serif', fontSize: 12, color: '#1A1A1A' }}>{g.label}</span>
              </label>
            ))}
          </div>
        </Field>
        <Field label="Target platforms (one or more)">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8 }}>
            {PLATFORMS.map((p) => (
              <label key={p.value} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: formats.includes(p.value) ? 'rgba(232,139,90,0.15)' : 'rgba(242,217,162,0.19)', border: `1px solid ${formats.includes(p.value) ? '#E88B5A' : 'rgba(26,26,26,0.20)'}`, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formats.includes(p.value)}
                  onChange={(e) => setFormats((arr) => e.target.checked ? [...arr, p.value] : arr.filter((x) => x !== p.value))}
                />
                <span style={{ fontFamily: 'system-ui, sans-serif', fontSize: 13, color: '#1A1A1A' }}>{p.label}</span>
                <span style={{ marginLeft: 'auto', fontFamily: 'system-ui, sans-serif', fontSize: 10, color: 'rgba(26,26,26,0.5)' }}>{p.aspect}</span>
              </label>
            ))}
          </div>
        </Field>
        {error && <p role="alert" style={{ color: '#E88B5A', fontFamily: 'system-ui, sans-serif', fontSize: 13 }}>{error}</p>}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" disabled={submitting} style={{
            background: '#1A1A1A', color: '#FAF6EE', border: 0, padding: '14px 24px',
            fontFamily: 'system-ui, sans-serif', fontSize: 12, letterSpacing: '0.12em',
            textTransform: 'uppercase', cursor: submitting ? 'default' : 'pointer', opacity: submitting ? 0.5 : 1,
          }}>
            {submitting ? 'Generating…' : 'Generate video'}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'block' }}>
      <span style={{ display: 'block', fontFamily: 'system-ui, sans-serif', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(26,26,26,0.5)', marginBottom: 6 }}>
        {label}
      </span>
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
  fontFamily: 'system-ui, sans-serif',
  boxSizing: 'border-box',
};
