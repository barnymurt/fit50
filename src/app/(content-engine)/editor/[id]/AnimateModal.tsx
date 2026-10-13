'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface AnimationRow {
  id: string;
  post_id: string;
  status: 'idle' | 'building' | 'ready' | 'failed';
  piece_dir: string | null;
  style: string | null;
  formats: string[];
  mp4_paths: Record<string, string>;
  duration_ms: number | null;
  error: string | null;
  created_at: string;
  updated_at: string;
}

const STYLES = [
  { value: 'cut-paper',   label: 'Cut paper' },
  { value: 'crosshatch',  label: 'Crosshatch' },
  { value: 'riso',        label: 'Riso' },
  { value: 'sketchbook',  label: 'Sketchbook' },
  { value: 'math',        label: 'Math' },
  { value: 'pixel',       label: 'Pixel' },
  { value: 'isometric',   label: 'Isometric' },
] as const;

const FORMATS = [
  { value: '9:16', label: '9:16  · TikTok / Reels / Shorts' },
  { value: '1:1',  label: '1:1   · Facebook feed' },
  { value: '4:5',  label: '4:5   · Instagram feed' },
  { value: '16:9', label: '16:9  · YouTube' },
] as const;

interface Props {
  postId: string;
  postBrief: string | null;
  onClose: () => void;
}

