import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase-admin';
import { isEditorSessionValid } from '@/lib/editor-auth';

const PLATFORM_TO_ASPECT: Record<string, { aspect: '9:16' | '4:5' | '1:1' | '16:9'; priority: number }> = {
  tiktok:    { aspect: '9:16', priority: 5 },
  reels:     { aspect: '9:16', priority: 4 },
  shorts:    { aspect: '9:16', priority: 3 },
  instagram: { aspect: '4:5',  priority: 2 },
  facebook:  { aspect: '1:1',  priority: 1 },
};

// Goal-specific copy the user can tweak in the editor.
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

// Map the chosen platforms to the set of MP4 formats we'll
// produce. One MP4 per format (e.g. tiktok + facebook →
// 9:16 + 1:1).
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

export async function POST(req: NextRequest) {
  if (!(await isEditorSessionValid())) return NextResponse.json({ error: 'editor_session_required' }, { status: 401 });
  try {
    const body = await req.json();
    const parsed = Body.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'schema_failed', issues: parsed.error.issues }, { status: 422 });
    }
    const { idea, message_goal, platforms } = parsed.data;

    // Pick the dominant platform (highest priority) for the
    // post's primary aspect; the animation runs once for the
    // other formats by re-targeting the same piece.
    const sortedPlatforms = [...platforms].sort((a, b) => (PLATFORM_TO_ASPECT[b]?.priority || 0) - (PLATFORM_TO_ASPECT[a]?.priority || 0));
    const primary = sortedPlatforms[0];
    const aspect = (PLATFORM_TO_ASPECT[primary]?.aspect) || '9:16';
    const formats = formatsForPlatforms(platforms);

    // Build the post id from a slug of the idea + a timestamp.
    const slug = idea.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 32) || 'video';
    const postId = `${slug}-${Date.now()}`;

    // Stub the post's slides (the brief is the source of truth;
    // Phase 7.1 wires the model to write the slides + voice).
    // v1 derives as much as it can from the brief: hook, the
    // first sentence of the idea, the second sentence, and a
    // goal-specific CTA. The user opens the editor and tweaks.
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

    // Kick off the animation. We pass the secondary-formats list
    // (every format except the post's primary, since the post's
    // primary is what the editor already shows in its preview).
    const allFormats = formats as Array<'9:16' | '4:5' | '1:1' | '16:9'>;
    // eslint-disable-next-line no-eval
    const animateMod = eval('require')('../../../../../../tools/content-engine/src/animate.ts') as { runAnimation: (input: any) => Promise<{ pieceDir: string; framesDir: string; rendersDir: string; mp4Paths: Record<string, string>; durationSeconds: number }> };
    try {
      const { data: animRow } = await sb.from('content_animations').insert({
        post_id: postId,
        status: 'building',
        piece_dir: null,
        style: 'cut-paper',
        formats: allFormats,
        mp4_paths: {},
        frames_dir: null,
        duration_ms: null,
        error: null,
      }).select('*').single();

      const animation = await animateMod.runAnimation({
        post,
        style: 'cut-paper',
        formats: allFormats,
        secondsPerSlide: 1.5,
      });

      const mp4_paths: Record<string, string> = {};
      for (const [k, v] of Object.entries(animation.mp4Paths)) mp4_paths[k] = v;
      await sb.from('content_animations').update({
        status: 'ready',
        piece_dir: animation.pieceDir,
        mp4_paths,
        frames_dir: animation.framesDir,
        duration_ms: Math.round(animation.durationSeconds * 1000),
        updated_at: new Date().toISOString(),
      }).eq('id', animRow.id);
    } catch (err) {
      const errMsg = (err as Error).message;
      // Record the failure so the editor surfaces it.
      const { data: animRow } = await sb.from('content_animations').insert({
        post_id: postId,
        status: 'failed',
        piece_dir: null,
        style: 'cut-paper',
        formats: allFormats,
        mp4_paths: {},
        frames_dir: null,
        duration_ms: null,
        error: errMsg,
      });
      // Best-effort; the editor's Animate modal will fetch this.
      void animRow;
    }

    return NextResponse.json({ post_id: postId });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
