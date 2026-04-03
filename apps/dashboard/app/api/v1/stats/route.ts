import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createUserClient } from '../../../../lib/supabase';

// Period to interval mapping
const PERIOD_MAP: Record<string, number> = {
  '1h': 1 * 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
  '90d': 90 * 24 * 60 * 60 * 1000,
};

export async function GET(request: NextRequest) {
  const projectId = request.nextUrl.searchParams.get('project_id');
  const period = request.nextUrl.searchParams.get('period') || '7d';

  if (!projectId) {
    return NextResponse.json({ error: 'project_id is required' }, { status: 400 });
  }

  const periodMs = PERIOD_MAP[period];
  if (!periodMs) {
    return NextResponse.json(
      { error: `Invalid period. Use one of: ${Object.keys(PERIOD_MAP).join(', ')}` },
      { status: 400 }
    );
  }

  // Authenticate user via Authorization header or cookie
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  // Verify the user owns this project
  const userClient = createUserClient(token);
  const { data: project, error: projectError } = await userClient
    .from('projects')
    .select('id, user_id')
    .eq('id', projectId)
    .single();

  if (projectError || !project) {
    return NextResponse.json({ error: 'Project not found or access denied' }, { status: 404 });
  }

  // Use service role for aggregation queries
  const supabase = createServerClient();
  const since = new Date(Date.now() - periodMs).toISOString();

  // Fetch all events in period for this project
  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select('type, name, url, referrer, session_id, properties, created_at')
    .eq('project_id', projectId)
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(10000);

  if (eventsError) {
    console.error('[VibePing] Stats query error:', eventsError);
    return NextResponse.json({ error: 'Failed to query events' }, { status: 500 });
  }

  const rows = events || [];

  // Aggregate stats
  const pageviews = rows.filter((e) => e.type === 'pageview');
  const errors = rows.filter((e) => e.type === 'error');
  const vitals = rows.filter((e) => e.type === 'vital');
  const sessions = new Set(rows.map((e) => e.session_id).filter(Boolean));

  // Top pages
  const pageCounts: Record<string, number> = {};
  for (const pv of pageviews) {
    const path = pv.url || '/';
    pageCounts[path] = (pageCounts[path] || 0) + 1;
  }
  const topPages = Object.entries(pageCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([path, views]) => ({ path, views }));

  // Top referrers
  const refCounts: Record<string, number> = {};
  for (const pv of pageviews) {
    const ref = pv.referrer || '(direct)';
    refCounts[ref] = (refCounts[ref] || 0) + 1;
  }
  const topReferrers = Object.entries(refCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([referrer, count]) => ({ referrer, count }));

  // Web vitals averages
  const vitalStats: Record<string, { sum: number; count: number }> = {};
  for (const v of vitals) {
    const name = v.name || 'unknown';
    const value = (v.properties as Record<string, number>)?.value;
    if (typeof value === 'number') {
      if (!vitalStats[name]) vitalStats[name] = { sum: 0, count: 0 };
      vitalStats[name].sum += value;
      vitalStats[name].count += 1;
    }
  }
  const avgVitals: Record<string, number> = {};
  for (const [name, stats] of Object.entries(vitalStats)) {
    avgVitals[name] = Math.round((stats.sum / stats.count) * 100) / 100;
  }

  return NextResponse.json({
    period,
    since,
    totalPageviews: pageviews.length,
    uniqueSessions: sessions.size,
    errorCount: errors.length,
    topPages,
    topReferrers,
    avgVitals,
    totalEvents: rows.length,
  });
}
