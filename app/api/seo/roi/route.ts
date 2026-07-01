import { NextRequest, NextResponse } from 'next/server';
import { calculateROI } from '@/lib/seo-utils';
import { validateAuth } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const auth = validateAuth(req);
  if (!auth.valid) return auth.response!;

  try {
    const body = await req.json();
    const {
      searchVolume,
      position,
      conversionRate,
      revenuePerConversion,
      monthlyInvestment,
      timeframe,
    } = body;

    const required = { searchVolume, position, conversionRate, revenuePerConversion, monthlyInvestment, timeframe };
    for (const [key, val] of Object.entries(required)) {
      if (val === undefined || val === null || typeof val !== 'number') {
        return NextResponse.json({ error: `\`${key}\` (number) is required` }, { status: 400 });
      }
    }

    const result = calculateROI(
      searchVolume, position, conversionRate, revenuePerConversion, monthlyInvestment, timeframe
    );
    return NextResponse.json({ success: true, data: result });
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
