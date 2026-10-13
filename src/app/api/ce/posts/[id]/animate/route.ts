import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase-admin';
import { isEditorSessionValid } from '@/lib/editor-auth';
import { getPost } from '@/lib/ce-helpers';

const AnimationBody = z.object({
  style: z.enum(['cut-paper', 'crosshatch', 'riso', 'sketchbook', 'math', 'pixel', 'isometric']).default('cut-paper'),
  formats: z.array(z.enum(['9:16', '1:1', '4:5', '16:9'])).min(1),
  seconds_per_slide: z.number().min(0.5).max(10).default(1.5),
});

// In-memory registry of running animations (cancel support).
const running = new Map<string, { cancelled: boolean }>();

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isEditorSessionValid())) return NextResponse.json({ error: 'editor_session_required' }, { status: 401 });
  const { id } = await ctx.params;
  try {
    const body = await req.json();
    const parsed = AnimationBody.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'schema_failed', issues: parsed.error.issues }, { status: 422 });
    }
    const result = await getPost(id);
    if (!result || !result.post || !result.version) return NextResponse.json({ error: 'not_found' }, { status: 404 });

    const cancel = { cancelled: false };
    running.set(id, cancel);

    const sb = createAdminClient() as any;
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

    // Use eval('require') to bypass webpack's static analysis
    // of the import chain. The animate module transitively
    // imports react-dom/server, which Next.js's static check
    // refuses to bundle for the client. This route is only
    // ever reached server-side, so the require is safe.
    type AnimateModule = { runAnimation: (input: { post: unknown; style: string; formats: string[]; secondsPerSlide: number }) => Promise<{ pieceDir: string; framesDir: string; rendersDir: string; mp4Paths: Record<string, string>; durationSeconds: number }> };
    // eslint-disable-next-line no-eval
    const animateMod = eval('require')('@/ce-content-engine/animate') as AnimateModule;
    const runAnimation = animateMod.runAnimation;
    let animation;
    try {
      if (cancel.cancelled) throw new Error('cancelled');
      animation = await runAnimation({
        post: result.version.doc,
        style: parsed.data.style,
        formats: parsed.data.formats,
        secondsPerSlide: parsed.data.seconds_per_slide,
      });
    } catch (err) {
      await sb.from('content_animations').update({
        status: 'failed',
        error: (err as Error).message,
        updated_at: new Date().toISOString(),
      }).eq('id', row.id);
      running.delete(id);
      return NextResponse.json({ error: (err as Error).message, animation_id: row.id }, { status: 500 });
    }
    running.delete(id);

    const mp4_paths: Record<string, string> = {};
    for (const [k, v] of Object.entries(animation.mp4Paths)) {
      mp4_paths[k] = v;
    }
    await sb.from('content_animations').update({
      status: 'ready',
      piece_dir: animation.pieceDir,
      mp4_paths,
      frames_dir: animation.framesDir,
      duration_ms: Math.round(animation.durationSeconds * 1000),
      updated_at: new Date().toISOString(),
    }).eq('id', row.id);
    return NextResponse.json({
      animation_id: row.id,
      piece_dir: animation.pieceDir,
      mp4_paths,
      duration_ms: Math.round(animation.durationSeconds * 1000),
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
