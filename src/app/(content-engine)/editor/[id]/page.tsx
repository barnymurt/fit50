'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

interface PostRow {
  id: string;
  current_version_id: string | null;
  pillar: string;
  status: string;
  aspect: string;
  platform: string;
  marquee: string | null;
}

interface VersionRow {
  id: string;
  version: number;
  doc: any;
  saved_by: string;
  note: string | null;
  created_at: string;
}

const PALETTE = {
  ink: '#1A1A1A',
  paper: '#FAF6EE',
  coral: '#E88B5A',
  teal: '#4A9B9B',
  cream: '#F2D9A2',
  lavender: '#D8B8D0',
  white: '#FFFFFF',
  rule: 'rgba(26,26,26,0.12)',
};

function groundColor(ground: string): string {
  const map: Record<string, string> = {
    paper: PALETTE.paper,
    teal: PALETTE.teal,
    lavender: PALETTE.lavender,
    ink: PALETTE.ink,
    white: PALETTE.white,
    cream: PALETTE.cream,
  };
  return map[ground] || PALETTE.paper;
}

function groundTextColor(ground: string): string {
  return ['paper', 'lavender', 'white', 'cream'].includes(ground) ? PALETTE.ink : PALETTE.paper;
}

function emphasisToHtml(text: string): string {
  return text.replace(/\*([^*]+)\*/g, '<em>$1</em>');
}

