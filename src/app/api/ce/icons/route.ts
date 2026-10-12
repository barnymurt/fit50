import { NextRequest, NextResponse } from 'next/server';
import { listIcons } from '@/lib/ce-helpers';
import { isEditorSessionValid } from '@/lib/editor-auth';

export async function GET(req: NextRequest) {
  if (!(await isEditorSessionValid())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const status = req.nextUrl.searchParams.get('status') || undefined;
  const q = req.nextUrl.searchParams.get('q') || undefined;
  const tag = req.nextUrl.searchParams.get('tag') || undefined;
  const icons = await listIcons({ status, q, tag });
  return NextResponse.json({ icons });
}
