import { NextRequest, NextResponse } from 'next/server';
import { getIcon } from '@/lib/ce-helpers';
import { isEditorSessionValid } from '@/lib/editor-auth';

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isEditorSessionValid())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { id } = await ctx.params;
  const icon = await getIcon(id);
  if (!icon) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return NextResponse.json({ icon });
}
