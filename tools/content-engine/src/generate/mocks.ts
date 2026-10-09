// mocks.ts — hand-authored stub posts for the 5 library-backed
// pillars. Used by --mock and by check:generator.
//
// Each post is structurally complete: real library references,
// ground sequence alternates, bridges on middle slides, CTA on
// last slide, captions in place. The post-draft checks (Phase 1)
// confirm zero flags.

import type { Post } from '../schema/post.js';

export const MOCK_POSTS: Record<string, Post> = {
  'drinks-recipes': {
    id: 'drinks-cucumber-lime',
    type: 'carousel',
    platform: 'instagram',
    aspect: '4:5',
    pillar: 'drinks-recipes',
    brief: 'Cucumber lime agua fresca. 8 minutes. Two cues.',
    status: 'draft',
    version: 1,
    marquee: 'marquee_default',
    source: { recipe_id: 'cucumber-lime', library: 'libraries/drinks.json' },
    slides: [
      {
        id: 's1',
        template: 'cover',
        ground: 'ink',
        fields: {
          eyebrow:  { text: 'Drink · Zero proof', by: 'human', locked: true },
          headline: { text: 'Cucumber *lime agua.*', by: 'human', locked: true },
          sub:      { text: '8 minutes. Two ingredients.', by: 'human' },
        },
      },
      {
        id: 's2',
        template: 'list',
        ground: 'paper',
        fields: {
          eyebrow:  { text: 'What you need', by: 'human' },
          headline: { text: '*Two* things.', by: 'human' },
          items: [
            { title: '1/2 cucumber, sliced', icon: 'fresh-lungs' },
            { title: '30 ml lime juice', icon: 'wet-lips' },
          ],
          bridge: { text: 'Plus sparkling water and honey', by: 'human' },
        },
      },
      {
        id: 's3',
        template: 'statement',
        ground: 'lavender',
        fields: {
          eyebrow:  { text: 'The method', by: 'human' },
          headline: { text: 'Muddle, *don\u2019t blend.*', by: 'human' },
          body:     { text: 'Press the cucumber into the lime with a wooden spoon. Keep the slices whole so the glass looks the part.', by: 'human' },
          bridge:   { text: 'Sharp, not pulpy', by: 'human' },
        },
      },
      {
        id: 's4',
        template: 'statement',
        ground: 'teal',
        fields: {
          eyebrow:  { text: 'Finish', by: 'human' },
          headline: { text: 'Top with *sparkling* water.', by: 'human' },
          body:     { text: 'Stir in a teaspoon of honey if your limes are sharp. Pour over a tall glass of ice.', by: 'human' },
          bridge:   { text: 'Now the sharper cup', by: 'human' },
        },
      },
      {
        id: 's5',
        template: 'cta',
        ground: 'paper',
        fields: {
          eyebrow:  { text: 'Save this', by: 'human' },
          headline: { text: '50 *zero-proof* drinks.', by: 'human' },
          body:     { text: 'All metric. All low-sugar. The link is in the bio.', by: 'human' },
          button:   { text: 'Save the recipe', by: 'human' },
        },
      },
    ],
    caption: {
      text: 'Cucumber lime agua. 8 minutes. The trick is muddling, not blending. Recipe in the bio.\n\n#fit50 #zeroproof #aguafresca #cucumber',
      hashtags: ['#fit50', '#zeroproof', '#aguafresca', '#cucumber'],
      by: 'human',
    },
    checks: { facts: 'pending', voice_lint: 'pending', design: 'pending', fit: 'pending' },
  } as Post,

  workouts: {
    id: 'workouts-line-b',
    type: 'carousel',
    platform: 'tiktok',
    aspect: '9:16',
    pillar: 'workouts',
    brief: 'Line B. Upper body, push. 5 moves, no kit.',
    status: 'draft',
    version: 1,
    marquee: 'marquee_default',
    source: { line_letter: 'B', library: 'libraries/workouts.json' },
    slides: [
      {
        id: 's1',
        template: 'cover',
        ground: 'ink',
        fields: {
          eyebrow:  { text: 'Day 12 · 50 days', by: 'human', locked: true },
          headline: { text: 'Line *B*', by: 'human', locked: true },
          sub:      { text: 'Upper body, push. 20 minutes.', by: 'human' },
        },
      },
      {
        id: 's2',
        template: 'workout-line',
        ground: 'paper',
        fields: {
          eyebrow:  { text: 'The line', by: 'human' },
          headline: { text: 'B', by: 'human' },
          letter:   'B',
          exercises: [
            { name: 'Push-Up',              sets: 4, reps: '8 to 12' },
            { name: 'Pike Push-Up',         sets: 3, reps: '8' },
            { name: 'Dip (chair)',          sets: 3, reps: '10' },
            { name: 'Plank Shoulder Tap',   sets: 3, reps: '10 each side' },
            { name: 'Bear Crawl',           sets: 2, reps: '30 seconds' },
          ],
          finisher: '1 minute shadow boxing',
          bridge: { text: 'Five moves, all bodyweight', by: 'human' },
        },
      },
      {
        id: 's3',
        template: 'list',
        ground: 'lavender',
        fields: {
          eyebrow:  { text: 'The form', by: 'human' },
          headline: { text: '*Two* cues.', by: 'human' },
          items: [
            { title: 'Core tight on the push-up', icon: null },
            { title: 'Slow on the way down', icon: null },
          ],
          bridge: { text: 'Don\u2019t bounce the dip', by: 'human' },
        },
      },
      {
        id: 's4',
        template: 'statement',
        ground: 'teal',
        fields: {
          eyebrow:  { text: 'Finisher', by: 'human' },
          headline: { text: '1 minute *shadow boxing.*', by: 'human' },
          body:     { text: 'Calm the heart rate. Cool the shoulders. Then stretch for 5 minutes.', by: 'human' },
          bridge:   { text: 'That\u2019s the line done', by: 'human' },
        },
      },
      {
        id: 's5',
        template: 'cta',
        ground: 'paper',
        fields: {
          eyebrow:  { text: 'Save this', by: 'human' },
          headline: { text: 'Day 12. *One line.*', by: 'human' },
          body:     { text: 'Comment \u2018B\u2019 for the rest of the 50 days, one line a day. Link in bio for the free tracker.', by: 'human' },
          button:   { text: 'Comment B', by: 'human' },
        },
      },
    ],
    caption: {
      text: 'Day 12 of 50. Line B. 5 moves, no kit, 20 minutes. The hardest one is the dip.\n\n#fit50 #day12 #workout #lineB #50days',
      hashtags: ['#fit50', '#day12', '#workout', '#lineB', '#50days'],
      by: 'human',
    },
    checks: { facts: 'pending', voice_lint: 'pending', design: 'pending', fit: 'pending' },
  } as Post,

  'origin-story': {
    id: 'story-woolies-basket',
    type: 'carousel',
    platform: 'instagram',
    aspect: '4:5',
    pillar: 'origin-story',
    brief: 'The Woolies basket. Day 1 of the ruleset. Four-pack of biscuits. Halfway to the car.',
    status: 'draft',
    version: 1,
    marquee: 'marquee_default',
    source: { library: 'libraries/story-bank.md', episode: 1 },
    slides: [
      {
        id: 's1',
        template: 'cover',
        ground: 'ink',
        fields: {
          eyebrow:  { text: 'Origin · One', by: 'human', locked: true },
          headline: { text: 'The *Woolies basket.*', by: 'human', locked: true },
          sub:      { text: 'Day 1 of the ruleset.', by: 'human' },
        },
      },
      {
        id: 's2',
        template: 'statement',
        ground: 'paper',
        fields: {
          eyebrow:  { text: 'The shop', by: 'human' },
          headline: { text: '*Two* litres of water.', by: 'human' },
          body:     { text: 'A tub of yoghurt. A bag of oats. Six bananas. And a four-pack of biscuits I bought like an idiot. The ruleset said Fuel Right.', by: 'human' },
          bridge:   { text: 'I made it halfway to the car', by: 'human' },
        },
      },
      {
        id: 's3',
        template: 'statement',
        ground: 'lavender',
        fields: {
          eyebrow:  { text: 'The day', by: 'human' },
          headline: { text: '*Halfway* to the car.', by: 'human' },
          body:     { text: 'I ate the first one before the keys were in the ignition. The rules were three days old and the biscuit aisle had already won.', by: 'human' },
          bridge:   { text: 'The honest version', by: 'human' },
        },
      },
      {
        id: 's4',
        template: 'statement',
        ground: 'teal',
        fields: {
          eyebrow:  { text: 'The lesson', by: 'human' },
          headline: { text: 'The rules are the *rules.*', by: 'human' },
          body:     { text: 'A four-pack is still a four-pack, even with a caneca on the table. I learned that week, not day one.', by: 'human' },
          bridge:   { text: 'Then the ruleset stuck', by: 'human' },
        },
      },
      {
        id: 's5',
        template: 'cta',
        ground: 'paper',
        fields: {
          eyebrow:  { text: 'Read more', by: 'human' },
          headline: { text: 'The rest is *in the bio.*', by: 'human' },
          body:     { text: 'Eight episodes from the founder. Specific scenes, no TED-talk. The link is in the bio.', by: 'human' },
          button:   { text: 'Read the bank', by: 'human' },
        },
      },
    ],
    caption: {
      text: 'The Woolies basket. Day 1 of the ruleset. Halfway to the car. More in the bio.\n\n#fit50 #origin #day1 #woolies',
      hashtags: ['#fit50', '#origin', '#day1', '#woolies'],
      by: 'human',
    },
    checks: { facts: 'pending', voice_lint: 'pending', design: 'pending', fit: 'pending' },
  } as Post,

  'quit-smoking': {
    id: 'quitsmoking-uk-helplines',
    type: 'carousel',
    platform: 'facebook',
    aspect: '4:5',
    pillar: 'quit-smoking',
    brief: 'Three UK quit smoking services. Names exactly. No health claims.',
    status: 'draft',
    version: 1,
    marquee: 'marquee_quiet',
    source: { library: 'libraries/quit-resources.json' },
    slides: [
      {
        id: 's1',
        template: 'cover',
        ground: 'teal',
        fields: {
          eyebrow:  { text: 'Quit · UK', by: 'human', locked: true },
          headline: { text: '*Three* services.', by: 'human', locked: true },
          sub:      { text: 'No judgement. One of them is yours.', by: 'human' },
        },
      },
      {
        id: 's2',
        template: 'list',
        ground: 'paper',
        fields: {
          eyebrow:  { text: 'Phone and web', by: 'human' },
          headline: { text: 'Pick the *one.*', by: 'human' },
          items: [
            { title: 'NHS Smokefree', icon: null },
            { title: 'NHS Smokefree Helpline', icon: null },
            { title: 'Asthma + Lung UK', icon: null },
          ],
          bridge: { text: 'The link is in the bio', by: 'human' },
        },
      },
      {
        id: 's3',
        template: 'statement',
        ground: 'lavender',
        fields: {
          eyebrow:  { text: 'A line on the wall', by: 'human' },
          headline: { text: '*No* judgement.', by: 'human' },
          body:     { text: 'These services have been around for more than a decade. The people on the other end have heard every version of your day.', by: 'human' },
          bridge:   { text: 'Pick the one that fits', by: 'human' },
        },
      },
      {
        id: 's4',
        template: 'statement',
        ground: 'ink',
        fields: {
          eyebrow:  { text: 'The Fresh Lungs rule', by: 'human' },
          headline: { text: 'No cigarettes, *no vaping.*', by: 'human' },
          body:     { text: 'The rule on the site says exactly that. The services here treat both the same. Fresh Lungs is the rule name, not a line.', by: 'human' },
          bridge:   { text: 'The ruleset meets the wall', by: 'human' },
        },
      },
      {
        id: 's5',
        template: 'cta',
        ground: 'paper',
        fields: {
          eyebrow:  { text: 'Save this', by: 'human' },
          headline: { text: 'The link is in the *bio.*', by: 'human' },
          body:     { text: '40 services, one per country, all in the bio. No health claims, no judgement. Pick the one and call.', by: 'human' },
          button:   { text: 'Save the list', by: 'human' },
        },
      },
    ],
    caption: {
      text: 'Three UK quit smoking services. No judgement. The link is in the bio.\n\n#fit50 #quitsmoking #freshlungs #nhs',
      hashtags: ['#fit50', '#quitsmoking', '#freshlungs', '#nhs'],
      by: 'human',
    },
    checks: { facts: 'pending', voice_lint: 'pending', design: 'pending', fit: 'pending' },
  } as Post,

  'challenge-explainers': {
    id: 'explain-day-1',
    type: 'carousel',
    platform: 'instagram',
    aspect: '4:5',
    pillar: 'challenge-explainers',
    brief: 'Day 1 of FIT50. The nine rules. No price. Link in bio.',
    status: 'draft',
    version: 1,
    marquee: 'marquee_default',
    source: { library: 'facts.json' },
    slides: [
      {
        id: 's1',
        template: 'cover',
        ground: 'ink',
        fields: {
          eyebrow:  { text: 'Day 1 · 50 days', by: 'human', locked: true },
          headline: { text: '50 days. *9 habits.*', by: 'human', locked: true },
          sub:      { text: 'Could you do all nine?', by: 'human' },
        },
      },
      {
        id: 's2',
        template: 'list',
        ground: 'paper',
        fields: {
          eyebrow:  { text: 'The 9 rules', by: 'human' },
          headline: { text: '*Five* for the body.', by: 'human' },
          items: [
            { title: 'Move Your Body',  icon: 'move-body' },
            { title: 'Step It Up',      icon: 'step-it-up' },
            { title: 'Wet The Lips',    icon: 'wet-lips' },
            { title: 'Fuel Right',      icon: 'fuel-right' },
            { title: 'Crispy Clarity',  icon: 'crispy-clarity' },
          ],
          bridge: { text: 'The body\u2019s the easy part', by: 'human' },
        },
      },
      {
        id: 's3',
        template: 'list',
        ground: 'lavender',
        fields: {
          eyebrow:  { text: 'The 9 rules', by: 'human' },
          headline: { text: '*Four* for the head.', by: 'human' },
          items: [
            { title: 'Chill Out',     icon: 'chill-out' },
            { title: 'Open Mind',     icon: 'open-mind' },
            { title: 'Feed Your Brain', icon: 'feed-brain' },
            { title: 'Fresh Lungs',   icon: 'fresh-lungs' },
          ],
          bridge: { text: 'Plus the streak', by: 'human' },
        },
      },
      {
        id: 's4',
        template: 'numeral',
        ground: 'teal',
        fields: {
          eyebrow:  { text: 'The number', by: 'human' },
          headline: { text: '50 *days.*', by: 'human' },
          number:   '50',
          body:     { text: '10,000 steps. 2.5 litres. 10 minutes. 5 books or 30 minutes. The numbers, exact.', by: 'human' },
          bridge:   { text: 'No slogans, just numbers', by: 'human' },
        },
      },
      {
        id: 's5',
        template: 'cta',
        ground: 'paper',
        fields: {
          eyebrow:  { text: 'Try day 1', by: 'human' },
          headline: { text: 'Start *tomorrow.*', by: 'human' },
          body:     { text: 'Pick a day. Read the rules. The link is in the bio.', by: 'human' },
          button:   { text: 'Start the ruleset', by: 'human' },
        },
      },
    ],
    caption: {
      text: 'Day 1 of FIT50. 50 days. 9 habits. 10,000 steps. 2.5 litres. The link is in the bio.\n\n#fit50 #day1 #50days #9habits',
      hashtags: ['#fit50', '#day1', '#50days', '#9habits'],
      by: 'human',
    },
    checks: { facts: 'pending', voice_lint: 'pending', design: 'pending', fit: 'pending' },
  } as Post,
};
