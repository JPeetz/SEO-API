import { NextRequest, NextResponse } from 'next/server';
import { researchKeywords } from '@/lib/keyword-research';
import { validateAuth } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const auth = validateAuth(req);
  if (!auth.valid) return auth.response!;

  try {
    const body = await req.json();
    const { seed, limit = 12 } = body;

    if (!seed || typeof seed !== 'string' || seed.trim().length < 2) {
      return NextResponse.json(
        { error: '`seed` (string, min 2 chars) is required' },
        { status: 400 }
      );
    }

    const suggestions = await researchKeywords(seed.trim(), Math.min(Number(limit) || 12, 20));
    return NextResponse.json({ success: true, data: { seed: seed.trim(), suggestions } });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    if (msg.toLowerCase().includes('autocomplete')) {
      return NextResponse.json(
        { error: `Keyword research failed: ${msg}` },
        { status: 502 }
      );
    }
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
