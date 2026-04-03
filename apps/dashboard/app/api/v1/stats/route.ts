import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key');

  if (!apiKey) {
    return NextResponse.json(
      { error: 'Missing x-api-key header' },
      { status: 401 }
    );
  }

  // TODO: Validate API key against database
  // TODO: Query real stats from Supabase / ClickHouse

  const mockStats = {
    period: '24h',
    pageviews: 12847,
    uniqueVisitors: 3241,
    sessions: 4102,
    avgSessionDuration: 185,
    bounceRate: 0.34,
    errorRate: 0.0012,
    vitals: {
      lcp: { p50: 1.8, p75: 2.4, p95: 4.1 },
      fid: { p50: 12, p75: 24, p95: 89 },
      cls: { p50: 0.05, p75: 0.1, p95: 0.25 },
    },
    topPages: [
      { path: '/', views: 4521 },
      { path: '/pricing', views: 2103 },
      { path: '/docs', views: 1847 },
      { path: '/blog', views: 1203 },
    ],
    topErrors: [
      { message: 'TypeError: Cannot read property "map" of undefined', count: 142 },
      { message: 'ReferenceError: process is not defined', count: 87 },
    ],
  };

  return NextResponse.json(mockStats);
}
