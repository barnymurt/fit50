import { NextRequest, NextResponse } from 'next/server';
import { Post } from '@/ce-content-engine/schema/post';
import { isEditorSessionValid } from '@/lib/editor-auth';

// POST /api/ce/posts/:id/critic
//
// Body: { pillar, current_doc }
//
// Returns { hook, bridges, payoff, weakest_slide, notes }
// with each score 0..10. v1 ships a deterministic stub: a
// doc with no flags scores 10/10/10; flags reduce the score
// based on which field tripped (ground-sequence hits bridges,
// length caps hit hook, etc.). The real Anthropic call is
// wired in 6.1.
//
// The "weakest slide" is the first slide whose field list
// shows up in the post's check flags. If no flags, it's null.

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isEditorSessionValid())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  try {
    const { id } = await ctx.params;
    const body = await req.json().catch(() => ({}));
    const doc = body.current_doc;
    if (!doc) return NextResponse.json({ error: 'current_doc required' }, { status: 400 });

    const flags: any[] = body.flags || [];
    const weakest = flags.find((f) => f.slideId) || null;

    // Deterministic scoring. The model's job in 6.1 is to do
    // this with semantic understanding; the stub just counts
    // flags and tags the worst-affected dimension.
    const flagCount = flags.length;
    const base = 10;
    const deduction = Math.min(flagCount * 2, 8);
    let hook = base - deduction;
    let bridges = base - deduction;
    let payoff = base - deduction;
    // Tilt based on which field tripped.
    for (const f of flags) {
      const path = (f.field || '').toLowerCase();
      if (path.includes('headline') || path.includes('eyebrow') || path.includes('sub')) hook -= 1;
      if (path.includes('bridge') || path.includes('item')) bridges -= 1;
      if (path.includes('body') || path.includes('button')) payoff -= 1;
    }
    hook = Math.max(0, Math.min(10, hook));
    bridges = Math.max(0, Math.min(10, bridges));
    payoff = Math.max(0, Math.min(10, payoff));

    const notes = flagCount === 0
      ? 'No flags. Hook / bridges / payoff all read cleanly.'
      : `${flagCount} check flag(s) on this post. See the right pane for which fields tripped.`;

    return NextResponse.json({
      post_id: id,
      hook, bridges, payoff,
      weakest_slide: weakest ? weakest.slideId : null,
      notes,
      flag_count: flagCount,
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
