// log.ts — append-only generation log.
//
// One JSONL line per generation call. Lives in
// tools/content-engine/out/generations.jsonl (gitignored).
// Powers the Phase 6 spend dashboard and the budget cap.

import { appendFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';

export const LOG_PATH = join('out', 'generations.jsonl');

export interface LogEntry {
  post_id: string;
  kind: 'outline' | 'draft' | 'retry';
  pillar: string;
  model: string;
  tokens_in: number;
  tokens_out: number;
  est_cost_usd: number;
  passed_checks: boolean | null;
  elapsed_ms: number;
  timestamp: string;
  notes?: string;
}

export async function appendLog(entry: LogEntry, logPath: string = LOG_PATH) {
  await mkdir(dirname(logPath), { recursive: true });
  await appendFile(logPath, JSON.stringify(entry) + '\n', 'utf8');
}
