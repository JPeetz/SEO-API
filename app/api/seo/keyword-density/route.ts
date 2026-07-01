import { NextRequest, NextResponse } from 'next/server';
import { analyzeKeywordDensity } from '@/lib/seo-utils';
import { validateAuth } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const auth = validateAuth(req);
  if (!auth.valid) return auth.response!;

  try {
    const body = await req.json();
    const { content, keyword = '' } = body;

    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: '`content` (string) is required' }, { status: 400 });
    }

    const result = analyzeKeywordDensity(content, keyword);
    return NextResponse.json({ success: true, data: result });
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
