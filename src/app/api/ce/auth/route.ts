import { NextRequest, NextResponse } from 'next/server';
import { isEditorPasswordValid, setEditorSessionCookie, clearEditorSessionCookie } from '@/lib/editor-auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!isEditorPasswordValid(String(body.password || ''))) {
      return NextResponse.json({ error: 'wrong_password' }, { status: 401 });
    }
    await setEditorSessionCookie();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  }
}

export async function DELETE() {
  await clearEditorSessionCookie();
  return NextResponse.json({ ok: true });
}
