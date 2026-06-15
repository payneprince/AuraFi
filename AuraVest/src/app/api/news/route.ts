import { NextRequest, NextResponse } from 'next/server';

const CACHE_TTL = 5 * 60 * 1000; // 5 min

type NewsItem = { headline: string; url: string; source: string; datetime: number; summary: string };
const cache: Record<string, { data: NewsItem[]; fetchedAt: number }> = {};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
};

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get('symbol') ?? '';
  const key = process.env.FINNHUB_API_KEY;

  if (!key || !symbol) return NextResponse.json([], { headers: corsHeaders });

  const hit = cache[symbol];
  if (hit && Date.now() - hit.fetchedAt < CACHE_TTL) {
    return NextResponse.json(hit.data, { headers: corsHeaders });
  }

  try {
    const to = new Date();
    const from = new Date(Date.now() - 7 * 24 * 3600 * 1000);
    const fmt = (d: Date) => d.toISOString().split('T')[0];

    const res = await fetch(
      `https://finnhub.io/api/v1/company-news?symbol=${symbol}&from=${fmt(from)}&to=${fmt(to)}&token=${key}`,
    );
    if (!res.ok) return NextResponse.json([], { headers: corsHeaders });

    const raw = await res.json();
    const data: NewsItem[] = (Array.isArray(raw) ? raw : [])
      .slice(0, 3)
      .map((item: any) => ({
        headline: item.headline ?? '',
        url: item.url ?? '',
        source: item.source ?? '',
        datetime: item.datetime ?? 0,
        summary: item.summary ?? '',
      }));

    cache[symbol] = { data, fetchedAt: Date.now() };
    return NextResponse.json(data, { headers: corsHeaders });
  } catch {
    return NextResponse.json([], { headers: corsHeaders });
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}
