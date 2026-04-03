import { createAuthClient } from '../lib/auth';
import StatCard from '../components/StatCard';
import EmptyState from '../components/EmptyState';

async function getStats(projectId: string) {
  const supabase = createAuthClient();

  // Total events (pageviews)
  const { count: totalViews } = await supabase
    .from('events')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId)
    .eq('type', 'pageview');

  // Unique sessions
  const { data: sessionData } = await supabase
    .from('events')
    .select('session_id')
    .eq('project_id', projectId)
    .eq('type', 'pageview');
  const uniqueSessions = new Set(sessionData?.map((e) => e.session_id)).size;

  // Errors
  const { data: errors, count: errorCount } = await supabase
    .from('events')
    .select('*', { count: 'exact' })
    .eq('project_id', projectId)
    .eq('type', 'error')
    .order('created_at', { ascending: false })
    .limit(5);

  // Uptime
  const { data: uptimeChecks } = await supabase
    .from('uptime_checks')
    .select('id, url')
    .eq('project_id', projectId)
    .limit(1);

  let uptimeStatus = 'unknown';
  if (uptimeChecks && uptimeChecks.length > 0) {
    const { data: lastPing } = await supabase
      .from('uptime_pings')
      .select('status')
      .eq('check_id', uptimeChecks[0].id)
      .order('created_at', { ascending: false })
      .limit(1);
    uptimeStatus = lastPing?.[0]?.status === 'up' ? 'up' : 'down';
  }

  // Top pages
  const { data: allPageviews } = await supabase
    .from('events')
    .select('url')
    .eq('project_id', projectId)
    .eq('type', 'pageview');

  const pageCounts: Record<string, number> = {};
  allPageviews?.forEach((e) => {
    const url = e.url || '/';
    pageCounts[url] = (pageCounts[url] || 0) + 1;
  });
  const topPages = Object.entries(pageCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([url, count]) => ({ url, count }));

  // Top referrers
  const { data: allEvents } = await supabase
    .from('events')
    .select('referrer')
    .eq('project_id', projectId)
    .eq('type', 'pageview')
    .not('referrer', 'is', null);

  const refCounts: Record<string, number> = {};
  allEvents?.forEach((e) => {
    const ref = e.referrer || 'Direct';
    refCounts[ref] = (refCounts[ref] || 0) + 1;
  });
  const topReferrers = Object.entries(refCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([referrer, count]) => ({ referrer, count }));

  // Web Vitals
  const { data: vitalsData } = await supabase
    .from('events')
    .select('type, payload')
    .eq('project_id', projectId)
    .in('type', ['web-vital', 'web_vital'])
    .order('created_at', { ascending: false })
    .limit(50);

  const vitals: Record<string, number[]> = { LCP: [], FID: [], CLS: [] };
  vitalsData?.forEach((e) => {
    const p = e.payload as Record<string, unknown> | null;
    if (p && typeof p === 'object') {
      const name = (p.name as string)?.toUpperCase();
      const value = Number(p.value);
      if (name && vitals[name] && !isNaN(value)) {
        vitals[name].push(value);
      }
    }
  });

  const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null);

  return {
    totalViews: totalViews || 0,
    uniqueSessions,
    errorCount: errorCount || 0,
    recentErrors: errors || [],
    uptimeStatus,
    topPages,
    topReferrers,
    webVitals: {
      lcp: avg(vitals.LCP),
      fid: avg(vitals.FID),
      cls: avg(vitals.CLS),
    },
  };
}

