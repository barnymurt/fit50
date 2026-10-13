// storyboard.ts — heuristic storyboard generator.
// v1 splits the brief into numbered beats: the hook
// (goal-derived), the first sentence (the point), the rest
// (why it matters), the CTA. Phase 7.1 wires the real
// Anthropic call so the LLM writes the beats in the user's
// style and voice.

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

export function generateStoryboard(input: {
  idea: string;
  message_goal: 'reach' | 'saves' | 'signups' | 'link-clicks';
  platforms: string[];
  pillar?: string;
}): Storyboard {
  const sentences = input.idea.split(/(?<=[.!?])\s+/).filter(Boolean);
  const first = sentences[0] || input.idea;
  const rest = sentences.slice(1).join(' ') || '';
  const hook = GOAL_HOOKS[input.message_goal] || 'See this.';
  const cta = GOAL_CTAS[input.message_goal] || { eyebrow: 'Save this', headline: 'Try the ruleset', button: 'Save this' };
  const format = pickPrimaryFormat(input.platforms);

  // Heuristic timing: 1.5s per beat. v1 has 4 beats (hook,
  // point, why, cta). 6s total. Phase 7.1's LLM can vary this.
  const beats: Beat[] = [
    {
      n: 1,
      time_s: 0.0,
      what_happens: 'Cover. The viewer lands on the hook. Visual: ground + hook text.',
      voice_line: hook,
      bridge_to_next: 'Hook lands, then the point.',
    },
    {
      n: 2,
      time_s: 1.5,
      what_happens: 'The point. The first sentence of the brief as a single line on a clean ground.',
      voice_line: first,
      bridge_to_next: 'Point lands, then why it matters.',
    },
    {
      n: 3,
      time_s: 3.0,
      what_happens: 'Why it matters. The rest of the brief, or the strongest supporting line.',
      voice_line: rest || input.idea,
      bridge_to_next: 'Loudest beat under the next line.',
    },
    {
      n: 4,
      time_s: 4.5,
      what_happens: 'CTA. Goal-specific call to action.',
      voice_line: cta.eyebrow + ' ' + cta.headline,
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
