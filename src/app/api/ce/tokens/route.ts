import { NextResponse } from 'next/server';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const TOKENS_PATH = join(process.cwd(), 'tools', 'content-engine', 'brand', 'tokens.json');

export async function GET() {
  try {
    const raw = await readFile(TOKENS_PATH, 'utf8');
    return new NextResponse(raw, {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  } catch (err) {
    return NextResponse.json({ error: 'tokens_not_found' }, { status: 500 });
  }
}
