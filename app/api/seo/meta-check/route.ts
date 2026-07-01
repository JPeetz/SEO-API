import { NextRequest, NextResponse } from 'next/server';
import { checkMetaTags } from '@/lib/seo-utils';
import { validateAuth } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const auth = validateAuth(req);
  if (!auth.valid) return auth.response!;

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
