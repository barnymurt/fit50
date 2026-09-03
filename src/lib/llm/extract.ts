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