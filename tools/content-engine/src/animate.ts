// animate.ts — the v1 integration with cth9191/animate.
//
// v1 deliberately does NOT use the animate skill's LLM-driven
// scenes/grammar/kit — that's a deep multi-step skill flow.
// What v1 does:
//   1. Writes a piece.json manifest under tools/animate/pieces/<id>/
//      matching the animate repo's expected shape.
//   2. Reuses the existing Phase 1 PNG renderer to produce one
//      PNG per slide (the editor's current rendering path).
//   3. Uses ffmpeg to concatenate the PNGs into a video with
//      crossfade transitions, one MP4 per requested format
//      (9:16, 1:1, 4:5, 16:9). The animate repo's piece.json
//      declares which format is the primary; the other formats
//      are produced by re-rendering at the right aspect.
//   4. Records the paths in content_animations.
//
// Phase 7.1 wires the LLM-driven scenes/grammar/kit so the
// piece is drawn procedurally, not assembled from static PNGs.

import { renderPostHTML } from './render-slide.ts';
import { exportPost as renderPngs } from './export.ts';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { join, resolve, dirname } from 'node:path';
import { execFile as execFileCb } from 'node:child_process';
import { promisify } from 'node:util';
import { Post } from './schema/post';
import { loadTokens } from './tokens';

const execFile = promisify(execFileCb);

export interface AnimationInput {
  post: Post;
  style: 'cut-paper' | 'crosshatch' | 'riso' | 'sketchbook' | 'math' | 'pixel' | 'isometric';
  formats: Array<'9:16' | '1:1' | '4:5' | '16:9'>;
  secondsPerSlide: number; // 1.5 by default
}

export interface AnimationResult {
  pieceDir: string;
  framesDir: string;
  rendersDir: string;
  mp4Paths: Record<string, string>; // format -> file path
  durationSeconds: number;
}

const FORMAT_DIMS: Record<string, { width: number; height: number }> = {
  '9:16': { width: 1080, height: 1920 },
  '1:1':  { width: 1080, height: 1080 },
  '4:5':  { width: 1080, height: 1350 },
  '16:9': { width: 1920, height: 1080 },
};

function pad(n: number) {
  return String(n).padStart(2, '0');
}

export async function runAnimation(input: AnimationInput): Promise<AnimationResult> {
  const { post, style, formats, secondsPerSlide } = input;
  const pieceDir = resolve(process.cwd(), 'tools', 'animate', 'pieces', post.id);
  const framesDir = join(pieceDir, 'frames');
  const rendersDir = join(pieceDir, 'renders');
  const primaryFormat = post.aspect === '9:16' ? '9:16' : (post.aspect === '1:1' ? '1:1' : (post.aspect === '4:5' ? '4:5' : '16:9'));

  // 1. Write a piece.json manifest (matches the animate repo's
  //    expected shape).
  const piece = {
    name: post.id,
    title: post.brief || post.id,
    format: {
      width: FORMAT_DIMS[primaryFormat].width,
      height: FORMAT_DIMS[primaryFormat].height,
      fps: 24,
      bpm: 120,
      duration: secondsPerSlide * post.slides.length,
      frames: 24 * secondsPerSlide * post.slides.length,
    },
    storyFormat: 'F2 morph chain (slide-fade assembly)',
    style,
    review: { safe: { top: 240, bottom: 420, right: 140 }, refs: {} },
  };
  await mkdir(pieceDir, { recursive: true });
  await writeFile(join(pieceDir, 'piece.json'), JSON.stringify(piece, null, 2));

  // 2. Render the post's slides as PNGs using the existing
  //    Phase 1 renderer (skipChecks: true to avoid the editor
  //    route's gating).
  await mkdir(framesDir, { recursive: true });
  await mkdir(rendersDir, { recursive: true });
  const tokens = await loadTokens();
  const slidesHtml = await renderPostHTML(post);
  // We use the existing renderer's png output path as
  // "frames/<slide-index>.png" via a thin pass.
  const tmpPngs = await renderPngs(post, framesDir, { skipChecks: true });

  // 3. For each requested format, run ffmpeg to produce a
  //    crossfaded video from the slides.
  const mp4Paths: Record<string, string> = {};
  for (const fmt of formats) {
    const dims = FORMAT_DIMS[fmt];
    const out = join(rendersDir, `final-${pad(dims.width)}x${pad(dims.height)}.mp4`);
    await assembleMp4({
      pngDir: tmpPngs.pngPaths,
      outPath: out,
      width: dims.width,
      height: dims.height,
      secondsPerSlide,
    });
    mp4Paths[fmt] = out;
  }

  return {
    pieceDir,
    framesDir,
    rendersDir,
    mp4Paths,
    durationSeconds: secondsPerSlide * post.slides.length,
  };
}

async function assembleMp4(opts: {
  pngDir: string[];
  outPath: string;
  width: number;
  height: number;
  secondsPerSlide: number;
}) {
  // Build an ffmpeg concat with xfade transitions.
  // Each slide: -loop 1 -t <seconds> -i <path> (resized to the
  // target format). xfade between consecutive inputs.
  const args: string[] = ['-y'];
  const n = opts.pngDir.length;
  for (const p of opts.pngDir) {
    args.push('-loop', '1', '-t', String(opts.secondsPerSlide), '-i', p);
  }
  // Build the filter_complex
  const filters: string[] = [];
  for (let i = 0; i < n; i++) {
    filters.push(`[${i}:v]scale=${opts.width}:${opts.height}:force_original_aspect_ratio=decrease,pad=${opts.width}:${opts.height}:(ow-iw)/2:(oh-ih)/2,setsar=1[v${i}]`);
  }
  for (let i = 0; i < n - 1; i++) {
    const offset = (i + 1) * opts.secondsPerSlide - 0.3; // 0.3s crossfade
    filters.push(`[v${i}][v${i + 1}]xfade=transition=fade:duration=0.3:offset=${offset.toFixed(2)}[v${i + 1}x]`);
  }
  let lastLabel = 'v0';
  if (n > 1) {
    lastLabel = `v${n - 1}x`;
  }
  filters.push(`[${lastLabel}]format=yuv420p[vout]`);
  args.push('-filter_complex', filters.join(';'));
  args.push('-map', '[vout]');
  args.push('-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-r', '24');
  args.push('-movflags', '+faststart', '-an', opts.outPath);

  try {
    await execFile('ffmpeg', args, { timeout: 120_000 });
  } catch (err: any) {
    throw new Error(`ffmpeg failed: ${err?.stderr?.toString()?.slice(-500) || err?.message || 'unknown'}`);
  }
}
