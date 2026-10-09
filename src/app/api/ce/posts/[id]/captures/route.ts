import { NextRequest, NextResponse } from 'next/server';
import { logCorrection, getPost } from '@/lib/ce-helpers';
import { isEditorSessionValid } from '@/lib/editor-auth';

// POST /api/ce/posts/:id/captures
// Body: { field_path, before, after, reason }
// Records a before/after pair against the current version.

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isEditorSessionValid())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { id } = await ctx.params;
  try {
    const body = await req.json();
    const result = await getPost(id);
    if (!result) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    await logCorrection({
      post_id: id,
      version_id: result.post.current_version_id,
      field_path: body.field_path,
      pillar: result.post.pillar,
      before: body.before,
      after: body.after,
      reason: body.reason || null,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
