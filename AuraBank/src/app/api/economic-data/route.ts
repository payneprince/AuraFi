import { NextResponse } from 'next/server';

const CACHE_TTL = 24 * 60 * 60 * 1000; // 24h — World Bank updates annually

let cached: { inflationRate: number | null; year: string; fetchedAt: number } | null = null;

async function fetchGhanaData() {
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) return cached;

  try {
    const res = await fetch(
      'https://api.worldbank.org/v2/country/GH/indicator/FP.CPI.TOTL.ZG?format=json&mrv=2',
      { next: { revalidate: 86400 } },
    );
    if (!res.ok) throw new Error(`World Bank ${res.status}`);

    const json = await res.json();
    // Response shape: [metadata, [{value, date}, ...]]
    const entries = (json[1] ?? []) as Array<{ value: number | null; date: string }>;
    const latest = entries.find((e) => e.value !== null);

    cached = {
      inflationRate: latest?.value != null ? Number(latest.value.toFixed(1)) : null,
      year: latest?.date ?? '',
      fetchedAt: Date.now(),
    };
  } catch {
    cached = { inflationRate: null, year: '', fetchedAt: Date.now() };
  }

  return cached;
}

export async function GET() {
  const data = await fetchGhanaData();
  return NextResponse.json(data);
}
