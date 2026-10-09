import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { listSubmissions, createSubmission } from '@/lib/ce-helpers';
import { isEditorSessionValid } from '@/lib/editor-auth';

const SubmissionBody = z.object({
  member_id: z.string().min(1),
  type: z.enum(['progress', 'book', 'project']),
  answers: z.any(),
  photo_paths: z.array(z.string()).optional(),
  credit_as: z.enum(['full_name', 'first_name', 'anonymous']),
  consent_scope: z.string().min(1),
  consent_at: z.string().min(1),
});

export async function GET(req: NextRequest) {
  if (!(await isEditorSessionValid())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const status = req.nextUrl.searchParams.get('status') || undefined;
  const member_id = req.nextUrl.searchParams.get('member_id') || undefined;
  const submissions = await listSubmissions({
    status: status || undefined,
    member_id: member_id || undefined,
  });
  return NextResponse.json({ submissions });
}

export async function POST(req: NextRequest) {
  // The intake form posts here. Auth: members are signed in
  // (their session is verified separately); the editor is also
  // signed in. We accept either by trusting the supplied
  // member_id. Phase 6 wires real RLS.
  try {
    const body = await req.json();
    const parsed = SubmissionBody.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'schema_failed', issues: parsed.error.issues }, { status: 422 });
    }
    const sub = await createSubmission(parsed.data);
    return NextResponse.json({ submission: sub });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
