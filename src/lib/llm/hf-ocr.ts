// Hugging Face Inference API caller for OCR. We use GOT-OCR-2.0
// (`stepfun-ai/GOT-OCR-2.0-hf`) — accurate on Western + Chinese +
// Korean text, handles dense nutrition panels well, free tier
// covers the volumes a single-user BYOK app sees.
//
// The endpoint POSTs raw image bytes (multipart) and returns
// JSON: `{generated_text: string}` on success, or an `error`
// field when the model is loading (HF cold-starts the model on
// first hit — typically 5-20s — and returns 503 with a retry hint).
//
// Auth: HF API key in `Authorization: Bearer ${HF_API_KEY}`. The
// server reads the key from env at request time so it can be
// rotated without redeploying code.

import type { HFOCRProvider, OCRResult } from './types';

const HF_BASE = 'https://api-inference.huggingface.co/models';
const OCR_MODEL = 'stepfun-ai/GOT-OCR-2.0-hf';
const REQUEST_TIMEOUT_MS = 60_000;

interface HFOCRResponse {
  generated_text?: string;
  error?: string;
}

export async function hfOcr(
  imageBytes: Uint8Array,
  apiKey: string | null,
  model: HFOCRProvider = 'hf-got-ocr-2',
): Promise<OCRResult> {
  if (!apiKey) {
    throw new Error(
      'HF_API_KEY is not configured. Add one to enable OCR for non-vision providers.'
    );
  }

  const url = `${HF_BASE}/${OCR_MODEL}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let res: Response;
  try {
    // HF Inference expects multipart/form-data with the image under
    // the `inputs` field. We construct the body by hand so we don't
    // need to pull in a multipart lib — the image is the only field
    // and we know its bytes.
    //
    // TS strictness: Node's Uint8Array<ArrayBufferLike> isn't
    // directly assignable to BlobPart (which wants
    // Uint8Array<ArrayBuffer>), so we copy into a fresh
    // ArrayBuffer-backed view first. Cheap at our sizes (≤1024px JPEG).
    const fd = new FormData();
    const view = new Uint8Array(new ArrayBuffer(imageBytes.byteLength));
    view.set(imageBytes);
    fd.append(
      'inputs',
      new Blob([view], { type: 'image/jpeg' }),
      'photo.jpg'
    );
    res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: fd,
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timeout);
    if ((err as { name?: string }).name === 'AbortError') {
      throw new Error(
        `Hugging Face OCR timed out after ${REQUEST_TIMEOUT_MS}ms (model may be cold-starting — try again in a few seconds).`
      );
    }
    throw err;
  }
  clearTimeout(timeout);

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    // HF returns 503 with `error: "Model is currently loading"`
    // during cold starts. Surface a clearer message than the raw
    // HTML so the route can hand it to the user as a retry hint.
    if (res.status === 503) {
      throw new Error(
        'OCR model is loading. Try again in a few seconds (cold-start usually takes 5-20s on the free tier).'
      );
    }
    throw new Error(
      `Hugging Face OCR failed: ${res.status}. ${body.slice(0, 200)}`
    );
  }

  // HF sometimes wraps the JSON in an array, sometimes returns a
  // bare object. Handle both.
  const payload = (await res.json().catch(() => null)) as
    | HFOCRResponse
    | HFOCRResponse[]
    | null;
  if (!payload) {
    throw new Error('Hugging Face OCR returned an empty response.');
  }
  const result = Array.isArray(payload) ? payload[0] : payload;
  const text = result?.generated_text?.trim();
  if (!text) {
    throw new Error(
      result?.error
        ? `Hugging Face OCR: ${result.error}`
        : 'Hugging Face OCR returned no text.'
    );
  }
  return { text, provider: model };
}
