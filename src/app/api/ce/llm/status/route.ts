import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { pickProvider, type Provider } from '@/ce-content-engine/llm';

const COOKIE = 'ce_llm_provider';

export async function GET(_req: NextRequest) {
  const jar = await cookies();
  const override = (jar.get(COOKIE)?.value || '') as Provider | '';
  const available: Array<Provider> = [];
  if (process.env.ANTHROPIC_API_KEY) available.push('anthropic');
  if (process.env.MINIMAX_API_KEY)  available.push('minimax');
  const active: Provider = (override || pickProvider() || null) as Provider | null;
  return NextResponse.json({ available, active });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const provider = (body?.provider || '') as Provider | '';
  const jar = await cookies();
  if (provider === 'anthropic' || provider === 'minimax' || provider === '') {
    if (provider === '') {
      jar.delete(COOKIE);
    } else {
      jar.set(COOKIE, provider, {
        httpOnly: false, // visible to client UI
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 365,
      });
    }
    return NextResponse.json({ ok: true, active: provider || null });
  }
  return NextResponse.json({ error: 'invalid_provider' }, { status: 400 });
}
