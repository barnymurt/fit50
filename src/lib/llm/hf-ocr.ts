// Hugging Face Inference API caller for OCR. We use GOT-OCR-2.0
// (`stepfun-ai/GOT-OCR-2.0-hf`) — accurate on Western + Chinese +
// Korean text, handles dense nutrition panels well, free tier
// covers the volumes a single-user BYOK app sees.
//
// The endpoint accepts image inputs either as multipart/form-data
// or as a JSON payload with `inputs.image` set to a URL or base64
// string. We pass the Supabase Storage URL the photo route
// already uploaded to — HF fetches it from Supabase and runs OCR
// in their infra. JSON is cleaner than multipart for this case.
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
  imageUrl: string,
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
    // HF Inference accepts a JSON payload with `inputs.image` set to
    // a URL (Supabase Storage public URL) — HF fetches it server-side.
    res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: { image: imageUrl },
      }),
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
