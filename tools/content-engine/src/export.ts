// export.ts — turn a post into numbered PNGs + caption.txt
// using a single warm Playwright Chromium instance.

import { chromium, type Page, type Browser } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { renderPostHTML } from './render-slide';
import { loadTokens } from './tokens.js';
import type { Post } from './schema/post.js';
import { runAllChecks } from './checks/index.js';

const BRAND = join(dirname(new URL(import.meta.url).pathname.replace(/^\//, '')), '..', 'brand');

export interface ExportResult {
  postId: string;
  pngPaths: string[];
  captionPath: string | null;
  flags: Array<{ slideId?: string; field?: string; message: string }>;
  elapsedMs: number;
}

function pageShell(outer: string, canvasWidth: number, canvasHeight: number, iconPath: string) {
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>
  html, body { margin: 0; padding: 0; background: #000; }
  body { display: flex; align-items: center; justify-content: center; min-height: 100vh; }
  .canvas { width: ${canvasWidth}px; height: ${canvasHeight}px; }
  .canvas img { display: block; }
</style>
</head>
<body>
<div class="canvas">${outer}</div>
</body>
</html>`;
}

function pad(n: number, width = 2) {
  return String(n).padStart(width, '0');
}

export async function exportPost(post: Post, outputDir: string, options?: { browser?: Browser; skipChecks?: boolean }): Promise<ExportResult> {
  const start = Date.now();
  const tokens = await loadTokens();
  const slides = await renderPostHTML(post);
  const flags = options?.skipChecks ? [] : await runAllChecks(post, tokens);

  await mkdir(outputDir, { recursive: true });

  const browser = options?.browser ?? await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: slides[0].canvas.width, height: slides[0].canvas.height }, deviceScaleFactor: 2 });
    // Wire the brand/icons path so the templates' relative
    // <img src="./brand/icons/...> resolves.
    await page.route('**/brand/icons/*', async (route) => {
      const url = new URL(route.request().url());
      const file = url.pathname.split('/').pop();
      try {
        const buf = await (await import('node:fs/promises')).readFile(join(BRAND, 'icons', file));
        await route.fulfill({ status: 200, contentType: 'image/webp', body: buf });
      } catch {
        await route.fulfill({ status: 404 });
      }
    });

    const pngPaths: string[] = [];
    for (let i = 0; i < slides.length; i++) {
      const s = slides[i];
      const html = pageShell(s.html, s.canvas.width, s.canvas.height, BRAND);
      await page.setContent(html, { waitUntil: 'networkidle' });
      // Wait for all fonts to be ready before any screenshot.
      await page.evaluate(() => (document as any).fonts.ready);
      const file = `FIT50_${post.id}_${pad(i + 1)}.png`;
      const fullPath = join(outputDir, file);
      const buf = await page.screenshot({ type: 'png', omitBackground: false, fullPage: false });
      await writeFile(fullPath, buf);
      pngPaths.push(fullPath);
    }
    let captionPath: string | null = null;
    if (post.caption) {
      captionPath = join(outputDir, `FIT50_${post.id}_caption.txt`);
      const body = post.caption.text + (post.caption.hashtags?.length ? '\n\n' + post.caption.hashtags.join(' ') : '');
      await writeFile(captionPath, body);
    }
    return { postId: post.id, pngPaths, captionPath, flags, elapsedMs: Date.now() - start };
  } finally {
    if (!options?.browser) await browser.close();
  }
}
