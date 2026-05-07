import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url, title, description } = body;

    if (!title || typeof title !== 'string') {
      return NextResponse.json({ error: '`title` (string) is required' }, { status: 400 });
    }

    const titleLength = title.length;
    const descLength = (description || '').length;
    const titleWidthPx = Math.round(titleLength * 7.2);

    // Extract domain from URL
    let domain = url || 'example.com';
    try {
      const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
      domain = parsed.hostname;
    } catch {
      domain = url || 'example.com';
    }

    // Truncate display values as Google would
    const displayTitle = titleLength > 60 ? title.slice(0, 57) + '...' : title;
    const displayDescription =
      descLength > 160 ? (description || '').slice(0, 157) + '...' : (description || '');

    return NextResponse.json({
      success: true,
      data: {
        domain,
        displayTitle,
        displayDescription,
        titleLength,
        descLength,
        titleWidthPx,
        titleTruncated: titleLength > 60,
        descTruncated: descLength > 160,
        serpPreview: {
          breadcrumb: domain,
          title: displayTitle,
          description: displayDescription,
        },
      },
    });
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
