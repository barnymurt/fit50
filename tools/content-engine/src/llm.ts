// llm.ts — provider-agnostic LLM client.
//
// Current provider: Anthropic (the API key in ANTHROPIC_API_KEY).
// Other providers: MiniMax (api.minimax.io — OpenAI-compatible
// endpoint) when MINIMAX_API_KEY is set. Provider is auto-selected
// by env: the first available key wins. Set the
// `LLM_PROVIDER` env var to force a specific one.
//
// The client only knows how to send a single-turn prompt and
// get a JSON object back. That's all the storyboard generator
// needs; adding more providers is a one-class change.

export type Provider = 'anthropic' | 'minimax' | null;

export interface LLMRequest {
  system?: string;
  prompt: string;
  maxTokens?: number;
  model?: string;
  provider?: Provider | null;
}

export interface LLMResponse {
  text: string;
  provider: Provider;
  model: string;
}

export function pickProvider(): Provider {
  // Priority: explicit env override, then MiniMax (the live
  // FIT50 app's food section uses it for content generation,
  // and the editor storyboard path now matches — same base URL,
  // same model resolution, same OpenAI-compat endpoint).
  // Anthropic stays as the fallback.
  const forced = (process.env.LLM_PROVIDER || '').toLowerCase();
  if (forced === 'anthropic') return process.env.ANTHROPIC_API_KEY ? 'anthropic' : null;
  if (forced === 'minimax')  return process.env.MINIMAX_API_KEY  ? 'minimax'  : null;
  if (process.env.MINIMAX_API_KEY)  return 'minimax';
  if (process.env.ANTHROPIC_API_KEY) return 'anthropic';
  return null;
}

export async function callLLM(req: LLMRequest): Promise<LLMResponse> {
  const provider = req.provider || pickProvider();
  if (!provider) throw new Error('No LLM provider configured. Set ANTHROPIC_API_KEY or MINIMAX_API_KEY.');
  if (provider === 'anthropic') return callAnthropic(req);
  if (provider === 'minimax')  return callMinimax(req);
  throw new Error(`Unknown LLM provider: ${provider}`);
}

async function callAnthropic(req: LLMRequest): Promise<LLMResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');
  const model = req.model || process.env.ANTHROPIC_MODEL || 'claude-3-5-haiku-latest';
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: req.maxTokens || 1500,
      system: req.system,
      messages: [{ role: 'user', content: req.prompt }],
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Anthropic error ${res.status}: ${text.slice(0, 200)}`);
  }
  const j: any = await res.json();
  const text: string = j?.content?.[0]?.text || '';
  return { text, provider: 'anthropic', model };
}

async function callMinimax(req: LLMRequest): Promise<LLMResponse> {
  // MiniMax / MiniMax-Platform — OpenAI-compatible chat
  // completions. Same config as the food section's LLM
  // provider (src/lib/llm/providers.ts): api.minimax.chat/v1,
  // model defaults to MiniMax-Text-01. Set MINIMAX_MODEL
  // (e.g. M3 / H3 / MiniMax-Text-01) to override the model.
  const apiKey = process.env.MINIMAX_API_KEY;
  if (!apiKey) throw new Error('MINIMAX_API_KEY not set');
  const base = process.env.MINIMAX_BASE_URL || 'https://api.minimax.chat/v1';
  const model = req.model || process.env.MINIMAX_MODEL || 'MiniMax-Text-01';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);
  let res: Response;
  try {
    res = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        max_tokens: req.maxTokens || 1500,
        temperature: 0.4,
        response_format: { type: 'json_object' },
        messages: [
          ...(req.system ? [{ role: 'system' as const, content: req.system }] : []),
          { role: 'user' as const, content: req.prompt },
        ],
      }),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`MiniMax error ${res.status}: ${text.slice(0, 300)}`);
  }
  const j: any = await res.json();
  // OpenAI-compatible response shape: choices[0].message.content
  const text: string = j?.choices?.[0]?.message?.content || '';
  return { text, provider: 'minimax', model };
}
