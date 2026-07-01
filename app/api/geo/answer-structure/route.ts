import { NextRequest, NextResponse } from 'next/server';
import { analyzeAnswerStructure } from '@/lib/geo-utils';
import { validateAuth } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const auth = validateAuth(req);
  if (!auth.valid) return auth.response!;

  try {
    const { content } = await req.json();
    if (!content || typeof content !== 'string')
      return NextResponse.json({ error: '`content` (string) is required' }, { status: 400 });
    return NextResponse.json({ success: true, data: analyzeAnswerStructure(content) });
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
}
export async function OPTIONS() { return new NextResponse(null, { status: 204 }); }
