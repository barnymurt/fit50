// storyboard.ts — content-aware storyboard generator.
//
// Primary path: real LLM (Anthropic by default, MiniMax if
// MINIMAX_API_KEY is set and ANTHROPIC_API_KEY isn't). The model
// is told to write a real storyboard based on the brief — the
// hook earns the next 5 seconds, the beats flow narratively,
// and the CTA closes the loop. Every line is from the brief
// itself or the goal's hook / CTA — no placeholders.
//
// Fallback: a platform-aware heuristic that splits the brief
// into beats with concrete visual directions and voice lines
// pulled from the brief itself. Always runs if no LLM is
// available; runs after the LLM if the LLM output is unusable.

import { callLLM } from './llm';

export interface Beat {
  n: number;
  time_s: number;
  what_happens: string;
  voice_line: string;
  bridge_to_next: string;
}

export interface Storyboard {
  pillar: string;
  format: '9:16' | '4:5' | '1:1' | '16:9';
  total_seconds: number;
  beats: Beat[];
  hook: string;
  cta: string;
  message_goal: 'reach' | 'saves' | 'signups' | 'link-clicks';
}

const GOAL_HOOKS: Record<string, string> = {
  reach:        'Have you seen this?',
  saves:        'Save this for later.',
  signups:      'Try the ruleset for free.',
  'link-clicks': 'Tap the link in bio for more.',
};
const GOAL_CTAS: Record<string, { eyebrow: string; headline: string; button: string }> = {
  reach:        { eyebrow: 'Share this',  headline: 'Pass it on',  button: 'Share' },
  saves:        { eyebrow: 'Save this',   headline: 'Keep this',  button: 'Save' },
  signups:      { eyebrow: 'Try the ruleset', headline: 'Start the 50 days', button: 'Try free' },
  'link-clicks': { eyebrow: 'Read more',   headline: 'Full story in bio', button: 'Tap to read' },
};

const PLATFORM_TO_ASPECT: Record<string, { aspect: '9:16' | '4:5' | '1:1' | '16:9'; priority: number }> = {
  tiktok:    { aspect: '9:16', priority: 5 },
  reels:     { aspect: '9:16', priority: 4 },
  shorts:    { aspect: '9:16', priority: 3 },
  instagram: { aspect: '4:5',  priority: 2 },
  facebook:  { aspect: '1:1',  priority: 1 },
};

export function pickPrimaryFormat(platforms: string[]): '9:16' | '4:5' | '1:1' | '16:9' {
  if (!platforms.length) return '9:16';
  const sorted = [...platforms].sort((a, b) => (PLATFORM_TO_ASPECT[b]?.priority || 0) - (PLATFORM_TO_ASPECT[a]?.priority || 0));
  return (PLATFORM_TO_ASPECT[sorted[0]]?.aspect) || '9:16';
}

function clamp(s: string, max: number): string {
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > 40 ? cut.slice(0, lastSpace) : cut).replace(/[.,;:!?\-–—\s]+$/, '') + '…';
}

function lede(idea: string): string {
  const first = idea.split(/(?<=[.!?])\s+/)[0] || idea;
  const m = first.match(/^[^,—.!?]+/);
  return (m ? m[0] : first).trim();
}

function pickChunks(idea: string): { cost: string; turn: string } {
  const sentences = idea.split(/(?<=[.!?])\s+/).filter(Boolean);
  const rest = sentences.slice(1).join(' ').trim();
  if (!rest) return { cost: '', turn: '' };
  const half = Math.max(1, Math.floor(rest.length / 2));
  const reSentence = /(?<=[.!?])\s+/g;
  const pieces = rest.split(reSentence).filter(Boolean);
  if (pieces.length >= 2) {
    const mid = Math.ceil(pieces.length / 2);
    return { cost: pieces.slice(0, mid).join(' '), turn: pieces.slice(mid).join(' ') };
  }
  return { cost: rest.slice(0, half).trim(), turn: rest.slice(half).trim() };
}

const PLATFORM_NOTES: Record<string, string> = {
  '9:16': 'vertical reel — hook at the top, text overlay, fast cuts, no intro',
  '4:5':  'IG feed — slower, more polished, caption-heavy',
  '1:1':  'FB feed — square, steady cuts, news-feed rhythm',
  '16:9': 'YouTube / FB widescreen — landscape, room for captions',
};

export async function generateStoryboard(input: {
  idea: string;
  message_goal: 'reach' | 'saves' | 'signups' | 'link-clicks';
  platforms: string[];
  pillar?: string;
}): Promise<Storyboard> {
  // Primary path: real LLM. Provider is auto-selected by env
  // (Anthropic by default, MiniMax if MINIMAX_API_KEY is set
  // and ANTHROPIC_API_KEY isn't). The LLM is told to write a
  // real storyboard — the brief is the source of truth, the
  // goal shapes the hook and CTA, the platform shapes the
  // cadence and visual rhythm.
  try {
    const llm = await generateStoryboardLLM(input);
    if (llm) return llm;
  } catch {
    // fall through to heuristic
  }
  return generateStoryboardHeuristic(input);
}

