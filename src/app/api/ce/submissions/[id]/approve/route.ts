import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { approveSubmission } from '@/lib/ce-helpers';
import { isEditorSessionValid } from '@/lib/editor-auth';

const ApproveBody = z.object({
  generate_post: z.boolean().default(true),
  pillar: z.enum(['member-progress', 'books-members-read', 'passion-projects']).optional(),
});

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isEditorSessionValid())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { id } = await ctx.params;
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = ApproveBody.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'schema_failed', issues: parsed.error.issues }, { status: 422 });
    }
    const result = await approveSubmission(id, parsed.data);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
