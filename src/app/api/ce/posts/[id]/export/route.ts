import { NextRequest, NextResponse } from 'next/server';
import { getPost, getVersionById, logGeneration } from '@/lib/ce-helpers';
import { isEditorSessionValid } from '@/lib/editor-auth';
import { Post } from '@/ce-content-engine/schema/post';
import JSZip from 'jszip';
import { spawn } from 'node:child_process';
import { mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// POST /api/ce/posts/:id/export
//
// Renders the post to PNGs + caption.txt and returns a zip.
// The actual rendering is delegated to the existing CLI script
// (npm run render) via a child process, so the renderer
// templates (which use react-dom/server) never get bundled
// into the Next.js server build.

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isEditorSessionValid())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { id } = await ctx.params;
  try {
    const body = await req.json().catch(() => ({}));
    const result = await getPost(id);
    if (!result || !result.post) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    let doc = result.version?.doc || null;
    if (body.version_id) {
      const v = await getVersionById(body.version_id);
      if (v) doc = v.doc;
    }
    if (!doc) return NextResponse.json({ error: 'no_doc' }, { status: 400 });
    const parsed = Post.safeParse(doc);
    if (!parsed.success) {
      return NextResponse.json({ error: 'schema_failed', issues: parsed.error.issues }, { status: 422 });
    }
    const post = parsed.data;

    // Stage the post JSON in a temp file, then run the CLI.
    const tmpRoot = join(tmpdir(), `ce-export-${id}-${Date.now()}`);
    const inputPath = join(tmpRoot, `${id}.json`);
    const outDir = join(tmpRoot, 'out');
    await mkdir(tmpRoot, { recursive: true });
    await mkdir(outDir, { recursive: true });
    await writeFile(inputPath, JSON.stringify(post, null, 2));

    // The CLI is `tsx tools/content-engine/scripts/render.ts <post.json> <outDir>`.
    // It returns nothing to stdout; the PNGs land in <outDir>.
    await runCli(inputPath, outDir);

    // Bundle the PNGs + caption.txt into a zip.
    const zip = new JSZip();
    const fs = await import('node:fs/promises');
    const files = await fs.readdir(outDir);
    for (const f of files) {
      const buf = await fs.readFile(join(outDir, f));
      zip.file(f, buf);
    }
    const base64 = await zip.generateAsync({ type: 'base64' });

    await logGeneration({
      post_id: id,
      kind: 'export',
      model: 'renderer',
      pillar: post.pillar,
      passed_checks: true,
      notes: `${files.length} files`,
    });

    // Cleanup
    await rm(tmpRoot, { recursive: true, force: true });

    return NextResponse.json({ zip_base64: base64, filename: `FIT50_${id}.zip` });
  } catch (err) {
    console.error('[ce/export]', err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

function runCli(inputPath: string, outDir: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const projectRoot = process.cwd();
    const child = spawn('npx', ['tsx', 'tools/content-engine/scripts/render.ts', inputPath, outDir], {
      cwd: projectRoot,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, NODE_ENV: 'production' },
    });
    let stderr = '';
    child.stderr.on('data', (d) => { stderr += d.toString(); });
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`renderer exited with code ${code}: ${stderr}`));
    });
    child.on('error', (err) => reject(err));
  });
}
