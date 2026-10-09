import { NextRequest, NextResponse } from 'next/server';
import { getPost, saveNewVersion } from '@/lib/ce-helpers';
import { isEditorSessionValid } from '@/lib/editor-auth';
import { Post } from '@/ce-content-engine/schema/post';

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isEditorSessionValid())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { id } = await ctx.params;
  const result = await getPost(id);
  if (!result) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return NextResponse.json(result);
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isEditorSessionValid())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { id } = await ctx.params;
  try {
    const body = await req.json();
    const { doc, savedBy, note } = body;
    // Pre-validate the Zod schema; surface issues to the client
    const parsed = Post.safeParse(doc);
    if (!parsed.success) {
      const issues = parsed.error.issues.map((i) => ({
        path: i.path.join('.'),
        message: i.message,
      }));
      return NextResponse.json({ error: 'schema_failed', issues }, { status: 422 });
    }
    const res = await saveNewVersion(id, doc, { savedBy: savedBy || 'human', note });
    return NextResponse.json(res);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
