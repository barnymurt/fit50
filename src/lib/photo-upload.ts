// Server-side helper that uploads a processed photo to the
// `photo_extract_temp` Supabase Storage bucket and returns the
// public URL. The user's chosen LLM provider fetches that URL
// over HTTPS to read the image back, so providers that accept
// image URLs (OpenAI, Anthropic, Gemini, Perplexity, DeepSeek's
// vision-capable models) can see the photo without us base64-ing
// it into the request body. Text-only models (deepseek-chat,
// MiniMax-Text-01) fall through to the HF OCR path which also
// takes the URL.
//
// The bucket itself is public-read, so the public URL works
// without a signed-URL expiry. Files are tiny (<200 KB after
// sharp()), so we're comfortable leaving them around — a future
// cleanup cron can prune anything older than N days.

import { randomUUID } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './supabase';

interface UploadResult {
  url: string;
  /** Stored path inside the bucket, useful for cleanup later. */
  path: string;
}

/**
 * Upload the given image bytes to the photo_extract_temp bucket
 * and return the public URL. The key in the bucket is a UUID + the
 * file extension derived from `mime` so collisions are impossible.
 *
 * Caller is responsible for having done sharp() preprocessing
 * (resizing, EXIF strip, JPEG-encode) before this — we don't
 * reprocess here.
 */
export async function uploadImageForExtraction(
  admin: SupabaseClient<Database>,
  userId: string,
  bytes: Uint8Array,
  mime: 'image/jpeg' | 'image/png' | 'image/webp',
): Promise<UploadResult> {
  const ext =
    mime === 'image/png'
      ? 'png'
      : mime === 'image/webp'
        ? 'webp'
        : 'jpg';
  const path = `${userId}/${randomUUID()}.${ext}`;
  const contentType =
    mime === 'image/jpeg' ? 'image/jpeg' : mime;

  // Buffer.from(uint8.buffer, uint8.byteOffset, uint8.byteLength)
  // copies into a fresh ArrayBuffer-backed view that the storage
  // SDK accepts regardless of which ArrayBufferLike subtype the
  // runtime produced.
  const buf = Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  const { error } = await admin.storage
    .from('photo_extract_temp')
    .upload(path, buf, {
      contentType,
      upsert: false,
      cacheControl: '300', // 5 min — LLM fetches within the request
    });

  if (error) {
    throw new Error(`photo_extract_temp upload failed: ${error.message}`);
  }

  // getPublicUrl returns the right shape synchronously; no extra
  // round-trip needed.
  const { data: pub } = admin.storage
    .from('photo_extract_temp')
    .getPublicUrl(path);

  return { url: pub.publicUrl, path };
}
