import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase-admin';
import { isEditorSessionValid } from '@/lib/editor-auth';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const execFileAsync = promisify(execFile);

const AnimationBody = z.object({
  style: z.enum(['cut-paper', 'crosshatch', 'riso', 'sketchbook', 'math', 'pixel', 'isometric']).default('cut-paper'),
  formats: z.array(z.enum(['9:16', '1:1', '4:5', '16:9'])).min(1),
  seconds_per_slide: z.number().min(0.5).max(10).default(1.5),
});

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

    const tmpRoot = join(tmpdir(), `ce-anim-${id}-${Date.now()}`);
    await mkdir(tmpRoot, { recursive: true });
    const briefPath = join(tmpRoot, 'brief.json');
    const outputPath = join(tmpRoot, 'output.json');
    await writeFile(briefPath, JSON.stringify({
      post: ver.doc,
      style: parsed.data.style,
      formats: parsed.data.formats,
      secondsPerSlide: parsed.data.seconds_per_slide,
    }));

    try {
      if (cancel.cancelled) throw new Error('cancelled');
      await execFileAsync('npx', ['tsx', 'tools/content-engine/scripts/animate.ts', briefPath, outputPath], {
        cwd: process.cwd(),
        env: { ...process.env, NODE_ENV: 'production' },
        timeout: 5 * 60 * 1000,
      });
    } catch (err: any) {
      let detail = err?.message || 'animate script failed';
      try {
        const out = JSON.parse(await readFile(outputPath, 'utf8'));
        if (out?.error) detail = out.error;
      } catch {}
      await sb.from('content_animations').update({
        status: 'failed',
        error: detail,
        updated_at: new Date().toISOString(),
      }).eq('id', row.id);
      running.delete(id);
      return NextResponse.json({ error: detail, animation_id: row.id }, { status: 500 });
    }
    running.delete(id);

    const out = JSON.parse(await readFile(outputPath, 'utf8'));
    if (out?.error) {
      await sb.from('content_animations').update({
        status: 'failed',
        error: out.error,
        updated_at: new Date().toISOString(),
      }).eq('id', row.id);
      return NextResponse.json({ error: out.error, animation_id: row.id }, { status: 500 });
    }

    await sb.from('content_animations').update({
      status: 'ready',
      piece_dir: out.pieceDir,
      mp4_paths: out.mp4Paths,
      frames_dir: out.framesDir,
      duration_ms: Math.round(out.durationSeconds * 1000),
      updated_at: new Date().toISOString(),
    }).eq('id', row.id);
    return NextResponse.json({
      animation_id: row.id,
      piece_dir: out.pieceDir,
      mp4_paths: out.mp4Paths,
      duration_ms: Math.round(out.durationSeconds * 1000),
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
