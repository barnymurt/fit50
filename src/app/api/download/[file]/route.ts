import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

// Map of url slug -> file on disk + content-type + filename.
const FILES: Record<string, { file: string; contentType: string; downloadName: string }> = {
  'fridge-checklist': {
    file: 'fit50-fridge-checklist.pdf',
    contentType: 'application/pdf',
    downloadName: 'FIT50_Fridge_Checklist.pdf',
  },
  workout: {
    file: 'fit50-bodyweight-four.pdf',
    contentType: 'application/pdf',
    downloadName: 'FIT50_Bodyweight_Four.pdf',
  },
};

export async function GET(
  req: NextRequest,
  { params }: { params: { file: string } }
) {
  const entry = FILES[params.file];
  if (!entry) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Log the download. Fire-and-forget so a logging failure doesn't
  // block the file from being served. Capture user_id if a session
  // JWT is present.
  void logDownload(req, params.file).catch((err) => {
    console.error('download log failed', err);
  });

  try {
    const filepath = path.join(process.cwd(), 'public', entry.file);
    const data = await readFile(filepath);
    return new NextResponse(data, {
      status: 200,
      headers: {
        'content-type': entry.contentType,
        'content-disposition': `attachment; filename="${entry.downloadName}"`,
        'content-length': data.length.toString(),
        'cache-control': 'no-store',
      },
    });
  } catch (err) {
    console.error('download read failed', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

async function logDownload(req: NextRequest, file: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return;
  // Service-role client bypasses RLS for the insert.
  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  // Read the user's access token from the Authorization header so
  // we can resolve user_id server-side (no need to trust the
  // client-provided body).
  const authHeader = req.headers.get('authorization');
  let userId: string | null = null;
  if (authHeader) {
    const token = authHeader.replace(/^Bearer\s+/i, '');
    const { data } = await admin.auth.getUser(token);
    if (data?.user) userId = data.user.id;
  }
  await admin.from('downloads').insert({ file, user_id: userId });
}