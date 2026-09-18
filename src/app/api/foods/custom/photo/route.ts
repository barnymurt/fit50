// POST /api/foods/custom/photo
//
// Photo of a nutrition label → structured macros. The user captures
// an image (mobile camera, desktop file picker, drag-and-drop, or
// paste); the server pre-processes it with sharp, uploads it to
// Supabase Storage, then routes to one of three paths:
//
//   1. Vision-direct (user's own key, vision-capable provider):
//      pass the photo URL to the user's vision-capable model. One
//      round-trip. Highest quality for users with their own key.
//   2. Premium fallback (no user key, GROQ_API_KEY set server-side):
//      HF OCR → groq parses the text into structured macros. No
//      user key needed — included with premium.
//   3. Non-premium without a key: returns 412 asking for a key.
//
// Auth: Bearer-token via Authorization header (same as /extract).
// Rate limit: 30 req / 60s per user (same as /extract).

import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { authedUserFromRequest } from '@/lib/auth-server';
import {
  extractMacrosFromImage,
  extractMacros,
  type LLMProvider,
} from '@/lib/llm/extract';
import { hfOcr } from '@/lib/llm/hf-ocr';
import { PROVIDERS } from '@/lib/llm/providers';
import { uploadImageForExtraction } from '@/lib/photo-upload';

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

  // Upload once to Supabase Storage. Both the LLM provider and the
  // HF OCR fallback fetch this URL — saves us from having to upload
  // twice. We always go through this path even for text-only
  // providers since HF's Inference API accepts image URLs directly.
  let photo: { url: string };
  try {
    photo = await uploadImageForExtraction(
      admin,
      user.id,
      processed.bytes,
      processed.mime
    );
  } catch (err) {
    console.error('photo: storage upload failed', err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : 'Could not upload the photo for processing.',
      },
      { status: 500 }
    );
  }

  // BYOK: read the user's own LLM key + provider + premium status.
  // We never see or touch the user's HF_API_KEY — that's a server-
  // side env var (read below) used only for the premium fallback.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (admin.from('profiles') as any)
    .select('llm_api_key, llm_provider, anthropic_workspace_id, is_premium')
    .eq('id', user.id)
    .maybeSingle();
  const apiKey = (profile?.llm_api_key as string | null) ?? null;
  const provider = (profile?.llm_provider as LLMProvider | null) ?? 'openai';
  const anthropicWorkspaceId =
    (profile?.anthropic_workspace_id as string | null) ?? null;
  const isPremium = profile?.is_premium === true;
  const hfApiKey = process.env.HF_API_KEY ?? null;
  const groqApiKey = process.env.GROQ_API_KEY ?? null;

  // Path 1: user has their own LLM key → vision-direct (or OCR
  // fallback if their provider isn't vision-capable).
  if (apiKey) {
    try {
      const result = await extractMacrosFromImage(
        photo.url,
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
      console.error('photo: BYOK extract failed', err);
      const message = err instanceof Error ? err.message : 'Extraction failed.';
      const isOcrMissing =
        hfApiKey === null && message.includes("doesn't support image inputs");
      return NextResponse.json(
        { error: message, ...(isOcrMissing ? { code: 'no_ocr_provider' } : {}) },
        { status: isOcrMissing ? 503 : 502 }
      );
    }
  }

  // Path 2: premium user, no own key, server has Groq → HF OCR + Groq.
  if (isPremium && groqApiKey) {
    if (!hfApiKey) {
      return NextResponse.json(
        {
          error:
            'Photo scan is temporarily unavailable — the OCR service is not configured. Contact support.',
          code: 'no_ocr_provider',
        },
        { status: 503 }
      );
    }
    try {
      const ocr = await hfOcr(photo.url, hfApiKey);
      if (
        /reference|legend|multilingual|declaration|rgulate|regulatory|nutrient\s+table/i.test(
          ocr.text
        ) &&
        !/\d+\s*[ck]cal/i.test(ocr.text)
      ) {
        return NextResponse.json(
          {
            error:
              "That looks like a nutrition reference table, not a food label. Try snapping a photo of an actual product's nutrition label instead.",
            code: 'not_a_food_label',
          },
          { status: 422 }
        );
      }
      const cappedDescription =
        ocr.text.length > 1000 ? ocr.text.slice(-1000) : ocr.text;
      const food = await extractMacros(
        cappedDescription,
        groqApiKey,
        'groq'
      );
      if (food.kcal === 0 && food.protein === 0 && food.carbs === 0 && food.fat === 0) {
        return NextResponse.json(
          {
            error:
              "Couldn't read any macros from that photo. Try a clearer shot of a nutrition label — ideally with the label flat and in focus.",
            code: 'no_macros_detected',
          },
          { status: 422 }
        );
      }
      return NextResponse.json({
        ok: true,
        food,
        provider: 'groq',
        provider_name: 'Groq (premium)',
        path: 'ocr-then-text',
        ocr_provider: ocr.provider,
        ocr_text: ocr.text,
      });
    } catch (err) {
      console.error('photo: premium OCR fallback failed', err);
      return NextResponse.json(
        {
          error:
            err instanceof Error
              ? err.message
              : 'Photo scan failed. Try again or add your own LLM key for more reliable results.',
        },
        { status: 502 }
      );
    }
  }

  // Path 3: non-premium without a key → ask them to add one.
  return NextResponse.json(
    {
      error:
        "Add your AI key below to unlock photo scanning. OpenAI, Anthropic, Gemini, and Perplexity all support photo scanning.",
      code: 'no_llm_key',
    },
    { status: 412 }
  );
}
