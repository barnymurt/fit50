import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase-admin';
import { isEditorSessionValid } from '@/lib/editor-auth';
import { Post } from '@/ce-content-engine/schema/post';

const PLATFORM_TO_ASPECT: Record<string, { aspect: '9:16' | '4:5' | '1:1' | '16:9'; priority: number }> = {
  tiktok:    { aspect: '9:16', priority: 5 },
  reels:     { aspect: '9:16', priority: 4 },
  shorts:    { aspect: '9:16', priority: 3 },
  instagram: { aspect: '4:5',  priority: 2 },
  facebook:  { aspect: '1:1',  priority: 1 },
};

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

function formatsForPlatforms(platforms: string[]): string[] {
  const set = new Set<string>();
  for (const p of platforms) {
    const m = PLATFORM_TO_ASPECT[p];
    if (m) set.add(m.aspect);
  }
  return Array.from(set);
}

const Body = z.object({
  idea: z.string().min(1),
  message_goal: z.enum(['reach', 'saves', 'signups', 'link-clicks']).default('reach'),
  platforms: z.array(z.enum(['tiktok', 'reels', 'shorts', 'instagram', 'facebook'])).min(1),
});

// runAnimation is dynamically imported inside the handler so
// the renderer / react-dom/server chain stays out of the
// initial route bundle. The `webpackIgnore` magic comment
// prevents Next.js's static analysis from walking the import
// graph (which would flag the react-dom/server import). The
// import is resolved at runtime when the route handler runs.
async function getRunAnimation() {
  const mod = await import(/* webpackIgnore: true */ '@/lib/ce-animate');
  return mod.runAnimation;
}

export async function POST(req: NextRequest) {
  if (!(await isEditorSessionValid())) return NextResponse.json({ error: 'editor_session_required' }, { status: 401 });
  try {
    const body = await req.json();
    const parsed = Body.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'schema_failed', issues: parsed.error.issues }, { status: 422 });
    }
    const { idea, message_goal, platforms } = parsed.data;

    const sortedPlatforms = [...platforms].sort((a, b) => (PLATFORM_TO_ASPECT[b]?.priority || 0) - (PLATFORM_TO_ASPECT[a]?.priority || 0));
    const primary = sortedPlatforms[0];
    const aspect = (PLATFORM_TO_ASPECT[primary]?.aspect) || '9:16';
    const formats = formatsForPlatforms(platforms);

    const slug = idea.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 32) || 'video';
    const postId = `${slug}-${Date.now()}`;

    const sentences = idea.split(/(?<=[.!?])\s+/).filter(Boolean);
    const first = sentences[0] || idea;
    const rest = sentences.slice(1).join(' ') || '';
    const hook = GOAL_HOOKS[message_goal] || 'See this.';
    const cta = GOAL_CTAS[message_goal] || { eyebrow: 'Save this', headline: 'Try the ruleset', button: 'Save this' };

    const slides = [
      { id: 's1', template: 'cover' as const, ground: 'ink' as const, fields: { headline: { text: hook, by: 'human' as const }, eyebrow: { text: 'New video', by: 'human' as const } } },
      { id: 's2', template: 'statement' as const, ground: 'paper' as const, fields: { eyebrow: { text: 'The point', by: 'human' as const }, headline: { text: first.slice(0, 70), by: 'human' as const }, body: { text: first, by: 'human' as const } } },
      { id: 's3', template: 'statement' as const, ground: 'lavender' as const, fields: { eyebrow: { text: 'Why it matters', by: 'human' as const }, headline: { text: rest ? rest.slice(0, 70) : idea.slice(0, 70), by: 'human' as const }, body: { text: rest || idea, by: 'human' as const } } },
      { id: 's4', template: 'cta' as const, ground: 'ink' as const, fields: { eyebrow: { text: cta.eyebrow, by: 'human' as const }, headline: { text: cta.headline, by: 'human' as const }, body: { text: 'Comment below or tap the link in bio.', by: 'human' as const }, button: { text: cta.button, by: 'human' as const } } },
    ];

    const post = {
      id: postId,
      type: 'carousel' as const,
      platform: primary,
      aspect,
      pillar: 'animated-reel',
      brief: idea,
      status: 'draft' as const,
      version: 1,
      marquee: 'marquee_default',
      source: { brief: { idea, message_goal, platforms } },
      slides,
      caption: { text: idea, hashtags: [], by: 'human' as const },
      checks: {},
    };

    const sb = createAdminClient() as any;
    const { data: postRow, error: postErr } = await sb.from('content_posts').insert({
      id: postId,
      pillar: 'animated-reel',
      status: 'draft',
      brief: idea,
      aspect,
      platform: primary,
      marquee: 'marquee_default',
      source: { brief: { idea, message_goal, platforms } },
    }).select('*').single();
    if (postErr) return NextResponse.json({ error: postErr.message }, { status: 500 });

    const { data: ver, error: verErr } = await sb.from('content_post_versions').insert({
      post_id: postId,
      version: 1,
      doc: post,
      saved_by: 'human',
      note: `initial brief — ${message_goal}, ${platforms.join('+')}`,
    }).select('*').single();
    if (verErr) return NextResponse.json({ error: verErr.message }, { status: 500 });

    await sb.from('content_posts').update({ current_version_id: ver.id, updated_at: new Date().toISOString() }).eq('id', postId);

    const runAnimation = await getRunAnimation();
    try {
      const animation = await runAnimation({
        post,
        style: 'cut-paper',
        formats: formats as any,
        secondsPerSlide: 1.5,
      });
      await sb.from('content_animations').insert({
        post_id: postId,
        status: 'ready',
        piece_dir: animation.pieceDir,
        style: 'cut-paper',
        formats,
        mp4_paths: animation.mp4Paths,
        frames_dir: animation.framesDir,
        duration_ms: Math.round(animation.durationSeconds * 1000),
      });
    } catch (err) {
      // The animation needs Playwright + ffmpeg which Vercel's
      // serverless runtime doesn't have. The post is still
      // created (with the goal-derived copy) so the user can
      // finish it in the editor. The animation row records
      // the failure with a hint to run locally.
      await sb.from('content_animations').insert({
        post_id: postId,
        status: 'failed',
        piece_dir: null,
        style: 'cut-paper',
        formats,
        mp4_paths: {},
        frames_dir: null,
        duration_ms: null,
        error: `${(err as Error).message} — run \`npx tsx tools/content-engine/scripts/animate-cli.ts <brief> <out>\` on a machine with ffmpeg + Playwright.`,
      });
    }

    return NextResponse.json({ post_id: postId });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
