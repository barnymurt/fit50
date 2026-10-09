// index.ts — barrel for the generator.

export { generatePost } from './run.js';
export { type GenerationResult } from './run.js';
export { type Brief } from '../schema/brief.js';
export { MOCK_POSTS } from './mocks.js';
export { composeSystemPrompt, composeUserPrompt } from './prompt.js';
export { LOG_PATH, appendLog, type LogEntry } from './log.js';
