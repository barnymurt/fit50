// tokens.ts — typed loaders for the brand folder JSON files.
// All renderer code reads from here, never hardcodes colours /
// sizes / marquee lines.

import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
// tokens.ts lives at tools/content-engine/src/tokens.ts; brand
// is at tools/content-engine/brand/. One `..` is correct.
export const BRAND = join(__dirname, '..', 'brand');

export type Ground = 'paper' | 'teal' | 'lavender' | 'ink' | 'white' | 'cream';
export type Aspect = '4:5' | '9:16';
export type Platform = 'instagram' | 'facebook' | 'tiktok';

export interface Tokens {
  colours: {
    ink: string;
    paper: string;
    coral: string;
    teal: string;
    cream: string;
    lavender: string;
    white: string;
    rule: string;
    rule_light: string;
  };
  fonts: {
    display: { family: string; fallback: string; weight: number; italic: boolean };
    body: { family: string; fallback: string; weight: number; features: string[] };
    marquee: { family: string; fallback: string; weight: number };
  };
  type_scale: {
    instagram: TypeScale;
    tiktok: TypeScale;
  };
  ground_pairs: {
    ink_text_grounds: Ground[];
    paper_text_grounds: Ground[];
  };
  marquee_lines: {
    lines: Array<{ id: string; text: string; width_px_instagram: number; width_px_tiktok: number }>;
    padding_px: number;
  };
  spacing: {
    instagram: { page_padding: number; card_padding: number; rule_thickness: number };
    tiktok: { page_padding: number; card_padding: number; rule_thickness: number };
  };
  instagram_vs_web_deltas: Record<string, unknown>;
}

export interface TypeScale {
  canvas: { width: number; height: number };
  display_1: { size: number; line_height: number; tracking: number };
  display_2: { size: number; line_height: number; tracking: number };
  h1: { size: number; line_height: number; tracking: number };
  h2: { size: number; line_height: number; tracking: number };
  h3: { size: number; line_height: number };
  body: { size: number; line_height: number };
  eyebrow: { size: number; line_height: number; tracking: number; transform: string };
  caption: { size: number; line_height: number; tracking: number; transform: string };
  numeral: { size: number; line_height: number; tracking: number };
  marquee: { size: number; line_height: number; tracking: number };
}

export interface LintRules {
  banned_characters: { in_slide_text: string[] };
  banned_phrases: {
    anywhere_in_post: string[];
    in_feed_post: string[];
  };
  spelling: {
    banned_american_in_body_copy: string[];
    use_british_in_body_copy: string[];
  };
  field_limits: Record<string, Record<string, number | string>>;
  structure: {
    min_slides: number;
    max_slides: number;
    cta_required_on_last_slide: boolean;
    cta_required_max_count: number;
    bridge_required_on_middle_slides: boolean;
    no_two_adjacent_slides_same_ground: boolean;
    coral_used_once_per_slide_max: boolean;
    marquee_required: boolean;
  };
  facts_check: Record<string, unknown>;
}

let _tokens: Tokens | null = null;
let _lint: LintRules | null = null;

export async function loadTokens(): Promise<Tokens> {
  if (_tokens) return _tokens;
  const raw = await readFile(join(BRAND, 'tokens.json'), 'utf8');
  _tokens = JSON.parse(raw) as Tokens;
  return _tokens;
}

export async function loadLint(): Promise<LintRules> {
  if (_lint) return _lint;
  const raw = await readFile(join(BRAND, 'voice-lint.json'), 'utf8');
  _lint = JSON.parse(raw) as LintRules;
  return _lint;
}

// The colour of the text on a given ground. Per the design
// system rule: ink-text grounds (paper, lavender, white, cream)
// get ink text; paper-text grounds (ink, teal) get paper text.
export function textColourFor(ground: Ground): 'ink' | 'paper' {
  const tokens = _tokens;
  if (!tokens) throw new Error('loadTokens() must be called first');
  if (tokens.ground_pairs.ink_text_grounds.includes(ground)) return 'ink';
  return 'paper';
}

export function groundHex(ground: Ground, tokens: Tokens): string {
  return tokens.colours[ground];
}

export function textHex(colour: 'ink' | 'paper', tokens: Tokens): string {
  return tokens.colours[colour];
}

export function typeScaleFor(aspect: Aspect, tokens: Tokens): TypeScale {
  return aspect === '9:16' ? tokens.type_scale.tiktok : tokens.type_scale.instagram;
}

export function canvasSize(aspect: Aspect, tokens: Tokens): { width: number; height: number } {
  return typeScaleFor(aspect, tokens).canvas;
}

export function marqueeLine(id: string, tokens: Tokens) {
  return tokens.marquee_lines.lines.find((l) => l.id === id);
}

export function marqueeLineWidth(ml: { width_px_instagram: number; width_px_tiktok: number }, aspect: Aspect): number {
  return aspect === '9:16' ? ml.width_px_tiktok : ml.width_px_instagram;
}

// Parse `*emphasis*` markdown into <em> spans. Used by every
// template that renders a headline.
export function emphasis(text: string): string {
  return text.replace(/\*([^*]+)\*/g, '<em>$1</em>');
}
