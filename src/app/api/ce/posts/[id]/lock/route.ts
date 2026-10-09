import { NextRequest, NextResponse } from 'next/server';
import { getPost, saveNewVersion, logGeneration } from '@/lib/ce-helpers';
import { isEditorSessionValid } from '@/lib/editor-auth';

// POST /api/ce/posts/:id/lock?field=slides.0.fields.headline
// Body: { locked: boolean }
// Toggles a field's lock. The current version's doc is mutated
// in place and a new version is created (so the lock is itself
// versioned).

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isEditorSessionValid())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { id } = await ctx.params;
  const fieldPath = req.nextUrl.searchParams.get('field');
  if (!fieldPath) return NextResponse.json({ error: 'field query required' }, { status: 400 });
  try {
    const { locked } = await req.json();
    const result = await getPost(id);
    if (!result || !result.version) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    const doc = JSON.parse(JSON.stringify(result.version.doc));
    const parts = fieldPath.split('.');
    let cur: any = doc;
    for (let i = 0; i < parts.length - 1; i++) {
      const k = /^\d+$/.test(parts[i]) ? Number(parts[i]) : parts[i];
      cur = cur[k];
      if (!cur) return NextResponse.json({ error: 'field_not_found' }, { status: 404 });
    }
    const last = parts[parts.length - 1];
    if (typeof cur !== 'object' || cur === null) {
      return NextResponse.json({ error: 'field_not_editable' }, { status: 400 });
    }
    cur[last] = { ...cur[last], locked: !!locked };
    const res = await saveNewVersion(id, doc, { savedBy: 'human', note: `lock ${fieldPath} = ${!!locked}` });
    await logGeneration({ post_id: id, kind: 'lock', model: 'editor', pillar: res.post.pillar, passed_checks: true, notes: fieldPath });
    return NextResponse.json(res);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
