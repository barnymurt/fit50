import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { rejectSubmission } from '@/lib/ce-helpers';
import { isEditorSessionValid } from '@/lib/editor-auth';

const RejectBody = z.object({
  note: z.string().optional(),
});

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isEditorSessionValid())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { id } = await ctx.params;
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = RejectBody.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'schema_failed', issues: parsed.error.issues }, { status: 422 });
    }
    const sub = await rejectSubmission(id, parsed.data.note);
    return NextResponse.json({ submission: sub });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
