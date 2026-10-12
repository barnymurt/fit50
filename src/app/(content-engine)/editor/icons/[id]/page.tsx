import Link from 'next/link';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { notFound } from 'next/navigation';
import { isEditorSessionValid } from '@/lib/editor-auth';

const ICON_DIR = join(process.cwd(), 'tools', 'content-engine', 'brand', 'icons');

const GROUNDS: Array<{ name: string; bg: string; fg: string }> = [
  { name: 'paper',    bg: '#FAF6EE', fg: '#1A1A1A' },
  { name: 'teal',     bg: '#4A9B9B', fg: '#FAF6EE' },
  { name: 'lavender', bg: '#D8B8D0', fg: '#1A1A1A' },
  { name: 'ink',      bg: '#1A1A1A', fg: '#FAF6EE' },
  { name: 'white',    bg: '#FFFFFF', fg: '#1A1A1A' },
  { name: 'cream',    bg: '#F2D9A2', fg: '#1A1A1A' },
];

export const dynamic = 'force-dynamic';

export default async function IconDetail({ params }: { params: Promise<{ id: string }> }) {
  if (!(await isEditorSessionValid())) {
    return <div style={{ padding: 40 }}>Sign in at <Link href="/editor">/editor</Link>.</div>;
  }
  const { id } = await params;
  // We read the SVG file from disk for the preview. The DB
  // metadata comes from the API; this page is a Server
  // Component so we can read the file directly.
  let svg: string | null = null;
  let metadata: any = null;
  try {
    const res = await fetch(`http://localhost:${process.env.PORT || 3000}/api/ce/icons/${id}`, { cache: 'no-store' });
    if (res.ok) {
      const j = await res.json();
      metadata = j.icon;
      if (metadata?.svg_path) {
        const path = join(ICON_DIR, metadata.svg_path);
        svg = await readFile(path, 'utf8');
        // Strip XML declaration
        svg = svg.replace(/<\?xml[^?]*\?>/, '').trim();
      }
    }
  } catch (err) {
    // Ignore — we render an error below
  }

  if (!metadata) {
    // Fall back: maybe the icon isn't in the DB yet (file-only
    // for v1 of the originals). Read directly from disk.
    const directPath = join(ICON_DIR, `${id}.svg`);
    try {
      const raw = await readFile(directPath, 'utf8');
      svg = raw.replace(/<\?xml[^?]*\?>/, '').trim();
      metadata = { id, tags: [], description: 'From disk (no DB row)', source: 'live-app', approval_status: 'approved' };
    } catch {
      notFound();
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <Link href="/editor/icons" style={{ fontFamily: 'Georgia, serif', fontSize: 14, color: '#1A1A1A', textDecoration: 'none' }}>
          ← Icons
        </Link>
        <span style={{ background: 'rgba(26,26,26,0.08)', color: '#1A1A1A', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '2px 8px' }}>
          {metadata.approval_status}
        </span>
      </div>

      <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 32, fontWeight: 400, color: '#1A1A1A', margin: '0 0 8px' }}>
        {metadata.id}
      </h1>
      <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: 14, color: 'rgba(26,26,26,0.7)', margin: '0 0 24px' }}>
        {metadata.description}
      </p>

      <h2 style={{ fontFamily: 'system-ui, sans-serif', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(26,26,26,0.5)', margin: '0 0 12px' }}>
        Ground swap test
      </h2>
      <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: 12, color: 'rgba(26,26,26,0.5)', margin: '0 0 12px' }}>
        The icon should be visible on every ground. Each tile renders the icon at 200px on the ground named above it.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        {GROUNDS.map((g) => (
          <div key={g.name} style={{ background: g.bg, color: g.fg, padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 240 }}>
            {svg ? (
              <div
                style={{ width: 200, height: 200, color: g.fg }}
                dangerouslySetInnerHTML={{ __html: svg }}
              />
            ) : (
              <span style={{ fontFamily: 'system-ui, sans-serif', fontSize: 12 }}>no svg</span>
            )}
          </div>
        ))}
      </div>

      <h2 style={{ fontFamily: 'system-ui, sans-serif', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(26,26,26,0.5)', margin: '0 0 12px' }}>
        Metadata
      </h2>
      <pre style={{ fontFamily: 'system-ui, sans-serif', fontSize: 12, background: '#FFFFFF', padding: 12, border: '1px solid rgba(26,26,26,0.12)', whiteSpace: 'pre-wrap' }}>
        {JSON.stringify(metadata, null, 2)}
      </pre>
    </div>
  );
}
