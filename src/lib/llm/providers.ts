// Provider configs + key-prefix detection. The OpenAI-compat
// providers (OpenAI, DeepSeek, Mistral, Perplexity, OpenRouter, …)
// share the same adapter — only the baseUrl and model id change.
// Anthropic and Gemini have their own adapters because their
// request/response shapes differ.

import type { LLMConfig, LLMProvider } from './types';

export type { LLMProvider } from './types';

export const PROVIDERS: Record<LLMProvider, LLMConfig> = {
  openai: {
    id: 'openai',
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
    authHeader: 'Authorization',
    authPrefix: 'Bearer ',
  },
  deepseek: {
    id: 'deepseek',
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    model: 'deepseek-chat',
    authHeader: 'Authorization',
    authPrefix: 'Bearer ',
  },
  minimax: {
    id: 'minimax',
    name: 'MiniMax',
    baseUrl: 'https://api.minimax.chat/v1',
    model: 'MiniMax-Text-01',
    authHeader: 'Authorization',
    authPrefix: 'Bearer ',
  },
  perplexity: {
    id: 'perplexity',
    name: 'Perplexity',
    baseUrl: 'https://api.perplexity.ai',
    model: 'sonar',
    authHeader: 'Authorization',
    authPrefix: 'Bearer ',
  },
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic',
    baseUrl: 'https://api.anthropic.com/v1',
    model: 'claude-3-5-haiku-latest',
    authHeader: 'x-api-key',
    authPrefix: '',
  },
  gemini: {
    id: 'gemini',
    name: 'Google Gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models',
    model: 'gemini-1.5-flash',
    authHeader: '',
    authPrefix: '',
  },
};

// Order matters: the first matching prefix wins. sk-ant-* and pplx-*
// are checked before the generic sk-* rule (which is OpenAI by
// default for ambiguous keys).
const PREFIX_RULES: Array<{ prefix: string; provider: LLMProvider }> = [
  { prefix: 'sk-ant-', provider: 'anthropic' },
  { prefix: 'pplx-', provider: 'perplexity' },
  { prefix: 'AIza', provider: 'gemini' },
  { prefix: 'sk-', provider: 'openai' },
];

/** Length min for a key to be considered a real secret. Different
 *  providers have different lengths but all are > 20. */
const MIN_KEY_LEN = 20;

/** Cheap shape check. Real validation happens on the first extract
 *  call — if the key is wrong, the provider returns 401 and we
 *  surface that to the user. */
export function looksLikeProviderKey(provider: LLMProvider, key: string): boolean {
  if (!key || key.length < MIN_KEY_LEN) return false;
  switch (provider) {
    case 'openai':
    case 'deepseek':
    case 'minimax':
    case 'perplexity':
      return /^sk-[A-Za-z0-9_-]{20,}$/.test(key) || /^pplx-[A-Za-z0-9_-]{20,}$/.test(key);
    case 'anthropic':
      return /^sk-ant-[A-Za-z0-9_-]{20,}$/.test(key);
    case 'gemini':
      return /^AIza[A-Za-z0-9_-]{20,}$/.test(key);
    default:
      return false;
  }
}

/** Best-guess provider from a key's prefix. Defaults to OpenAI for
 *  `sk-…` keys since that's the most common shape. The user can
 *  override via the explicit provider field on POST. */
export function detectProvider(key: string): LLMProvider {
  for (const rule of PREFIX_RULES) {
    if (key.startsWith(rule.prefix)) return rule.provider;
  }
  return 'openai';
}

/** All providers the user can pick from in the UI. */
export const ALL_PROVIDERS: LLMProvider[] = [
  'openai',
  'anthropic',
  'gemini',
  'deepseek',
  'minimax',
  'perplexity',
];