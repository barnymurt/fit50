// POST /api/foods/custom/photo
//
// Photo of a nutrition label → structured macros. The user captures
// an image (mobile camera, desktop file picker, drag-and-drop, or
// paste); the server pre-processes it with sharp, then routes to
// one of two paths based on the user's stored LLM provider:
//
//   1. Vision-direct (OpenAI / Anthropic / Gemini): send the bytes
//      straight to the user's vision-capable model. One round-trip.
//   2. OCR + text (DeepSeek / MiniMax / Perplexity): call HF
//      Inference for GOT-OCR-2.0, then forward the extracted text
//      to the existing extractMacros() path.
//
// In both cases the response shape is identical (same ExtractedFood
// JSON as the typed-description /extract route), so the client uses
// the same modal pre-fill flow. `path` + `ocr_provider` tell the
// client which pipeline ran — handy for "Read by your vision model"
// vs "OCR'd + parsed by your text model" copy.
//
// Auth: Bearer-token via Authorization header (same as /extract).
// Rate limit: 30 req / 60s per user (same as /extract).

import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { authedUserFromRequest } from '@/lib/auth-server';
import {
  extractMacrosFromImage,
  type LLMProvider,
} from '@/lib/llm/extract';
import { PROVIDERS } from '@/lib/llm/providers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// 8 MB raw upload cap. After sharp's resize we land at ~50–150 KB,
// so 8 MB gives plenty of headroom for high-res phone shots.
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
// Output JPEG cap on the long edge — food labels are text-heavy,
// 1024 px is plenty of detail for any model and keeps the LLM
// payload small.
const MAX_LONG_EDGE = 1024;
const JPEG_QUALITY = 82;

const ALLOWED_MIME: ReadonlySet<string> = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]);

const RATE_BUCKET = new Map<string, number[]>();
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 30;

function rateLimited(userId: string): boolean {
  const now = Date.now();
  const bucket = (RATE_BUCKET.get(userId) ?? []).filter(
    (t) => now - t < RATE_WINDOW_MS
  );
  if (bucket.length >= RATE_MAX) {
    RATE_BUCKET.set(userId, bucket);
    return true;
  }
  bucket.push(now);
  RATE_BUCKET.set(userId, bucket);
  return false;
}

interface ProcessedImage {
  bytes: Uint8Array;
  mime: 'image/jpeg' | 'image/png' | 'image/webp';
}

async function processImage(raw: Uint8Array, declaredMime: string): Promise<ProcessedImage> {
  if (raw.byteLength > MAX_UPLOAD_BYTES) {
    throw new Error(
      `Image too large (${(raw.byteLength / 1024 / 1024).toFixed(1)} MB; max ${MAX_UPLOAD_BYTES / 1024 / 1024} MB).`
    );
  }

  // sharp normalises EXIF rotation, drops metadata, and re-encodes
  // to JPEG. We always emit JPEG regardless of the input MIME so
  // the downstream vision adapters see one canonical format.
  const out = await sharp(raw, { failOn: 'none' })
    .rotate()
    .resize({
      width: MAX_LONG_EDGE,
      height: MAX_LONG_EDGE,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .jpeg({ quality: JPEG_QUALITY, mozjpeg: false })
    .toBuffer({ resolveWithObject: false });

  // sharp's .toBuffer() returns Node Buffer which extends
  // Uint8Array — widen for the adapter call sites.
  return {
    bytes: new Uint8Array(out.buffer, out.byteOffset, out.byteLength),
    mime: 'image/jpeg',
  };
}

export async function POST(req: NextRequest) {
  const auth = await authedUserFromRequest(req);
  if ('error' in auth) return auth.error;
  const { admin, user } = auth.ctx;

  // Read the multipart body. We only need one image field plus
  // an optional submit_to_community flag.
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json(
      { error: 'Request body must be multipart/form-data.' },
      { status: 400 }
    );
  }

  const imageField = form.get('image');
  if (!imageField || typeof imageField === 'string') {
    return NextResponse.json(
      { error: 'Missing "image" file field.' },
      { status: 400 }
    );
  }
  const imageBlob = imageField as Blob;
  const declaredMime =
    (imageBlob.type && imageBlob.type !== '' ? imageBlob.type : 'image/octet-stream');

  if (!ALLOWED_MIME.has(declaredMime)) {
    return NextResponse.json(
      {
        error: `Unsupported image type "${declaredMime}". Use JPEG, PNG, or WEBP.`,
      },
      { status: 415 }
    );
  }

  if (rateLimited(user.id)) {
    return NextResponse.json(
      { error: 'Too many requests. Try again in a minute.' },
      { status: 429 }
    );
  }

  let processed: ProcessedImage;
  try {
    const raw = new Uint8Array(await imageBlob.arrayBuffer());
    processed = await processImage(raw, declaredMime);
  } catch (err) {
    console.error('photo: image processing failed', err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : 'Could not process the uploaded image.',
      },
      { status: 400 }
    );
  }

  // BYOK: read the user's own LLM key + provider. We never see or
  // touch the user's HF_API_KEY — that's a server-side env var
  // (read below) used only when the provider can't read images.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (admin.from('profiles') as any)
    .select('llm_api_key, llm_provider, anthropic_workspace_id')
    .eq('id', user.id)
    .maybeSingle();
  const apiKey = (profile?.llm_api_key as string | null) ?? null;
  const provider = (profile?.llm_provider as LLMProvider | null) ?? 'openai';
  const anthropicWorkspaceId =
    (profile?.anthropic_workspace_id as string | null) ?? null;

  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "No LLM key on file. Add one in the food panel or via /api/account/llm-key.",
        code: 'no_llm_key',
      },
      { status: 412 }
    );
  }

  const hfApiKey = process.env.HF_API_KEY ?? null;

  try {
    const result = await extractMacrosFromImage(
      processed.bytes,
      processed.mime,
      apiKey,
      provider,
      { ...(anthropicWorkspaceId ? { anthropicWorkspaceId } : {}) },
      hfApiKey
    );
    return NextResponse.json({
      ok: true,
      food: result.food,
      provider,
      provider_name: PROVIDERS[provider]?.name ?? provider,
      path: result.path,
      ocr_provider: result.ocr?.provider ?? null,
      ocr_text: result.ocr?.text ?? null,
    });
  } catch (err) {
    console.error('photo: extract failed', err);
    // The text-only providers need HF_API_KEY. The extract layer
    // throws a plain Error in that case — surface it as a 503 so
    // the client knows to ask the user to add a vision-capable key.
    const message =
      err instanceof Error ? err.message : 'Extraction failed.';
    const isOcrMissing =
      hfApiKey === null &&
      message.includes("doesn't support image inputs");
    return NextResponse.json(
      {
        error: message,
        ...(isOcrMissing
          ? { code: 'no_ocr_provider' }
          : {}),
      },
      { status: isOcrMissing ? 503 : 502 }
    );
  }
}
