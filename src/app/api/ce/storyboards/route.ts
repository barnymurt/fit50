import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase-admin';
import { isEditorSessionValid } from '@/lib/editor-auth';
import { generateStoryboard, pickPrimaryFormat } from '@/ce-content-engine/storyboard';

const Body = z.object({
  idea: z.string().min(1),
  message_goal: z.enum(['reach', 'saves', 'signups', 'link-clicks']).default('reach'),
  platforms: z.array(z.enum(['tiktok', 'reels', 'shorts', 'instagram', 'facebook'])).min(1),
});

export async function POST(req: NextRequest) {
  if (!(await isEditorSessionValid())) return NextResponse.json({ error: 'editor_session_required' }, { status: 401 });
  try {
    const body = await req.json();
    const parsed = Body.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'schema_failed', issues: parsed.error.issues }, { status: 422 });
    }
    const { idea, message_goal, platforms } = parsed.data;
    const storyboard = generateStoryboard({ idea, message_goal, platforms });
    const sb = createAdminClient() as any;
    const { data, error } = await sb.from('content_storyboards').insert({
      idea,
      message_goal,
      platforms,
      beats: storyboard.beats,
      pillar: 'animated-reel',
      format: pickPrimaryFormat(platforms),
      post_id: null,
      status: 'pending',
    }).select('*').single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ storyboard_id: data.id });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
