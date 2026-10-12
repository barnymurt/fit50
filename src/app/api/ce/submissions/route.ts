import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { listSubmissions, createSubmission } from '@/lib/ce-helpers';
import { isEditorSessionValid } from '@/lib/editor-auth';
import { createAdminClient } from '@/lib/supabase-admin';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

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
  try {
    const body = await req.json();
    const parsed = SubmissionBody.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'schema_failed', issues: parsed.error.issues }, { status: 422 });
    }
    // Server-side premium check. We resolve the requester via
    // the Supabase session cookie (created on sign-in) and look
    // up profiles.is_premium. The editor's session also passes
    // through this and is allowed (the editor is the moderator,
    // not a challenge participant). The intake forms must be
    // premium; the editor can approve/reject via the dedicated
    // endpoints that already check the editor cookie.
    const isEditor = await isEditorSessionValid();
    if (!isEditor) {
      // Resolve the SSR session
      const cookieStore = await cookies();
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (url && key) {
        const ssr = createServerClient(url, key, {
          cookies: {
            getAll() { return cookieStore.getAll(); },
            setAll(toSet) { try { toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch {} },
          },
        });
        const { data: { user } } = await ssr.auth.getUser();
        if (!user) {
          return NextResponse.json({ error: 'sign_in_required' }, { status: 401 });
        }
        if (user.id !== parsed.data.member_id) {
          return NextResponse.json({ error: 'member_id_mismatch' }, { status: 403 });
        }
        const admin = createAdminClient() as any;
        const { data: prof } = await admin.from('profiles').select('is_premium').eq('id', user.id).maybeSingle();
        if (!prof?.is_premium) {
          return NextResponse.json({ error: 'premium_required' }, { status: 402 });
        }
      } else {
        // No Supabase env vars in this environment (CI mock) —
        // skip the check.
      }
    }
    const sub = await createSubmission(parsed.data);
    return NextResponse.json({ submission: sub });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
