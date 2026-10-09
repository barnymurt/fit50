import { isEditorSessionValid, isEditorPasswordValid } from '@/lib/editor-auth';

export const dynamic = 'force-dynamic';

export default async function EditorLayout({ children }: { children: React.ReactNode }) {
  const ok = await isEditorSessionValid();
  if (ok) return <>{children}</>;
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FAF6EE', padding: '24px' }}>
      <div style={{ maxWidth: 400, width: '100%', background: '#FFFFFF', border: '1px solid rgba(26,26,26,0.12)', padding: '32px' }}>
        <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#E88B5A', margin: 0 }}>
          Content engine
        </p>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 32, fontWeight: 400, color: '#1A1A1A', margin: '8px 0 24px' }}>
          Sign in
        </h1>
        <form method="post" action="/api/ce/auth">
          <label style={{ display: 'block', fontFamily: 'system-ui, sans-serif', fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(26,26,26,0.5)', marginBottom: 8 }}>
            Editor password
          </label>
          <input
            type="password"
            name="password"
            autoFocus
            required
            style={{
              width: '100%',
              padding: '12px 14px',
              background: 'rgba(242,217,162,0.19)',
              border: '2px solid rgba(26,26,26,0.20)',
              color: '#1A1A1A',
              fontFamily: 'system-ui, sans-serif',
              fontSize: 16,
              boxSizing: 'border-box',
            }}
          />
          <button
            type="submit"
            style={{
              marginTop: 16,
              width: '100%',
              padding: '14px 16px',
              background: '#E88B5A',
              color: '#FAF6EE',
              border: 0,
              fontFamily: 'system-ui, sans-serif',
              fontSize: 12,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            Sign in
          </button>
        </form>
        <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: 12, color: 'rgba(26,26,26,0.5)', marginTop: 24 }}>
          The default password is <code style={{ background: 'rgba(242,217,162,0.19)', padding: '2px 6px' }}>fit50</code>. Set <code style={{ background: 'rgba(242,217,162,0.19)', padding: '2px 6px' }}>EDITOR_PASSWORD</code> in your env to override.
        </p>
      </div>
    </div>
  );
}
