import { NextRequest, NextResponse } from 'next/server';
import { getVersionById, saveNewVersion, getPost, logGeneration } from '@/lib/ce-helpers';
import { isEditorSessionValid } from '@/lib/editor-auth';

// POST /api/ce/posts/:id/revert
// Body: { version_id }
// Reverts to an earlier version. Implementation: copies the
// earlier version's doc into a NEW current version (so the
// history records the revert as a step).

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isEditorSessionValid())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { id } = await ctx.params;
  try {
    const { version_id } = await req.json();
    const target = await getVersionById(version_id);
    if (!target) return NextResponse.json({ error: 'version_not_found' }, { status: 404 });
    if (target.post_id !== id) return NextResponse.json({ error: 'version_post_mismatch' }, { status: 400 });
    const post = await getPost(id);
    if (!post) return NextResponse.json({ error: 'post_not_found' }, { status: 404 });
    const res = await saveNewVersion(id, target.doc, { savedBy: 'human', note: `revert to v${target.version}` });
    await logGeneration({ post_id: id, kind: 'revert', model: 'editor', pillar: post.post.pillar, passed_checks: true, notes: `v${target.version}` });
    return NextResponse.json(res);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
