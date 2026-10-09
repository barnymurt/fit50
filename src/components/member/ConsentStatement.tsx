// ConsentStatement.tsx — the consent wording every member
// intake form uses. Drafted by the engine, not legal advice.
// The open-questions list from the original spec still owes a
// GDPR-grade review by a qualified person before the first
// member feature goes out.

'use client';

interface Props {
  type: 'progress' | 'book' | 'project';
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string | null;
}

const SCOPE: Record<Props['type'], string> = {
  progress: 'Your progress update',
  book: 'Your book and your ideas about it',
  project: 'Your project and the milestones you describe',
};

export function ConsentStatement({ type, checked, onChange, error }: Props) {
  return (
    <div
      style={{
        marginTop: 16,
        padding: 16,
        background: 'rgba(242,217,162,0.19)',
        border: '1px solid rgba(26,26,26,0.20)',
      }}
    >
      <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(26,26,26,0.5)', margin: '0 0 8px' }}>
        What you are agreeing to
      </p>
      <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: 13, color: '#1A1A1A', margin: '0 0 8px', lineHeight: 1.5 }}>
        <strong>{SCOPE[type]}</strong> may be used by FIT50 in a content-engine-generated post on Instagram, Facebook and TikTok, in the form of an image carousel or a TikTok slide deck. Your credit preference (full name, first name, or anonymous) is honoured.
      </p>
      <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: 13, color: '#1A1A1A', margin: '0 0 8px', lineHeight: 1.5 }}>
        You can withdraw this consent at any time. Withdrawing flags every post that uses this submission for takedown; the team will remove the post from the next content cycle.
      </p>
      <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: 11, color: 'rgba(26,26,26,0.5)', margin: '0 0 12px', fontStyle: 'italic' }}>
        (This is a draft statement. Final wording will be reviewed before the first member feature ships.)
      </p>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} style={{ width: 18, height: 18 }} />
        <span style={{ fontFamily: 'system-ui, sans-serif', fontSize: 13, color: '#1A1A1A' }}>
          I agree.
        </span>
      </label>
      {error && (
        <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: 12, color: '#E88B5A', margin: '8px 0 0' }} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
