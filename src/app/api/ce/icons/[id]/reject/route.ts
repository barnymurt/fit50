import { NextRequest, NextResponse } from 'next/server';
import { rejectIcon } from '@/lib/ce-helpers';
import { isEditorSessionValid } from '@/lib/editor-auth';

export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isEditorSessionValid())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { id } = await ctx.params;
  try {
    const icon = await rejectIcon(id);
    return NextResponse.json({ icon });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
