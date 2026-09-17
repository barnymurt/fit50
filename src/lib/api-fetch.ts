// Tiny client-side helper for the authed API surface. Adds the
// current Supabase access token as Authorization: Bearer … and
// sends the body. JSON bodies are stringified; everything else
// (FormData, Blob, ArrayBuffer, URLSearchParams, string) is passed
// through untouched so the browser can set its own Content-Type
// (e.g. multipart/form-data with the right boundary). The matching
// server-side helper (src/lib/auth-server.ts) validates the token
// against the admin client — works regardless of whether cookies
// are set, which is the situation this app is in (sessions live
// in localStorage).
//
// Use this for any /api/account/* or /api/foods/custom/* call that
// currently relies on the user being authenticated.

import { createClient } from './supabase';

type Body = unknown;
type BodyInit = NonNullable<RequestInit['body']>;

export interface ApiFetchOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'PUT';
  body?: Body;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

// Body shapes that fetch must pass through verbatim — JSON-stringifying
// any of them would corrupt the payload. Anything else is treated as
// JSON.
function looksLikeStructuredBody(body: unknown): boolean {
  if (body == null) return false;
  if (typeof body === 'string') return false;
  if (body instanceof FormData) return true;
  if (body instanceof Blob) return true;
  if (body instanceof ArrayBuffer) return true;
  if (typeof ArrayBuffer !== 'undefined' && ArrayBuffer.isView(body)) return true;
  if (typeof URLSearchParams !== 'undefined' && body instanceof URLSearchParams) {
    return true;
  }
  return false;
}

export async function apiFetch(
  url: string,
  options: ApiFetchOptions = {}
): Promise<Response> {
  const supabase = createClient();
  const headers: Record<string, string> = { ...(options.headers ?? {}) };
  // Default to JSON for plain-object bodies. Leave the Content-Type
  // unset for FormData / Blob / etc. so the browser sets it (with
  // the right multipart boundary, etc.) — overriding it with
  // application/json would mangle FormData bodies.
  if (options.body !== undefined && !looksLikeStructuredBody(options.body)) {
    headers['Content-Type'] = 'application/json';
  }
  if (supabase) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      headers.Authorization = `Bearer ${session.access_token}`;
    }
  }
  const body =
    options.body === undefined
      ? undefined
      : looksLikeStructuredBody(options.body)
        ? (options.body as unknown as BodyInit)
        : JSON.stringify(options.body);
  return fetch(url, {
    method: options.method ?? 'GET',
    headers,
    body,
    signal: options.signal,
    credentials: 'same-origin',
  });
}

/**
 * Same as apiFetch but parses the JSON body and throws if !ok.
 * Returns the parsed payload or `null` for 204s.
 */
export async function apiJson<T = unknown>(
  url: string,
  options: ApiFetchOptions = {}
): Promise<T> {
  const res = await apiFetch(url, options);
  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const data = (await res.json()) as { error?: string };
      if (data?.error) message = data.error;
    } catch {
      // ignore
    }
    throw new Error(message);
  }
  if (res.status === 204) return null as T;
  return (await res.json()) as T;
}
