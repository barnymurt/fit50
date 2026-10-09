// model.ts — the only file in the engine that calls the model.
//
// Two functions: outline() and draft(). Both can be replaced
// with a mock via the --mock flag, used by check:generator and
// CI. The mock returns a hand-authored stub for the pillar.
//
// Phase 2 ships:
//   - Mock path (always available, no API key needed)
//   - Real path stub (env-gated; returns a "set ANTHROPIC_API_KEY"
//     error if called without the key, so the user can see
//     what's missing without crashing the whole engine)
//
// Phase 6 adds the prompt cache. Phase 3 adds the small-model
// Rewrite (single-field).

import type { Brief } from '../schema/brief.js';

export interface ModelCallResult<T> {
  raw: T;
  model: string;
  tokens_in: number;
  tokens_out: number;
  est_cost_usd: number;
  elapsed_ms: number;
}

export interface ModelError {
  error: string;
  raw?: string;
}

const API_KEY = process.env.ANTHROPIC_API_KEY || '';

function realModelStub<T>(_kind: 'outline' | 'draft'): ModelCallResult<T> | ModelError {
  if (!API_KEY) {
    return {
      error:
        'ANTHROPIC_API_KEY is not set. Pass --mock to use the hand-authored path, or set the env var.',
    };
  }
  return {
    error:
      'Real model call is not wired in Phase 2. Pass --mock for now. Phase 6 will wire the Anthropic API.',
  };
}

export async function outlineModel(
  _brief: Brief,
  _opts: { mock: boolean; mockReturn: any }
): Promise<ModelCallResult<any> | ModelError> {
  if (_opts.mock) {
    return {
      raw: _opts.mockReturn,
      model: 'mock',
      tokens_in: 0,
      tokens_out: 0,
      est_cost_usd: 0,
      elapsed_ms: 0,
    };
  }
  return realModelStub<any>('outline');
}

export async function draftModel(
  _brief: Brief,
  _opts: { mock: boolean; mockReturn: any }
): Promise<ModelCallResult<any> | ModelError> {
  if (_opts.mock) {
    return {
      raw: _opts.mockReturn,
      model: 'mock',
      tokens_in: 0,
      tokens_out: 0,
      est_cost_usd: 0,
      elapsed_ms: 0,
    };
  }
  return realModelStub<any>('draft');
}
