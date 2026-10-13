import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase-admin';
import { isEditorSessionValid } from '@/lib/editor-auth';
import { Post } from '@/ce-content-engine/schema/post';
import type { Beat } from '@/ce-content-engine/storyboard';

const Body = z.object({
  beats: z.array(z.object({
    n: z.number(),
    time_s: z.number(),
    what_happens: z.string(),
    voice_line: z.string(),
    bridge_to_next: z.string(),
  })),
});

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

function pickPrimaryFormat(platforms: string[]): '9:16' | '4:5' | '1:1' | '16:9' {
  if (!platforms.length) return '9:16';
  const sorted = [...platforms].sort((a, b) => (PLATFORM_TO_ASPECT[b]?.priority || 0) - (PLATFORM_TO_ASPECT[a]?.priority || 0));
  return (PLATFORM_TO_ASPECT[sorted[0]]?.aspect) || '9:16';
}

function formatsForPlatforms(platforms: string[]): string[] {
  const set = new Set<string>();
  for (const p of platforms) {
    const m = PLATFORM_TO_ASPECT[p];
    if (m) set.add(m.aspect);
  }
  return Array.from(set);
}

function buildSlidesFromBeats(beats: Beat[], messageGoal: string): any[] {
  const hook = GOAL_HOOKS[messageGoal] || 'See this.';
  const cta = GOAL_CTAS[messageGoal] || { eyebrow: 'Save this', headline: 'Try the ruleset', button: 'Save this' };
  // Standard 4-beat structure: cover, point (beat 2), why (beat 3), cta (beat 4).
  // The user can have edited the beats; we map them by index.
  const cover = beats[0]?.voice_line || hook;
  const point = beats[1]?.voice_line || beats[0]?.voice_line || hook;
  const why = beats[2]?.voice_line || beats[beats.length - 2]?.voice_line || '';
  return [
    { id: 's1', template: 'cover' as const, ground: 'ink' as const, fields: { headline: { text: cover, by: 'human' as const }, eyebrow: { text: 'New video', by: 'human' as const } } },
    { id: 's2', template: 'statement' as const, ground: 'paper' as const, fields: { eyebrow: { text: 'The point', by: 'human' as const }, headline: { text: point.slice(0, 70), by: 'human' as const }, body: { text: point, by: 'human' as const } } },
    { id: 's3', template: 'statement' as const, ground: 'lavender' as const, fields: { eyebrow: { text: 'Why it matters', by: 'human' as const }, headline: { text: why.slice(0, 70) || cta.headline, by: 'human' as const }, body: { text: why, by: 'human' as const } } },
    { id: 's4', template: 'cta' as const, ground: 'ink' as const, fields: { eyebrow: { text: cta.eyebrow, by: 'human' as const }, headline: { text: cta.headline, by: 'human' as const }, body: { text: 'Comment below or tap the link in bio.', by: 'human' as const }, button: { text: cta.button, by: 'human' as const } } },
  ];
}

async function getRunAnimation() {
  const mod = await import(/* webpackIgnore: true */ '@/lib/ce-animate');
  return mod.runAnimation;
}

async function runAnimationInBackground(postId: string, post: any, formats: any) {
  const sb = createAdminClient() as any;
  try {
    await sb.from('content_animations').update({ status: 'building' }).eq('post_id', postId);
    const runAnimation = await getRunAnimation();
    const animation = await runAnimation({
      post,
      style: 'cut-paper',
      formats,
      secondsPerSlide: 1.5,
    });
    await sb.from('content_animations').update({
      status: 'ready',
      piece_dir: animation.pieceDir,
      mp4_paths: animation.mp4Paths,
      frames_dir: animation.framesDir,
      duration_ms: Math.round(animation.durationSeconds * 1000),
      updated_at: new Date().toISOString(),
    }).eq('post_id', postId);
  } catch (err) {
    await sb.from('content_animations').update({
      status: 'failed',
      error: `${(err as Error).message}. Run the animation locally with ffmpeg + Playwright installed.`,
      updated_at: new Date().toISOString(),
    }).eq('post_id', postId);
  }
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isEditorSessionValid())) return NextResponse.json({ error: 'editor_session_required' }, { status: 401 });
  const { id } = await ctx.params;
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = Body.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'schema_failed', issues: parsed.error.issues }, { status: 422 });
    }
    const sb = createAdminClient() as any;
    const { data: sbRow, error: sbErr } = await sb.from('content_storyboards').select('*').eq('id', id).maybeSingle();
    if (sbErr || !sbRow) return NextResponse.json({ error: sbErr?.message || 'not_found' }, { status: 500 });

    const beats: Beat[] = parsed.data.beats.length > 0 ? parsed.data.beats : sbRow.beats;
    const platforms: string[] = sbRow.platforms;
    const messageGoal: string = sbRow.message_goal;
    const aspect = sbRow.format || pickPrimaryFormat(platforms);
    const formats = formatsForPlatforms(platforms);

    const slug = sbRow.idea.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 32) || 'video';
    const postId = `${slug}-${Date.now()}`;
    const primaryPlatform = [...platforms].sort((a, b) => (PLATFORM_TO_ASPECT[b]?.priority || 0) - (PLATFORM_TO_ASPECT[a]?.priority || 0))[0];

    const slides = buildSlidesFromBeats(beats, messageGoal);
    const post = {
      id: postId,
      type: 'carousel' as const,
      platform: primaryPlatform,
      aspect,
      pillar: 'animated-reel',
      brief: sbRow.idea,
      status: 'draft' as const,
      version: 1,
      marquee: 'marquee_default',
      source: {
        brief: { idea: sbRow.idea, message_goal: sbRow.message_goal, platforms },
        storyboard_id: id,
      },
      slides,
      caption: { text: sbRow.idea, hashtags: [], by: 'human' as const },
      checks: {},
    };

    const { data: postRow, error: postErr } = await sb.from('content_posts').insert({
      id: postId,
      pillar: 'animated-reel',
      status: 'draft',
      brief: sbRow.idea,
      aspect,
      platform: primaryPlatform,
      marquee: 'marquee_default',
      source: { brief: { idea: sbRow.idea, message_goal: sbRow.message_goal, platforms }, storyboard_id: id },
    }).select('*').single();
    if (postErr) return NextResponse.json({ error: postErr.message }, { status: 500 });

    const { data: ver, error: verErr } = await sb.from('content_post_versions').insert({
      post_id: postId,
      version: 1,
      doc: post,
      saved_by: 'human',
      note: `storyboard ${id} approved`,
    }).select('*').single();
    if (verErr) return NextResponse.json({ error: verErr.message }, { status: 500 });

    await sb.from('content_posts').update({ current_version_id: ver.id, updated_at: new Date().toISOString() }).eq('id', postId);
    await sb.from('content_storyboards').update({ status: 'approved', approved_at: new Date().toISOString(), post_id: postId }).eq('id', id);
    await sb.from('content_animations').insert({
      post_id: postId,
      status: 'queued',
      piece_dir: null,
      style: 'cut-paper',
      formats,
      mp4_paths: {},
      frames_dir: null,
      duration_ms: null,
      error: null,
    });

    setImmediate(() => {
      runAnimationInBackground(postId, post, formats as any).catch(() => {});
    });

    return NextResponse.json({ post_id: postId });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
