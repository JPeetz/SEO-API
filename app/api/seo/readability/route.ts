import { NextRequest, NextResponse } from 'next/server';
import { analyzeReadability } from '@/lib/seo-utils';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { content } = body;

    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: '`content` (string) is required' }, { status: 400 });
    }

    const result = analyzeReadability(content);
    return NextResponse.json({ success: true, data: result });
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