export default function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const [post, setPost] = useState<PostRow | null>(null);
  const [doc, setDoc] = useState<any | null>(null);
  const [currentVersionId, setCurrentVersionId] = useState<string | null>(null);
  const [versions, setVersions] = useState<VersionRow[]>([]);
  const [slideIdx, setSlideIdx] = useState(0);
  const [flags, setFlags] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [rewriteFor, setRewriteFor] = useState<string | null>(null);
  const [rewriteOptions, setRewriteOptions] = useState<string[]>([]);
  const [rewriteReason, setRewriteReason] = useState('');
  const [postId, setPostId] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { id } = await params;
      if (!cancelled) setPostId(id);
    })();
    return () => { cancelled = true; };
  }, [params]);

  useEffect(() => {
    if (!postId) return;
    (async () => {
      const [postRes, versionsRes] = await Promise.all([
        fetch(`/api/ce/posts/${postId}`),
        fetch(`/api/ce/posts/${postId}/versions`),
      ]);
      const postData = await postRes.json();
      if (postRes.ok) {
        setPost(postData.post);
        setDoc(postData.version?.doc || null);
        setCurrentVersionId(postData.post.current_version_id);
      }
      const versionsData = await versionsRes.json();
      if (versionsRes.ok) setVersions(versionsData.versions || []);
    })();
  }, [postId]);

  const aspect = post?.aspect || '4:5';

  const updateField = useCallback((path: string, value: any) => {
    setDoc((d: any) => {
      if (!d) return d;
      const parts = path.split('.');
      const next = JSON.parse(JSON.stringify(d));
      let cur: any = next;
      for (let i = 0; i < parts.length - 1; i++) {
        const k = /^\d+$/.test(parts[i]) ? Number(parts[i]) : parts[i];
        cur = cur[k];
      }
      const last = parts[parts.length - 1];
      if (typeof cur !== 'object' || cur === null) return d;
      const oldValue = cur[last];
      if (oldValue && typeof oldValue === 'object' && 'text' in oldValue) {
        cur[last] = { ...oldValue, text: value, by: 'human' };
      } else {
        cur[last] = value;
      }
      return next;
    });
  }, []);

  const lockField = useCallback(async (path: string, locked: boolean) => {
    setBusy(true);
    const r = await fetch(`/api/ce/posts/${postId}/lock?field=${encodeURIComponent(path)}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ locked }),
    });
    const j = await r.json();
    setBusy(false);
    if (r.ok) {
      setDoc(j.version.doc);
      setCurrentVersionId(j.version.id);
      setFlags(j.flags || []);
    } else {
      alert(`Lock failed: ${j.error || 'unknown'}`);
    }
  }, [postId]);

  const saveDraft = useCallback(async (note?: string) => {
    if (!doc) return;
    setBusy(true);
    const r = await fetch(`/api/ce/posts/${postId}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ doc, savedBy: 'human', note }),
    });
    const j = await r.json();
    setBusy(false);
    if (r.ok) {
      setCurrentVersionId(j.version.id);
      setFlags(j.flags || []);
      const vRes = await fetch(`/api/ce/posts/${postId}/versions`);
      const vData = await vRes.json();
      if (vRes.ok) setVersions(vData.versions || []);
    } else if (j.issues) {
      setFlags(j.issues);
    } else {
      alert(`Save failed: ${j.error || 'unknown'}`);
    }
  }, [doc, postId]);

  const rewriteField = useCallback(async (path: string, current: string) => {
    setBusy(true);
    const r = await fetch(`/api/ce/posts/${postId}/rewrite?field=${encodeURIComponent(path)}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ current, brief: doc?.brief, pillar: post?.pillar }),
    });
    const j = await r.json();
    setBusy(false);
    if (r.ok) {
      setRewriteOptions(j.options || []);
      setRewriteFor(path);
      setRewriteReason('');
    } else {
      alert(`Rewrite failed: ${j.error || 'unknown'}`);
    }
  }, [postId, doc?.brief, post?.pillar]);

  const captureCorrection = useCallback(async (path: string, before: any, after: any, reason: string) => {
    setBusy(true);
    const r = await fetch(`/api/ce/posts/${postId}/captures`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ field_path: path, before, after, reason }),
    });
    setBusy(false);
    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      alert(`Capture failed: ${j.error || 'unknown'}`);
    }
  }, [postId]);

  const applyRewrite = useCallback((option: string) => {
    if (!rewriteFor) return;
    const slide = doc?.slides?.[slideIdx];
    if (!slide) return;
    const before = getFieldValue(slide, getFieldKeyForRewrite(rewriteFor));
    updateField(rewriteFor, option);
    if (before !== null && before !== option) {
      captureCorrection(rewriteFor, before, option, rewriteReason || '');
    }
    setRewriteFor(null);
  }, [rewriteFor, rewriteReason, doc, slideIdx, updateField, captureCorrection]);

  const revertToVersion = useCallback(async (versionId: string) => {
    setBusy(true);
    const r = await fetch(`/api/ce/posts/${postId}/revert`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ version_id: versionId }),
    });
    const j = await r.json();
    setBusy(false);
    if (r.ok) {
      setDoc(j.version.doc);
      setCurrentVersionId(j.version.id);
      const vRes = await fetch(`/api/ce/posts/${postId}/versions`);
      const vData = await vRes.json();
      if (vRes.ok) setVersions(vData.versions || []);
    } else {
      alert(`Revert failed: ${j.error || 'unknown'}`);
    }
  }, [postId]);

  const exportZip = useCallback(async () => {
    setBusy(true);
    const r = await fetch(`/api/ce/posts/${postId}/export`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({}) });
    const j = await r.json();
    setBusy(false);
    if (r.ok) {
      const bin = atob(j.zip_base64);
      const arr = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
      const blob = new Blob([arr], { type: 'application/zip' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = j.filename || `FIT50_${postId}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      alert(`Export failed: ${j.error || 'unknown'}`);
    }
  }, [postId]);

  if (!post || !doc) {
    return <div style={{ padding: 40, fontFamily: 'system-ui, sans-serif' }}>Loading…</div>;
  }

  const currentSlide = doc.slides?.[slideIdx];

  // Canvas preview — half-size proportional to 1080. The actual
  // pixel-perfect render happens at export time via the server
  // route, which uses the same templates.
  const canvasW = 540;
  const canvasH = aspect === '9:16' ? 960 : 675;

  return (
    <div style={{ minHeight: '100vh', background: PALETTE.paper, display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 20px', background: '#FFFFFF', borderBottom: `1px solid ${PALETTE.rule}` }}>
        <Link href="/editor" style={{ fontFamily: 'Georgia, serif', fontSize: 14, color: PALETTE.ink, textDecoration: 'none' }}>
          ← Posts
        </Link>
        <span style={{ fontFamily: 'Georgia, serif', fontSize: 18, color: PALETTE.ink }}>{post.id}</span>
        <span style={{ background: 'rgba(26,26,26,0.08)', color: PALETTE.ink, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '2px 8px' }}>
          {post.pillar}
        </span>
        <span style={{ background: 'rgba(74,155,155,0.18)', color: PALETTE.ink, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '2px 8px' }}>
          {post.platform} · {post.aspect}
        </span>
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: 12, color: 'rgba(26,26,26,0.5)' }}>{flags.length} flag{flags.length !== 1 ? 's' : ''}</span>
        <button onClick={() => saveDraft('manual save')} disabled={busy} style={primaryBtn}>Save</button>
        <button onClick={exportZip} disabled={busy} style={secondaryBtn}>Export</button>
      </div>

      {/* 3-pane layout */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '180px 1fr 340px', minHeight: 0 }}>
        {/* Slide strip */}
        <div style={{ background: '#FFFFFF', borderRight: `1px solid ${PALETTE.rule}`, overflowY: 'auto', padding: 8 }}>
          {doc.slides?.map((s: any, i: number) => (
            <button
              key={s.id}
              onClick={() => setSlideIdx(i)}
              style={{
                display: 'block',
                width: '100%',
                marginBottom: 6,
                padding: 6,
                background: i === slideIdx ? 'rgba(232,139,90,0.18)' : 'transparent',
                border: i === slideIdx ? `2px solid ${PALETTE.coral}` : `1px solid ${PALETTE.rule}`,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div style={{ fontFamily: 'system-ui, sans-serif', fontSize: 11, color: 'rgba(26,26,26,0.6)', textTransform: 'uppercase' }}>
                {i + 1} · {s.template}
              </div>
              <div style={{ fontFamily: 'system-ui, sans-serif', fontSize: 12, color: PALETTE.ink, marginTop: 2 }}>
                {s.fields?.headline?.text?.slice(0, 40) || s.fields?.title?.text?.slice(0, 40) || '—'}
              </div>
            </button>
          ))}
        </div>

        {/* Canvas — half-size preview. Server-side render of the
            actual slide happens at export time. */}
        <div style={{ overflow: 'auto', padding: 24, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', background: 'rgba(26,26,26,0.04)' }}>
          {currentSlide ? (
            <div style={{
              background: groundColor(currentSlide.ground),
              color: groundTextColor(currentSlide.ground),
              width: canvasW,
              height: canvasH,
              padding: 40,
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: 20,
              fontFamily: 'Georgia, serif',
              border: `1px solid ${PALETTE.rule}`,
            }}>
              <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.7, margin: 0 }}>
                {currentSlide.fields?.eyebrow?.text || ''}
              </p>
              <h1 style={{ fontSize: 40, fontWeight: 400, lineHeight: 1, margin: 0 }}
                  dangerouslySetInnerHTML={{ __html: emphasisToHtml(currentSlide.fields?.headline?.text || currentSlide.fields?.title?.text || currentSlide.fields?.letter || '') }} />
              {currentSlide.template === 'workout-line' && currentSlide.fields?.exercises && (
                <ol style={{ fontSize: 14, listStyle: 'none', padding: 0, margin: 0 }}>
                  {currentSlide.fields.exercises.map((ex: any, i: number) => (
                    <li key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${PALETTE.rule}` }}>
                      <span>{ex.name}</span>
                      <span style={{ color: PALETTE.coral }}>{ex.sets} × {ex.reps}</span>
                    </li>
                  ))}
                </ol>
              )}
              {currentSlide.template === 'list' && currentSlide.fields?.items && (
                <ul style={{ fontSize: 16, listStyle: 'none', padding: 0, margin: 0 }}>
                  {currentSlide.fields.items.map((item: any, i: number) => (
                    <li key={i} style={{ padding: '6px 0', borderBottom: `1px solid ${PALETTE.rule}` }}>{item.title}</li>
                  ))}
                </ul>
              )}
              {currentSlide.fields?.body && (
                <p style={{ fontSize: 16, lineHeight: 1.45, margin: 0 }}
                   dangerouslySetInnerHTML={{ __html: emphasisToHtml(currentSlide.fields.body.text || '') }} />
              )}
              {currentSlide.fields?.sub && (
                <p style={{ fontSize: 14, opacity: 0.7, margin: 0 }}
                   dangerouslySetInnerHTML={{ __html: emphasisToHtml(currentSlide.fields.sub.text || '') }} />
              )}
              {currentSlide.fields?.button && (
                <span style={{ background: PALETTE.coral, color: PALETTE.paper, padding: '12px 24px', fontFamily: 'system-ui, sans-serif', fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', alignSelf: 'center' }}>
                  {currentSlide.fields.button.text}
                </span>
              )}
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 16px', background: 'rgba(26,26,26,0.85)', color: '#FAF6EE', fontFamily: 'Lilita One, Impact, sans-serif', fontSize: 14, textAlign: 'center', letterSpacing: '0.08em' }}>
                {doc.marquee || '50 DAYS ✦ 9 HABITS ✦ BLAME US'}
              </div>
            </div>
          ) : null}
        </div>

        {/* Properties */}
        <div style={{ background: '#FFFFFF', borderLeft: `1px solid ${PALETTE.rule}`, overflowY: 'auto' }}>
          {currentSlide ? <Properties
            slide={currentSlide}
            slideIdx={slideIdx}
            flags={flags.filter((f) => f.slideId === currentSlide.id)}
            onUpdate={updateField}
            onLock={lockField}
            onRewrite={rewriteField}
            busy={busy}
          /> : null}
          <div style={{ borderTop: `1px solid ${PALETTE.rule}`, padding: 12 }}>
            <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(26,26,26,0.5)', margin: '0 0 8px' }}>
              Versions
            </p>
            {versions.slice(0, 12).map((v) => (
              <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0', borderTop: '1px solid rgba(26,26,26,0.06)' }}>
                <span style={{ fontFamily: 'system-ui, sans-serif', fontSize: 12, color: v.id === currentVersionId ? PALETTE.coral : PALETTE.ink, fontWeight: v.id === currentVersionId ? 600 : 400 }}>
                  v{v.version}
                </span>
                <span style={{ fontFamily: 'system-ui, sans-serif', fontSize: 11, color: 'rgba(26,26,26,0.5)' }}>
                  {v.saved_by} · {new Date(v.created_at).toLocaleTimeString()}
                </span>
                {v.note && <span style={{ fontFamily: 'system-ui, sans-serif', fontSize: 11, color: 'rgba(26,26,26,0.5)', fontStyle: 'italic' }}>· {v.note}</span>}
                <span style={{ flex: 1 }} />
                {v.id !== currentVersionId && (
                  <button onClick={() => revertToVersion(v.id)} disabled={busy} style={tinyBtn}>Revert</button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {rewriteFor && (
        <RewriteModal
          options={rewriteOptions}
          reason={rewriteReason}
          setReason={setRewriteReason}
          onPick={applyRewrite}
          onClose={() => setRewriteFor(null)}
        />
      )}
    </div>
  );
}

function getFieldValue(slide: any, key: string): any {
  if (!slide?.fields) return null;
  return (slide.fields as any)[key] ?? null;
}

function getFieldKeyForRewrite(path: string): string {
  const parts = path.split('.');
  return parts[parts.length - 1] || '';
}

function Properties({ slide, slideIdx, flags, onUpdate, onLock, onRewrite, busy }: {
  slide: any; slideIdx: number; flags: any[];
  onUpdate: (path: string, value: any) => void;
  onLock: (path: string, locked: boolean) => Promise<void>;
  onRewrite: (path: string, current: string) => Promise<void>;
  busy: boolean;
}) {
  const fieldEntries = Object.entries(slide.fields || {});
  return (
    <div style={{ padding: 12 }}>
      <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(26,26,26,0.5)', margin: '0 0 4px' }}>
        Slide {slideIdx + 1} · {slide.template}
      </p>
      <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: 11, color: 'rgba(26,26,26,0.5)', margin: '0 0 12px' }}>
        ground: {slide.ground}
      </p>
      {fieldEntries.map(([key, value]) => {
        const path = `slides.${slideIdx}.fields.${key}`;
        const field = value as any;
        if (field && typeof field === 'object' && 'text' in field) {
          const isLocked = !!field.locked;
          return (
            <div key={key} style={{ marginBottom: 12, padding: 8, background: isLocked ? 'rgba(242,217,162,0.19)' : 'transparent', border: `1px solid ${PALETTE.rule}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontFamily: 'system-ui, sans-serif', fontSize: 11, color: 'rgba(26,26,26,0.6)', flex: 1 }}>{key}</span>
                <span style={{ fontFamily: 'system-ui, sans-serif', fontSize: 10, color: 'rgba(26,26,26,0.5)' }}>{field.by || 'human'}</span>
                <button onClick={() => onLock(path, !isLocked)} disabled={busy} style={tinyBtn}>
                  {isLocked ? '🔒' : '🔓'}
                </button>
                <button onClick={() => onRewrite(path, field.text || '')} disabled={busy || isLocked} style={tinyBtn}>
                  Rewrite
                </button>
              </div>
              <textarea
                value={field.text || ''}
                onChange={(e) => onUpdate(path, e.target.value)}
                disabled={isLocked}
                rows={Math.max(2, Math.min(8, (field.text || '').split('\n').length + 1))}
                style={{
                  width: '100%',
                  padding: 8,
                  background: isLocked ? 'rgba(26,26,26,0.04)' : 'rgba(242,217,162,0.19)',
                  border: `1px solid ${PALETTE.rule}`,
                  color: PALETTE.ink,
                  fontSize: 13,
                  fontFamily: 'system-ui, sans-serif',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                }}
              />
              <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: 10, color: 'rgba(26,26,26,0.5)', margin: '4px 0 0' }}>
                {(field.text || '').length} chars
              </p>
            </div>
          );
        }
        if (Array.isArray(field)) {
          return (
            <div key={key} style={{ marginBottom: 12, padding: 8, border: `1px solid ${PALETTE.rule}` }}>
              <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: 11, color: 'rgba(26,26,26,0.6)', margin: '0 0 4px' }}>{key} (list)</p>
              {field.map((item: any, i: number) => (
                <div key={i} style={{ marginBottom: 6, padding: 6, background: 'rgba(242,217,162,0.19)' }}>
                  <input
                    value={item.title || ''}
                    onChange={(e) => onUpdate(`slides.${slideIdx}.fields.${key}.${i}.title`, e.target.value)}
                    placeholder="Title"
                    style={{ width: '100%', padding: 6, background: '#FFFFFF', border: `1px solid ${PALETTE.rule}`, fontSize: 13, boxSizing: 'border-box' }}
                  />
                </div>
              ))}
            </div>
          );
        }
        return null;
      })}
      {flags.length > 0 && (
        <div style={{ marginTop: 12, padding: 8, background: 'rgba(232,139,90,0.10)', border: `1px solid ${PALETTE.coral}` }}>
          <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: PALETTE.coral, margin: '0 0 4px' }}>
            Flags ({flags.length})
          </p>
          {flags.map((f, i) => (
            <p key={i} style={{ fontFamily: 'system-ui, sans-serif', fontSize: 12, color: PALETTE.ink, margin: '2px 0' }}>
              · {f.field || ''}: {f.message}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

function RewriteModal({ options, reason, setReason, onPick, onClose }: {
  options: string[]; reason: string; setReason: (s: string) => void;
  onPick: (opt: string) => void; onClose: () => void;
}) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(26,26,26,0.40)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
      <div style={{ background: '#FFFFFF', padding: 24, maxWidth: 600, width: '100%', border: `1px solid ${PALETTE.rule}` }}>
        <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: PALETTE.coral, margin: '0 0 8px' }}>
          Rewrite — 3 options
        </p>
        {options.map((o, i) => (
          <div key={i} style={{ marginBottom: 12, padding: 12, background: i === 0 ? 'rgba(242,217,162,0.19)' : '#FFFFFF', border: `1px solid ${PALETTE.rule}` }}>
            <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: 12, color: 'rgba(26,26,26,0.5)', margin: '0 0 4px' }}>option {i + 1}{i === 0 ? ' (current)' : ''}</p>
            <p style={{ fontFamily: 'Georgia, serif', fontSize: 16, color: PALETTE.ink, margin: '0 0 8px' }}>{o}</p>
            {i !== 0 && (
              <button onClick={() => onPick(o)} style={primaryBtn}>Use this</button>
            )}
          </div>
        ))}
        <div style={{ marginTop: 16 }}>
          <label style={{ display: 'block', marginBottom: 12 }}>
            <span style={{ fontFamily: 'system-ui, sans-serif', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(26,26,26,0.5)', display: 'block', marginBottom: 4 }}>
              Why? (optional — captured in content_corrections)
            </span>
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="off-voice / too long / too salesy / cringe"
              style={{ width: '100%', padding: 8, background: 'rgba(242,217,162,0.19)', border: `1px solid ${PALETTE.rule}`, fontSize: 13, boxSizing: 'border-box' }}
            />
          </label>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={secondaryBtn}>Close</button>
        </div>
      </div>
    </div>
  );
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

const tinyBtn: React.CSSProperties = {
  background: '#FFFFFF',
  color: '#1A1A1A',
  border: '1px solid rgba(26,26,26,0.20)',
  padding: '4px 8px',
  fontFamily: 'system-ui, sans-serif',
  fontSize: 10,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  cursor: 'pointer',
};
