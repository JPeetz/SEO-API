import { NextRequest, NextResponse } from 'next/server';
import { calculatePageSpeed } from '@/lib/seo-utils';
import { validateAuth } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const auth = validateAuth(req);
  if (!auth.valid) return auth.response!;

  try {
    const body = await req.json();
    const { lcp, fid, cls, pageSize, httpRequests, ttfb } = body;

    const required = { lcp, fid, cls, pageSize, httpRequests, ttfb };
    for (const [key, val] of Object.entries(required)) {
      if (val === undefined || val === null || typeof val !== 'number') {
        return NextResponse.json({ error: `\`${key}\` (number) is required` }, { status: 400 });
      }
    }

    const result = calculatePageSpeed(lcp, fid, cls, pageSize, httpRequests, ttfb);
    return NextResponse.json({ success: true, data: result });
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