export function AnimateModal({ postId, postBrief, onClose }: Props) {
  const router = useRouter();
  const [style, setStyle] = useState<typeof STYLES[number]['value']>('cut-paper');
  const [formats, setFormats] = useState<string[]>(['9:16', '1:1', '4:5', '16:9']);
  const [seconds, setSeconds] = useState(1.5);
  const [status, setStatus] = useState<'idle' | 'building' | 'ready' | 'failed'>('idle');
  const [animation, setAnimation] = useState<AnimationRow | null>(null);
  const [activeFormat, setActiveFormat] = useState<string>('9:16');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load the most recent animation on mount
  useEffect(() => {
    fetch(`/api/ce/posts/${postId}/animation`)
      .then((r) => r.json())
      .then((j) => {
        if (j.animation && j.animation.status === 'ready') {
          setAnimation(j.animation);
          setStatus('ready');
          const keys = Object.keys(j.animation.mp4_paths || {});
          if (keys.length > 0) setActiveFormat(keys[0]);
        }
      })
      .catch(() => {});
  }, [postId]);

  async function start() {
    setStatus('building');
    setErrorMsg(null);
    const r = await fetch(`/api/ce/posts/${postId}/animate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ style, formats, seconds_per_slide: seconds }),
    });
    const j = await r.json();
    if (r.ok) {
      setAnimation(j);
      setStatus('ready');
      const keys = Object.keys(j.mp4_paths || {});
      if (keys.length > 0) setActiveFormat(keys[0]);
      router.refresh();
    } else {
      setStatus('failed');
      setErrorMsg(j.error || 'Animation failed.');
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(26,26,26,0.40)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
      <div style={{ background: '#FFFFFF', padding: 24, maxWidth: 720, width: '100%', border: '1px solid rgba(26,26,26,0.12)' }}>
        <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#E88B5A', margin: '0 0 8px' }}>
          Animate — every format from one piece
        </p>
        {status !== 'ready' && (
          <>
            <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: 12, color: 'rgba(26,26,26,0.7)', margin: '0 0 16px' }}>
              {postBrief ? `Brief: ${postBrief}` : 'Build a 9:16 / 1:1 / 4:5 / 16:9 video set from the same draft.'}
            </p>
            <Field label="Style">
              <select value={style} onChange={(e) => setStyle(e.target.value as any)} style={selectStyle}>
                {STYLES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Formats (one or more)">
              <div style={{ display: 'grid', gap: 6 }}>
                {FORMATS.map((f) => (
                  <label key={f.value} style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'system-ui, sans-serif', fontSize: 13, color: '#1A1A1A' }}>
                    <input
                      type="checkbox"
                      checked={formats.includes(f.value)}
                      onChange={(e) => {
                        setFormats((arr) => e.target.checked ? [...arr, f.value] : arr.filter((x) => x !== f.value));
                      }}
                    />
                    {f.label}
                  </label>
                ))}
              </div>
            </Field>
            <Field label={`Seconds per slide: ${seconds.toFixed(1)}`}>
              <input
                type="range"
                min={0.5}
                max={5}
                step={0.1}
                value={seconds}
                onChange={(e) => setSeconds(parseFloat(e.target.value))}
                style={{ width: '100%' }}
              />
            </Field>
            {status === 'failed' && errorMsg && (
              <p style={{ color: '#E88B5A', fontFamily: 'system-ui, sans-serif', fontSize: 13, margin: '8px 0 0' }} role="alert">
                {errorMsg}
              </p>
            )}
            {status === 'building' && (
              <p style={{ color: 'rgba(26,26,26,0.7)', fontFamily: 'system-ui, sans-serif', fontSize: 13, margin: '8px 0 0' }}>
                Building… 30–90 s for 4 formats. ffmpeg is in the loop.
              </p>
            )}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
              <button onClick={onClose} style={secondaryBtn}>Cancel</button>
              <button
                onClick={start}
                disabled={status === 'building' || formats.length === 0}
                style={primaryBtn}
              >
                {status === 'building' ? 'Building…' : 'Animate'}
              </button>
            </div>
          </>
        )}
        {status === 'ready' && animation && (
          <>
            <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: 12, color: 'rgba(26,26,26,0.7)', margin: '0 0 12px' }}>
              Ready. {Math.round((animation.duration_ms || 0) / 1000)}s, style <code>{animation.style}</code>.
            </p>
            <div style={{ display: 'flex', gap: 4, marginBottom: 8, flexWrap: 'wrap' }}>
              {Object.keys(animation.mp4_paths).map((f) => (
                <button
                  key={f}
                  onClick={() => setActiveFormat(f)}
                  style={{
                    background: activeFormat === f ? '#1A1A1A' : '#FFFFFF',
                    color:      activeFormat === f ? '#FAF6EE' : '#1A1A1A',
                    border: '1px solid rgba(26,26,26,0.20)',
                    padding: '6px 10px',
                    fontFamily: 'system-ui, sans-serif',
                    fontSize: 11,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
            {animation.mp4_paths[activeFormat] && (
              <video
                key={activeFormat}
                src={`file://${animation.mp4_paths[activeFormat]}`}
                controls
                style={{ width: '100%', maxHeight: 480, background: '#1A1A1A' }}
              />
            )}
            <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: 11, color: 'rgba(26,26,26,0.5)', margin: '8px 0 0' }}>
              Files at <code>{animation.piece_dir}/renders/</code> — the next Export will include these MP4s.
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
              <button onClick={onClose} style={primaryBtn}>Close</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'block', marginBottom: 12 }}>
      <span style={{ display: 'block', fontFamily: 'system-ui, sans-serif', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(26,26,26,0.5)', marginBottom: 4 }}>
        {label}
      </span>
      {children}
    </label>
  );
}

const primaryBtn: React.CSSProperties = {
  background: '#1A1A1A', color: '#FAF6EE', border: 0, padding: '10px 16px',
  fontFamily: 'system-ui, sans-serif', fontSize: 11, letterSpacing: '0.12em',
  textTransform: 'uppercase', cursor: 'pointer',
};

const secondaryBtn: React.CSSProperties = {
  ...primaryBtn,
  background: '#FFFFFF',
  color: '#1A1A1A',
  border: '1px solid rgba(26,26,26,0.20)',
};

const selectStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  background: 'rgba(242,217,162,0.19)',
  border: '1px solid rgba(26,26,26,0.20)',
  color: '#1A1A1A',
  fontSize: 13,
  fontFamily: 'system-ui, sans-serif',
  boxSizing: 'border-box',
};
