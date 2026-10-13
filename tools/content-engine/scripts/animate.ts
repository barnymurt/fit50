#!/usr/bin/env -S npx tsx
// animate.ts — CLI script that the new-video API route spawns.
//
// The route passes two paths via argv: <brief.json> <output.json>.
// Reads the brief, runs the v1 animation pipeline, writes the
// animation result as JSON to <output.json>. No react-dom/server
// import crosses the route boundary — the route just spawns this
// script via child_process (same pattern the existing export
// route uses for render.ts).
//
// Output JSON shape:
//   { pieceDir, framesDir, rendersDir, mp4Paths, durationSeconds }

import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { Post } from '../src/schema/post';
import { runAnimation } from '../src/animate';

interface Brief {
  post: unknown;
  style: string;
  formats: Array<'9:16' | '4:5' | '1:1' | '16:9'>;
  secondsPerSlide: number;
}

async function main() {
  const [, , briefPath, outputPath] = process.argv;
  if (!briefPath || !outputPath) {
    console.error('usage: animate <brief.json> <output.json>');
    process.exit(2);
  }

  const raw = await readFile(briefPath, 'utf8');
  const brief: Brief = JSON.parse(raw);

  // Re-validate the post with the Zod schema. The route is the
  // authoritative creator, but the script is a separate process
  // and should reject malformed input.
  const parsed = Post.safeParse(brief.post);
  if (!parsed.success) {
    await writeFile(outputPath, JSON.stringify({ error: 'post_schema_failed' }));
    process.exit(1);
  }

  const outDir = join(resolve(outputPath, '..'), 'animation-render');
  await mkdir(outDir, { recursive: true });
  await rm(outDir, { recursive: true, force: true }).catch(() => {});
  await mkdir(outDir, { recursive: true });

  try {
    const result = await runAnimation({
      post: parsed.data,
      style: brief.style as any,
      formats: brief.formats,
      secondsPerSlide: brief.secondsPerSlide,
    });
    await writeFile(outputPath, JSON.stringify(result));
    process.exit(0);
  } catch (err) {
    await writeFile(outputPath, JSON.stringify({ error: (err as Error).message }));
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
