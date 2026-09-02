// Top-level LLM dispatch. Routes the description + key to the right
// adapter based on the user's stored provider. Keeps the route thin
// (just auth + provider lookup + this call) and makes adding a new
// provider a one-line change in `providers.ts` + an adapter.

import type { ExtractedFood } from './types';
import type { LLMProvider } from './types';
import { PROVIDERS } from './providers';
import { openaiCompatExtract } from './openai-compat';
import { anthropicExtract } from './anthropic';
import { geminiExtract } from './gemini';

export type { LLMProvider } from './types';

const OPENAI_COMPAT: LLMProvider[] = [
  'openai',
  'deepseek',
  'minimax',
  'perplexity',
];

export async function extractMacros(
  description: string,
  apiKey: string,
  provider: LLMProvider
): Promise<ExtractedFood> {
  const config = PROVIDERS[provider];
  if (!config) {
    throw new Error(`Unknown provider: ${provider}`);
  }
  if (OPENAI_COMPAT.includes(provider)) {
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