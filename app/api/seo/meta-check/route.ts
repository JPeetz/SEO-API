import { NextRequest, NextResponse } from 'next/server';
import { checkMetaTags } from '@/lib/seo-utils';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, description, keyword = '' } = body;

    if (!title || typeof title !== 'string') {
      return NextResponse.json({ error: '`title` (string) is required' }, { status: 400 });
    }
    if (!description || typeof description !== 'string') {
      return NextResponse.json({ error: '`description` (string) is required' }, { status: 400 });
    }

    const result = checkMetaTags(title, description, keyword);
    return NextResponse.json({ success: true, data: result });
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
