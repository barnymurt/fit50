// post.ts — Zod schema for a content engine post.
//
// One schema for everything: the model's structured output
// (Phase 2), the editor's draft (Phase 3), the renderer's input
// (this phase), the example posts on disk. If a draft doesn't
// match, it's rejected before any credits are spent.
//
// The schema is intentionally permissive about field shape
// (every field is .optional()) so a single template can render
// without knowing which fields exist on the others. The design
// rules and the per-template field limits in voice-lint.json
// are the ones that enforce "this slide is missing a bridge".

import { z } from 'zod';

const TextField = z.object({
  text: z.string(),
  by: z.enum(['ai', 'human']).optional(),
  locked: z.boolean().optional(),
});

const Item = z.object({
  title: z.string(),
  detail: z.string().optional(),
  icon: z.string().nullable().optional(),
});

const Exercise = z.object({
  name: z.string(),
  sets: z.number().int().positive(),
  reps: z.string(),
});

export const Field = TextField;

export const SlideFields = z
  .object({
    eyebrow: TextField.optional(),
    headline: TextField.optional(),
    sub: TextField.optional(),
    body: TextField.optional(),
    bridge: TextField.optional(),
    button: TextField.optional(),
    items: z.array(Item).optional(),
    letter: z.string().optional(),
    exercises: z.array(Exercise).optional(),
    finisher: z.string().optional(),
    number: z.string().optional(),
    icon: z.string().nullable().optional(),
    title: TextField.optional(),
  })
  .passthrough();

export const Slide = z.object({
  id: z.string(),
  template: z.enum([
    'cover',
    'statement',
    'list',
    'numeral',
    'icon-card',
    'cta',
    'workout-line',
  ]),
  ground: z.enum([
    'paper',
    'teal',
    'lavender',
    'ink',
    'white',
    'cream',
  ]),
  fields: SlideFields,
});

export const Caption = z.object({
  text: z.string(),
  hashtags: z.array(z.string()).optional(),
  by: z.enum(['ai', 'human']).optional(),
});

export const PostSource = z
  .object({
    recipe_id: z.string().optional(),
    line_letter: z.string().optional(),
    library: z.string().optional(),
    submission_id: z.string().optional(),
  })
  .passthrough();

export const Post = z.object({
  id: z.string(),
  type: z.literal('carousel'),
  platform: z.enum(['instagram', 'facebook', 'tiktok']),
  aspect: z.enum(['4:5', '9:16']),
  pillar: z.string(),
  brief: z.string().optional(),
  status: z.enum(['draft', 'review', 'approved', 'exported']).default('draft'),
  version: z.number().int().nonnegative().default(1),
  marquee: z.string().optional(),
  source: PostSource.optional(),
  slides: z.array(Slide).min(3).max(7),
  caption: Caption.optional(),
  checks: z
    .object({
      facts: z.string().optional(),
      voice_lint: z.string().optional(),
      design: z.string().optional(),
      fit: z.string().optional(),
      lastRenderedAt: z.string().optional(),
    })
    .passthrough()
    .optional(),
});

export type Post = z.infer<typeof Post>;
export type Slide = z.infer<typeof Slide>;
export type Item = z.infer<typeof Item>;
export type Exercise = z.infer<typeof Exercise>;
export type Field = z.infer<typeof Field>;
