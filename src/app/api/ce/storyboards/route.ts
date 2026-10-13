import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { cookies } from 'next/headers';
import { createAdminClient } from '@/lib/supabase-admin';
import { isEditorSessionValid } from '@/lib/editor-auth';
import { generateStoryboard, pickPrimaryFormat } from '@/ce-content-engine/storyboard';
import { pickProvider, type Provider } from '@/ce-content-engine/llm';

const COOKIE = 'ce_llm_provider';

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
    // The provider picker's cookie override wins if set; the
    // pickProvider() env-based default is the fallback.
    const jar = await cookies();
    const override = (jar.get(COOKIE)?.value || '') as Provider | '';
    const provider: Provider | undefined = (override || pickProvider() || undefined) as Provider | undefined;
    const storyboard = await generateStoryboard({ idea, message_goal, platforms, provider });
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
