// brief.ts — Zod schema for a content engine brief.
//
// The brief is the only thing the user types in. The generator
// takes it, runs the outline → draft → checks pipeline, and
// returns a finished post JSON.

import { z } from 'zod';

export const Brief = z.object({
  pillar: z.string(),
  goal: z.enum(['reach', 'saves', 'link-clicks']).default('reach'),
  message: z.string().min(1),
  slide_count: z.number().int().min(3).max(7).default(5),
  call_to_action: z
    .enum(['link-in-bio', 'comment-keyword'])
    .default('link-in-bio'),
  must_include_facts: z.array(z.string()).default([]),
  aspect: z.enum(['4:5', '9:16']).default('4:5'),
  platform: z.enum(['instagram', 'facebook', 'tiktok']).default('instagram'),
  // Optional: pin a library entry the post should be about
  // (e.g. a specific recipe id for the drinks-recipes pillar).
  pin_recipe_id: z.string().optional(),
  pin_line_letter: z.string().optional(),
});

export type Brief = z.infer<typeof Brief>;
