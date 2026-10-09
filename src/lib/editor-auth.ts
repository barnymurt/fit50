// auth.ts — env-var password gate for the editor (v1).
//
// The editor lives behind a single env-var password
// (`EDITOR_PASSWORD`). The first time the user visits /editor
// they're prompted for the password; on success we set a
// httpOnly cookie. The middleware checks the cookie on every
// subsequent request.
//
// Phase 6 swaps this for Supabase auth + a real user table.

import { cookies } from 'next/headers';

const COOKIE_NAME = 'ce_editor_session';
const COOKIE_TTL_DAYS = 30;

function expectedPassword(): string {
  return process.env.EDITOR_PASSWORD || 'fit50';
}

export function isEditorPasswordValid(input: string): boolean {
  return input === expectedPassword();
}

export async function setEditorSessionCookie() {
  const jar = await cookies();
  jar.set(COOKIE_NAME, 'ok', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: COOKIE_TTL_DAYS * 24 * 60 * 60,
  });
}

export async function clearEditorSessionCookie() {
  const jar = await cookies();
  jar.set(COOKIE_NAME, '', { path: '/', maxAge: 0 });
}

export async function isEditorSessionValid(): Promise<boolean> {
  const jar = await cookies();
  const c = jar.get(COOKIE_NAME);
  return c?.value === 'ok';
}