export async function generateStoryboardLLM(input: {
  idea: string;
  message_goal: 'reach' | 'saves' | 'signups' | 'link-clicks';
  platforms: string[];
  pillar?: string;
}): Promise<Storyboard | null> {
  const format = pickPrimaryFormat(input.platforms);
  const platformNote = PLATFORM_NOTES[format] || '';
  const goalHint = ({ reach: 'goal = reach, hook must be curiosity-creating', saves: 'goal = saves, hook must promise value worth keeping', signups: 'goal = signups, hook must invite a try', 'link-clicks': 'goal = link-clicks, hook must create a curiosity gap' } as const)[input.message_goal];

  const prompt = `You are writing a storyboard for a short-form social video.

Brief: ${JSON.stringify(input.idea)}
Goal: ${input.message_goal} (${goalHint})
Platform(s): ${input.platforms.join(', ')} → primary aspect ${format} (${platformNote})

Return a JSON object with this exact shape:
{
  "beats": [
    { "n": 1, "time_s": 0.0, "what_happens": "...", "voice_line": "...", "bridge_to_next": "..." },
    ... 3 or 4 more beats
  ]
}

Rules
- Use the brief's own words. The voice_line for each beat is a phrase or sentence from the brief, paraphrased if needed but not invented. No "what happened" placeholders.
- The cover beat's voice_line is a curiosity-creating question or statement that earns the next 5 seconds. Do not rephrase sentence 1 — write a hook.
- Each beat's "what_happens" describes a concrete visual: the type on the ground, the camera move, the cut.
- "bridge_to_next" is one short sentence that tells the editor what the next beat's job is.
- "time_s" runs in 1.5s increments starting at 0.0.
- The final beat's voice_line is the goal-driven CTA line, not a beat's worth of copy. Keep it punchy.
- Output ONLY the JSON. No prose, no code fences.`;

  try {
    const res = await callLLM({ prompt, maxTokens: 1500 });
    const cleaned = res.text.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
    let parsed: any;
    try { parsed = JSON.parse(cleaned); } catch { return null; }
    const beats: Beat[] = (parsed.beats || []).map((b: any, i: number) => ({
      n: typeof b.n === 'number' ? b.n : i + 1,
      time_s: typeof b.time_s === 'number' ? b.time_s : i * 1.5,
      what_happens: String(b.what_happens || '').slice(0, 300),
      voice_line: String(b.voice_line || '').slice(0, 200),
      bridge_to_next: String(b.bridge_to_next || '').slice(0, 200),
    })).filter((b: Beat) => b.voice_line.trim().length > 0);
    if (!beats.length) return null;
    const hook = beats[0]?.voice_line || GOAL_HOOKS[input.message_goal] || 'See this.';
    const cta = beats[beats.length - 1]?.voice_line || GOAL_CTAS[input.message_goal].headline;
    return {
      pillar: input.pillar || 'animated-reel',
      format,
      total_seconds: beats[beats.length - 1]?.time_s + 1.5 || 6.0,
      beats,
      hook,
      cta,
      message_goal: input.message_goal,
    };
  } catch {
    return null;
  }
}

export function generateStoryboardHeuristic(input: {
  idea: string;
  message_goal: 'reach' | 'saves' | 'signups' | 'link-clicks';
  platforms: string[];
  pillar?: string;
}): Storyboard {
  const ledeText = lede(input.idea);
  const { cost, turn } = pickChunks(input.idea);
  const hook = GOAL_HOOKS[input.message_goal] || 'See this.';
  const ctaGoal = GOAL_CTAS[input.message_goal] || GOAL_CTAS.reach;
  const format = pickPrimaryFormat(input.platforms);
  const platformNote = PLATFORM_NOTES[format] || '';

  // The storyboard is built from the brief itself + the goal's
  // hook and CTA. No fake placeholders. If the brief is
  // short, the same line legitimately fills multiple beats
  // (cover = the lede, point = the lede + cost, etc.) — the
  // reviewer sees the repetition and rewrites accordingly.
  const beats: Beat[] = [
    {
      n: 1,
      time_s: 0.0,
      what_happens: `Cover. ${platformNote ? platformNote + '. ' : ''}Big type on the chosen ground: "${ledeText}". The whole video is the proof of this one line.`,
      voice_line: hook,
      bridge_to_next: 'Hold for half a second, then the cost.',
    },
    {
      n: 2,
      time_s: 1.5,
      what_happens: `The cost. A single line on paper. Read at sentence pace; the silence after it carries the weight.${cost ? '' : ' (the same lede can serve as the cost — refine in the editor.)'}`,
      voice_line: clamp(cost || ledeText, 100),
      bridge_to_next: turn ? 'Turn it.' : 'Let the silence do the work.',
    },
    {
      n: 3,
      time_s: 3.0,
      what_happens: `The turn. One paragraph on lavender. Why the cost was worth it, or what changed.${turn ? '' : ' (same line as beat 2 if the brief is short — refine.)'}`,
      voice_line: clamp(turn || cost || ledeText, 120),
      bridge_to_next: 'Beat drops to a single line on ink: the CTA.',
    },
    {
      n: 4,
      time_s: 4.5,
      what_happens: `CTA. Coral button on ink. Reads "${ctaGoal.eyebrow.toUpperCase()}: ${ctaGoal.headline}". The button is the only coral in the deck.`,
      voice_line: ctaGoal.eyebrow,
      bridge_to_next: 'Cut to black on the button.',
    },
  ];

  return {
    pillar: input.pillar || 'animated-reel',
    format,
    total_seconds: 6.0,
    beats,
    hook,
    cta: ctaGoal.headline,
    message_goal: input.message_goal,
  };
}