export default async function OverviewPage() {
  const supabase = createAuthClient();

  // Get user's first project
  const { data: projects } = await supabase
    .from('projects')
    .select('id, name')
    .order('created_at', { ascending: true })
    .limit(1);

  const project = projects?.[0];

  if (!project) {
    return <EmptyState />;
  }

  const stats = await getStats(project.id);
  const hasData = stats.totalViews > 0;

  if (!hasData) {
    return <EmptyState />;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white font-outfit">Overview</h1>
        <p className="text-slate-400 mt-1">Your app&apos;s health at a glance</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
              />
            </svg>
          }
          label="Total Visitors"
          value={stats.totalViews.toLocaleString()}
          trend={{ value: '—', positive: true }}
        />
        <StatCard
          icon={
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
              />
            </svg>
          }
          label="Unique Sessions"
          value={stats.uniqueSessions.toLocaleString()}
        />
        <StatCard
          icon={
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
          }
          label="Errors"
          value={stats.errorCount}
          alert={stats.errorCount > 0}
        />
        <StatCard
          icon={
            <span
              className={`inline-block w-3 h-3 rounded-full ${
                stats.uptimeStatus === 'up'
                  ? 'bg-green-400'
                  : stats.uptimeStatus === 'down'
                    ? 'bg-red-400'
                    : 'bg-slate-500'
              }`}
            />
          }
          label="Uptime Status"
          value={
            stats.uptimeStatus === 'up' ? 'Online' : stats.uptimeStatus === 'down' ? 'Down' : 'N/A'
          }
        />
      </div>

      {/* Content Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Top Pages */}
        <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-xl p-5">
          <h2 className="text-lg font-semibold text-white mb-4 font-outfit">Top Pages</h2>
          {stats.topPages.length > 0 ? (
            <table className="w-full">
              <thead>
                <tr className="text-xs text-slate-500 uppercase">
                  <th className="text-left pb-3">Page</th>
                  <th className="text-right pb-3">Views</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {stats.topPages.map((page) => (
                  <tr key={page.url}>
                    <td className="py-2.5 text-sm text-slate-300 truncate max-w-[200px]">
                      {page.url}
                    </td>
                    <td className="py-2.5 text-sm text-white text-right font-medium">
                      {page.count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-slate-500 text-sm">No page data yet</p>
          )}
        </div>

        {/* Top Referrers */}
        <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-xl p-5">
          <h2 className="text-lg font-semibold text-white mb-4 font-outfit">Top Referrers</h2>
          {stats.topReferrers.length > 0 ? (
            <table className="w-full">
              <thead>
                <tr className="text-xs text-slate-500 uppercase">
                  <th className="text-left pb-3">Referrer</th>
                  <th className="text-right pb-3">Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {stats.topReferrers.map((ref) => (
                  <tr key={ref.referrer}>
                    <td className="py-2.5 text-sm text-slate-300 truncate max-w-[200px]">
                      {ref.referrer}
                    </td>
                    <td className="py-2.5 text-sm text-white text-right font-medium">
                      {ref.count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-slate-500 text-sm">No referrer data yet</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Errors */}
        <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-xl p-5">
          <h2 className="text-lg font-semibold text-white mb-4 font-outfit">Recent Errors</h2>
          {stats.recentErrors.length > 0 ? (
            <div className="space-y-3">
              {stats.recentErrors.map((err: Record<string, unknown>, i: number) => (
                <div key={i} className="bg-red-500/5 border border-red-500/10 rounded-lg p-3">
                  <p className="text-sm text-red-400 font-medium truncate">
                    {((err.payload as Record<string, unknown>)?.message as string) ||
                      'Unknown error'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {new Date(err.created_at as string).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-green-400 text-sm">
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              No errors — everything is clean!
            </div>
          )}
        </div>

        {/* Web Vitals */}
        <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-xl p-5">
          <h2 className="text-lg font-semibold text-white mb-4 font-outfit">Web Vitals</h2>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/5 rounded-lg p-3 text-center">
              <p className="text-xs text-slate-500 mb-1">LCP</p>
              <p className="text-xl font-bold text-white">
                {stats.webVitals.lcp !== null ? `${(stats.webVitals.lcp / 1000).toFixed(1)}s` : '—'}
              </p>
              <p className="text-xs text-slate-500 mt-1">Largest Contentful Paint</p>
            </div>
            <div className="bg-white/5 rounded-lg p-3 text-center">
              <p className="text-xs text-slate-500 mb-1">FID</p>
              <p className="text-xl font-bold text-white">
                {stats.webVitals.fid !== null ? `${Math.round(stats.webVitals.fid)}ms` : '—'}
              </p>
              <p className="text-xs text-slate-500 mt-1">First Input Delay</p>
            </div>
            <div className="bg-white/5 rounded-lg p-3 text-center">
              <p className="text-xs text-slate-500 mb-1">CLS</p>
              <p className="text-xl font-bold text-white">
                {stats.webVitals.cls !== null ? stats.webVitals.cls.toFixed(3) : '—'}
              </p>
              <p className="text-xs text-slate-500 mt-1">Cumulative Layout Shift</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
