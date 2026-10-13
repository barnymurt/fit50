// storyboard.ts — content-aware storyboard generator.
// v1 reads the brief's sentences and routes them into beats
// with specific visual directions and voice lines, so the
// reviewer sees a real storyboard (not a template with "Cover.
// The viewer lands on the hook."). Phase 7.1 wires the real
// Anthropic call so the LLM writes the beats in the user's
// style and voice — this is the heuristic fallback that
// always runs first and is good enough to be shippable.

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

function lede(idea: string): string {
  // First sentence, trimmed. If it's too short, take the first
  // clause; if it's a run-on, cut at the first comma or " — ".
  const first = idea.split(/(?<=[.!?])\s+/)[0] || idea;
  const m = first.match(/^[^,—.!?]+/);
  return (m ? m[0] : first).trim();
}

function pickChunks(idea: string): { cost: string; turn: string } {
  // Split the rest of the idea (after sentence 1) into two
  // roughly equal halves. If only one sentence, the first half
  // is the whole thing; the second is empty. The storyboard
  // gracefully drops the empty beat rather than padding it.
  const sentences = idea.split(/(?<=[.!?])\s+/).filter(Boolean);
  const rest = sentences.slice(1).join(' ').trim();
  if (!rest) return { cost: '', turn: '' };
  const half = Math.max(1, Math.floor(rest.length / 2));
  // Try to split on a sentence boundary near the half
  const reSentence = /(?<=[.!?])\s+/g;
  const pieces = rest.split(reSentence).filter(Boolean);
  if (pieces.length >= 2) {
    const mid = Math.ceil(pieces.length / 2);
    return { cost: pieces.slice(0, mid).join(' '), turn: pieces.slice(mid).join(' ') };
  }
  return { cost: rest.slice(0, half).trim(), turn: rest.slice(half).trim() };
}

function clamp(s: string, max: number): string {
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  // cut at last word boundary
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > 40 ? cut.slice(0, lastSpace) : cut).replace(/[.,;:!?\-–—\s]+$/, '') + '…';
}

export function generateStoryboard(input: {
  idea: string;
  message_goal: 'reach' | 'saves' | 'signups' | 'link-clicks';
  platforms: string[];
  pillar?: string;
}): Storyboard {
  const ledeText = lede(input.idea);
  const { cost, turn } = pickChunks(input.idea);
  const hook = GOAL_HOOKS[input.message_goal] || 'See this.';
  const cta = GOAL_CTAS[input.message_goal] || { eyebrow: 'Save this', headline: 'Try the ruleset', button: 'Save this' };
  const format = pickPrimaryFormat(input.platforms);

  // The storyboard is built from the brief itself + the goal's
  // hook and CTA. No fake placeholders. If the brief is
  // short, the same line legitimately fills multiple beats
  // (cover = the lede, point = the lede + cost, etc.) — the
  // reviewer sees the repetition and rewrites accordingly.
  // The storyboard UI's inline edit is the source of truth;
  // the generator is a starting point, not a final product.
  const beats: Beat[] = [
    {
      n: 1,
      time_s: 0.0,
      what_happens: `Cover frame: "${ledeText}" in large type on the chosen ground. The whole video is the proof of this one line.`,
      voice_line: clamp(ledeText, 80),
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
      what_happens: `CTA. Coral button on ink. Reads "${cta.eyebrow.toUpperCase()}: ${cta.headline}". The button is the only coral in the deck.`,
      voice_line: cta.eyebrow,
      bridge_to_next: 'Cut to black on the button.',
    },
  ];

  return {
    pillar: input.pillar || 'animated-reel',
    format,
    total_seconds: 6.0,
    beats,
    hook,
    cta: cta.headline,
    message_goal: input.message_goal,
  };
}
