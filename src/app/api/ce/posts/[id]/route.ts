import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { isEditorSessionValid } from '@/lib/editor-auth';
import { Post } from '@/ce-content-engine/schema/post';

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isEditorSessionValid())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { id } = await ctx.params;
  const sb = createAdminClient() as any;
  const { data: post, error: postErr } = await sb.from('content_posts').select('*').eq('id', id).maybeSingle();
  if (postErr) return NextResponse.json({ error: postErr.message }, { status: 500 });
  if (!post) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  const { data: ver, error: verErr } = await sb.from('content_post_versions').select('*').eq('id', post.current_version_id).maybeSingle();
  if (verErr) return NextResponse.json({ error: verErr.message }, { status: 500 });
  return NextResponse.json({ post, version: ver });
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isEditorSessionValid())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { id } = await ctx.params;
  try {
    const body = await req.json();
    const doc = body.doc;
    const parsed = Post.safeParse(doc);
    if (!parsed.success) {
      return NextResponse.json({ error: 'schema_failed', issues: parsed.error.issues }, { status: 422 });
    }
    const sb = createAdminClient() as any;
    const { data: existing } = await sb.from('content_post_versions')
      .select('version').eq('post_id', id).order('version', { ascending: false }).limit(1);
    const nextVersion = (existing && existing[0]?.version) ? existing[0].version + 1 : 1;
    const { data: ver, error: verErr } = await sb.from('content_post_versions')
      .insert({
        post_id: id,
        version: nextVersion,
        doc: parsed.data,
        saved_by: body.savedBy || 'human',
        note: body.note || null,
      })
      .select('*')
      .single();
    if (verErr) return NextResponse.json({ error: verErr.message }, { status: 500 });
    await sb.from('content_posts').update({
      current_version_id: ver.id,
      updated_at: new Date().toISOString(),
    }).eq('id', id);
    return NextResponse.json({ version: ver });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isEditorSessionValid())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { id } = await ctx.params;
  const sb = createAdminClient() as any;
  // Cascade delete in the right order (children first, then
  // the post itself). CASCADE in the DB schema would do this
  // automatically; v1 is explicit so the dev path doesn't
  // depend on having the migration applied with cascades.
  const { error: versionsErr } = await sb.from('content_post_versions').delete().eq('post_id', id);
  if (versionsErr) return NextResponse.json({ error: versionsErr.message }, { status: 500 });
  const { error: correctionsErr } = await sb.from('content_corrections').delete().eq('post_id', id);
  if (correctionsErr) return NextResponse.json({ error: correctionsErr.message }, { status: 500 });
  const { error: animationsErr } = await sb.from('content_animations').delete().eq('post_id', id);
  if (animationsErr) return NextResponse.json({ error: animationsErr.message }, { status: 500 });
  const { error: gensErr } = await sb.from('content_generations').delete().eq('post_id', id);
  if (gensErr) return NextResponse.json({ error: gensErr.message }, { status: 500 });
  const { error: postErr } = await sb.from('content_posts').delete().eq('id', id);
  if (postErr) return NextResponse.json({ error: postErr.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
