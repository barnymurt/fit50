import { NextRequest, NextResponse } from 'next/server';
import { isEditorPasswordValid, setEditorSessionCookie, clearEditorSessionCookie } from '@/lib/editor-auth';

export async function POST(req: NextRequest) {
  // The editor layout uses a native HTML form (Content-Type:
  // application/x-www-form-urlencoded), but a future client-side
  // sign-in might POST JSON. Accept both. req.formData() handles
  // x-www-form-urlencoded + multipart; JSON falls through to
  // req.json().
  let password = '';
  try {
    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const body = await req.json();
      password = String(body.password || '');
    } else {
      const form = await req.formData();
      password = String(form.get('password') || '');
    }
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  }
  if (!isEditorPasswordValid(password)) {
    // Native form submit: redirect back to /editor with an
    // error query string. JSON: return 401.
    const accept = req.headers.get('accept') || '';
    if (accept.includes('application/json')) {
      return NextResponse.json({ error: 'wrong_password' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/editor?error=wrong_password', req.url), 303);
  }
  await setEditorSessionCookie();
  // Native form submit: redirect to /editor so the next render
  // sees the cookie. JSON: return ok.
  const accept = req.headers.get('accept') || '';
  if (accept.includes('application/json')) {
    return NextResponse.json({ ok: true });
  }
  return NextResponse.redirect(new URL('/editor', req.url), 303);
}

export async function DELETE() {
  await clearEditorSessionCookie();
  return NextResponse.json({ ok: true });
}
