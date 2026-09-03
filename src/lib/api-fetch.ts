// Tiny client-side helper for the authed API surface. Adds the
// current Supabase access token as Authorization: Bearer … and
// stringifies the body as JSON. The matching server-side helper
// (src/lib/auth-server.ts) validates the token against the admin
// client — works regardless of whether cookies are set, which is
// the situation this app is in (sessions live in localStorage).
//
// Use this for any /api/account/* or /api/foods/custom/* call that
// currently relies on the user being authenticated.

import { createClient } from './supabase';

type Body = unknown;

export interface ApiFetchOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'PUT';
  body?: Body;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

export async function apiFetch(
  url: string,
  options: ApiFetchOptions = {}
): Promise<Response> {
  const supabase = createClient();
  const headers: Record<string, string> = { ...(options.headers ?? {}) };
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (supabase) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      headers.Authorization = `Bearer ${session.access_token}`;
    }
  }
  return fetch(url, {
    method: options.method ?? 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
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
