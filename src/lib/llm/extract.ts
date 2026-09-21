// Top-level LLM dispatch. Routes the description + key to the right
// adapter based on the user's stored provider. Keeps the route thin
// (just auth + provider lookup + this call) and makes adding a new
// provider a one-line change in `providers.ts` + an adapter.
//
// Photo path: `extractMacrosFromImage` decides between vision-direct
// (send the photo URL to the user's vision-capable LLM) and
// OCR-then-text (call HF Inference for GOT-OCR-2, then re-enter
// the text path) based on whether the user's stored provider is in
// `VISION_CAPABLE_PROVIDERS`. The result shape is identical, so the
// route treats both paths the same.
//
// The route uploads the photo to Supabase Storage once and passes
// the public URL here. Vision-capable providers all accept image
// URLs (image_url / source.url / file_data.file_uri), so we don't
// have to base64-anything into the request body.

import type { ExtractedFood, LLMProvider, OCRResult } from './types';
import { PROVIDERS } from './providers';
import {
  openaiCompatExtract,
  openaiCompatExtractImage,
} from './openai-compat';
import { anthropicExtract, anthropicExtractImage } from './anthropic';
import { geminiExtract, geminiExtractImage } from './gemini';
import { hfOcr } from './hf-ocr';
import {
  VISION_CAPABLE_PROVIDERS,
  type HFOCRProvider,
} from './types';

export type { LLMProvider } from './types';

/** Per-call extras. Kept narrow so adapters can read what they need
 *  (Anthropic's `anthropic_workspace_id` for identity-linked keys). */
export interface ExtractExtras {
  anthropicWorkspaceId?: string;
}

export async function extractMacros(
  description: string,
  apiKey: string,
  provider: LLMProvider,
  extras: ExtractExtras = {}
): Promise<ExtractedFood> {
  const config = { ...PROVIDERS[provider] };
  if (provider === 'anthropic' && extras.anthropicWorkspaceId) {
    config.extraHeaders = {
      ...(config.extraHeaders ?? {}),
      'anthropic-workspace-id': extras.anthropicWorkspaceId,
    };
  }
  if (
    provider === 'openai' ||
    provider === 'deepseek' ||
    provider === 'minimax' ||
    provider === 'perplexity'
  ) {
    return openaiCompatExtract({ config, description, apiKey });
  }
  if (provider === 'anthropic') {
    return anthropicExtract({ config, description, apiKey });
  }
  if (provider === 'gemini') {
    return geminiExtract({ config, description, apiKey });
  }
  throw new Error(`Provider ${provider} is not wired up.`);
}

// Result of the vision-vs-OCR dispatch — the route uses
// `extractor` to surface which path was taken so the client can
// show "Read by your vision model" vs "OCR'd + parsed by your
// text model".
export type VisionPath = 'vision' | 'ocr-then-text';

export interface ImageExtractResult {
  food: ExtractedFood;
  path: VisionPath;
  /** Only present when path='ocr-then-text'. */
  ocr?: OCRResult;
}

/** Photo entry point. `imageUrl` is the public URL of the
 *  Supabase Storage object the route uploaded; `apiKey` is the
 *  user's BYOK LLM key; `hfApiKey` is the HF Inference API key
 *  (server env) used for OCR on text-only providers. The function
 *  never asks the user for the HF key — it's a server-side env var.
 *
 *  The `mime` parameter is only used for logging. The providers all
 *  fetch the URL themselves and infer the format from the bytes. */
export async function extractMacrosFromImage(
  imageUrl: string,
  mime: 'image/jpeg' | 'image/png' | 'image/webp',
  apiKey: string,
  provider: LLMProvider,
  extras: ExtractExtras = {},
  hfApiKey: string | null = null
): Promise<ImageExtractResult> {
  // Vision-direct path — one round-trip to the user's own LLM.
  if (VISION_CAPABLE_PROVIDERS.has(provider)) {
    const food = await callVisionAdapter(
      provider,
      imageUrl,
      mime,
      apiKey,
      extras
    );
    return { food, path: 'vision' };
  }

  // Text-only providers — OCR the image first, then re-enter the
  // existing text path. The OCR'd description gets passed through
  // `extractMacros` so the JSON sanitiser + system prompt are
  // identical to the typed-description flow.
  if (!hfApiKey) {
    throw new Error(
      `Provider ${provider} doesn't support image inputs and no HF_API_KEY is configured for the OCR fallback. Add an OpenAI / Anthropic / Gemini key, or contact support.`
    );
  }
  const ocr = await hfOcr(imageUrl, hfApiKey);
  // Cap the OCR'd text at the same 1000-char limit the typed path
  // enforces — long OCR transcripts can blow past the LLM context
  // window. Trim from the start if it overshoots (the nutrition
  // panel is usually near the end of a back-of-pack OCR pass).
  const cappedDescription = ocr.text.length > 1000
    ? ocr.text.slice(-1000)
    : ocr.text;
  const food = await extractMacros(
    cappedDescription,
    apiKey,
  provider,
    extras
  );
  return { food, path: 'ocr-then-text', ocr };
}

async function callVisionAdapter(
  provider: LLMProvider,
  imageUrl: string,
  mime: 'image/jpeg' | 'image/png' | 'image/webp',
  apiKey: string,
  extras: ExtractExtras
): Promise<ExtractedFood> {
  if (provider === 'openai') {
    // openaiCompatExtractImage is also reused for the OpenAI-compat
    // providers (deepseek, MiniMax, perplexity) — but those aren't in
    // VISION_CAPABLE_PROVIDERS, so this branch only fires for openai.
    return openaiCompatExtractImage({
      config: PROVIDERS.openai,
      apiKey,
      imageUrl,
      mime,
    });
  }
  if (provider === 'anthropic') {
    const config = { ...PROVIDERS.anthropic };
    if (extras.anthropicWorkspaceId) {
      config.extraHeaders = {
        ...(config.extraHeaders ?? {}),
        'anthropic-workspace-id': extras.anthropicWorkspaceId,
      };
    }
    return anthropicExtractImage({
      config,
      apiKey,
      imageUrl,
      mime,
    });
  }
  if (provider === 'gemini') {
    return geminiExtractImage({
      config: PROVIDERS.gemini,
      apiKey,
      imageUrl,
      mime,
    });
  }
  // Defensive — the VISION_CAPABLE_PROVIDERS gate above should
  // catch this before we get here.
  throw new Error(
    `Provider ${provider} is not wired for vision. Add it to VISION_CAPABLE_PROVIDERS in src/lib/llm/types.ts.`
  );
}
