import { NextRequest, NextResponse } from 'next/server';
import { getPost, saveNewVersion, logGeneration } from '@/lib/ce-helpers';
import { isEditorSessionValid } from '@/lib/editor-auth';

// POST /api/ce/posts/:id/rewrite?field=slides.0.fields.headline
// Body: { current: string, brief?: string }
// Returns 3 options. The first is the current text. The other
// two are deterministic mutations — Phase 6 wires the real
// small model (Claude Haiku 4.5 per the spec). The UI flow
// is identical; the call body changes.

function variantsFor(input: string, brief?: string): string[] {
  const trimmed = input.trim();
  if (!trimmed) return ['', '', ''];
  const withItalic = trimmed.includes('*') ? trimmed : `*${trimmed.replace(/\.$/, '')}*`;
  const sharper = brief ? `${trimmed.replace(/\.$/, '')} — ${brief.split(' ').slice(0, 4).join(' ')}.` : `${trimmed.replace(/\.$/, '')}.`;
  const shorter = trimmed.split(' ').slice(0, Math.max(3, Math.floor(trimmed.split(' ').length * 0.6))).join(' ');
  return [trimmed, withItalic, shorter || sharper];
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isEditorSessionValid())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { id } = await ctx.params;
  const fieldPath = req.nextUrl.searchParams.get('field');
  if (!fieldPath) return NextResponse.json({ error: 'field query required' }, { status: 400 });
  try {
    const body = await req.json();
    const current: string = body.current || '';
    const brief: string | undefined = body.brief;
    const options = variantsFor(current, brief);
    await logGeneration({
      post_id: id,
      kind: 'rewrite',
      model: 'stub-haiku-4.5',
      pillar: body.pillar,
      tokens_in: current.length,
      tokens_out: options.join(' ').length,
      est_cost_usd: 0.0008,
      passed_checks: true,
      notes: fieldPath,
    });
    return NextResponse.json({ options });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
