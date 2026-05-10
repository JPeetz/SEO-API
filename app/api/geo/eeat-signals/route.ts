import { NextRequest, NextResponse } from 'next/server';
import { analyzeEEAT } from '@/lib/geo-utils';

export async function POST(req: NextRequest) {
  try {
    const { content } = await req.json();
    if (!content || typeof content !== 'string')
      return NextResponse.json({ error: '`content` (string) is required' }, { status: 400 });
    return NextResponse.json({ success: true, data: analyzeEEAT(content) });
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
}
export async function OPTIONS() { return new NextResponse(null, { status: 204 }); }
