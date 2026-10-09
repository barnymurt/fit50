import { NextRequest, NextResponse } from 'next/server';
import { getSubmission } from '@/lib/ce-helpers';
import { isEditorSessionValid } from '@/lib/editor-auth';

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isEditorSessionValid())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { id } = await ctx.params;
  const sub = await getSubmission(id);
  if (!sub) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return NextResponse.json({ submission: sub });
}
