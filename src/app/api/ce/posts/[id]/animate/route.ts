import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase-admin';
import { isEditorSessionValid } from '@/lib/editor-auth';

const AnimationBody = z.object({
  style: z.enum(['cut-paper', 'crosshatch', 'riso', 'sketchbook', 'math', 'pixel', 'isometric']).default('cut-paper'),
  formats: z.array(z.enum(['9:16', '1:1', '4:5', '16:9'])).min(1),
  seconds_per_slide: z.number().min(0.5).max(10).default(1.5),
});

const running = new Map<string, { cancelled: boolean }>();

async function getRunAnimation() {
  const mod = await import(/* webpackIgnore: true */ '@/lib/ce-animate');
  return mod.runAnimation;
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isEditorSessionValid())) return NextResponse.json({ error: 'editor_session_required' }, { status: 401 });
  const { id } = await ctx.params;
  try {
    const body = await req.json();
    const parsed = AnimationBody.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'schema_failed', issues: parsed.error.issues }, { status: 422 });
    }

    const sb = createAdminClient() as any;
    const { data: postRow, error: postErr } = await sb.from('content_posts').select('*').eq('id', id).maybeSingle();
    if (postErr || !postRow) return NextResponse.json({ error: postErr?.message || 'not_found' }, { status: 404 });
    const { data: ver, error: verErr } = await sb.from('content_post_versions').select('*').eq('id', postRow.current_version_id).maybeSingle();
    if (verErr || !ver) return NextResponse.json({ error: 'no_doc' }, { status: 400 });

    const cancel = { cancelled: false };
    running.set(id, cancel);

    const { data: row, error: insErr } = await sb.from('content_animations').insert({
      post_id: id,
      status: 'building',
      piece_dir: null,
      style: parsed.data.style,
      formats: parsed.data.formats,
      mp4_paths: {},
      frames_dir: null,
      duration_ms: null,
      error: null,
    }).select('*').single();
    if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });

    const runAnimation = await getRunAnimation();
    try {
      if (cancel.cancelled) throw new Error('cancelled');
      const animation = await runAnimation({
        post: ver.doc,
        style: parsed.data.style as any,
        formats: parsed.data.formats as any,
        secondsPerSlide: parsed.data.seconds_per_slide,
      });
      await sb.from('content_animations').update({
        status: 'ready',
        piece_dir: animation.pieceDir,
        mp4_paths: animation.mp4Paths,
        frames_dir: animation.framesDir,
        duration_ms: Math.round(animation.durationSeconds * 1000),
        updated_at: new Date().toISOString(),
      }).eq('id', row.id);
    } catch (err: any) {
      await sb.from('content_animations').update({
        status: 'failed',
        error: (err as Error).message,
        updated_at: new Date().toISOString(),
      }).eq('id', row.id);
      running.delete(id);
      return NextResponse.json({ error: (err as Error).message, animation_id: row.id }, { status: 500 });
    }
    running.delete(id);

    return NextResponse.json({
      animation_id: row.id,
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isEditorSessionValid())) return NextResponse.json({ error: 'editor_session_required' }, { status: 401 });
  const { id } = await ctx.params;
  const c = running.get(id);
  if (c) c.cancelled = true;
  return NextResponse.json({ ok: true, cancelled: !!c });
}
