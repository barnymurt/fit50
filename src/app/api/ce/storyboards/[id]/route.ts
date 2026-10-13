import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { isEditorSessionValid } from '@/lib/editor-auth';

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isEditorSessionValid())) return NextResponse.json({ error: 'editor_session_required' }, { status: 401 });
  const { id } = await ctx.params;
  const sb = createAdminClient() as any;
  const { data, error } = await sb.from('content_storyboards').select('*').eq('id', id).maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return NextResponse.json({ storyboard: data });
}
