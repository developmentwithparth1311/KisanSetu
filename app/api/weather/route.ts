import { NextResponse } from 'next/server';
import { fetchMandiWeather } from '@/lib/weather';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mandiId = searchParams.get('mandi') || 'nashik';
    const weather = await fetchMandiWeather(mandiId);
    return NextResponse.json(weather);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
