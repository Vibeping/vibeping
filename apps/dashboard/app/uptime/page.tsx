import { createAuthClient } from '../../lib/auth';
import { createServerClient } from '../../lib/supabase';
import StatCard from '../../components/StatCard';
import UptimeClient from './UptimeClient';

export default async function UptimePage() {
  const authClient = createAuthClient();

  const { data: projects } = await authClient
    .from('projects')
    .select('id, name')
    .order('created_at', { ascending: true })
    .limit(1);

  const project = projects?.[0];

  if (!project) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white font-outfit">Uptime Monitoring</h1>
          <p className="text-slate-400 mt-1">Track your application availability</p>
        </div>
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <div className="text-6xl mb-6">📡</div>
          <h2 className="text-2xl font-bold text-white mb-2 font-outfit">
            No project found
          </h2>
          <p className="text-slate-400 text-center max-w-md">
            Create a project first to start monitoring uptime.
          </p>
        </div>
      </div>
    );
  }

  const supabase = createServerClient();

  // Get uptime checks for this project
  const { data: checks } = await supabase
    .from('uptime_checks')
    .select('*')
    .eq('project_id', project.id)
    .order('created_at', { ascending: false });

  const uptimeChecks = checks || [];

  if (uptimeChecks.length === 0) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white font-outfit">Uptime Monitoring</h1>
          <p className="text-slate-400 mt-1">Track your application availability</p>
        </div>
        <UptimeClient projectId={project.id} hasChecks={false} checks={[]} pings={[]} />
      </div>
    );
  }

  const check = uptimeChecks[0];

  // Fetch pings for last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: pings } = await supabase
    .from('uptime_pings')
    .select('*')
    .eq('check_id', check.id)
    .gte('created_at', thirtyDaysAgo.toISOString())
    .order('created_at', { ascending: false })
    .limit(1000);

  const allPings = pings || [];

  // Current status
  const lastPing = allPings[0];
  const isUp = lastPing ? (lastPing.is_up ?? (lastPing.status === 'up')) : null;

  // Uptime percentage
  const upPings = allPings.filter((p) => p.is_up === true || p.status === 'up').length;
  const uptimePercent = allPings.length > 0 ? ((upPings / allPings.length) * 100).toFixed(2) : '—';

  // Avg response time
  const responseTimes = allPings
    .map((p) => p.response_time_ms)
    .filter((t): t is number => typeof t === 'number' && t > 0);
  const avgResponse = responseTimes.length > 0
    ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
    : 0;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white font-outfit">Uptime Monitoring</h1>
        <p className="text-slate-400 mt-1">Track your application availability</p>
      </div>

      {/* Current Status */}
      <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-xl p-6 mb-6">
        <div className="flex items-center gap-4">
          <div
            className={`w-5 h-5 rounded-full ${
              isUp === true ? 'bg-green-400 shadow-lg shadow-green-400/30' :
              isUp === false ? 'bg-red-400 shadow-lg shadow-red-400/30' :
              'bg-slate-500'
            }`}
          />
          <div>
            <p className="text-xl font-bold text-white">
              {isUp === true ? 'UP' : isUp === false ? 'DOWN' : 'Unknown'}
            </p>
            <p className="text-sm text-slate-400">{check.url}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          label="Uptime (30 days)"
          value={`${uptimePercent}%`}
        />
        <StatCard
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          label="Avg Response Time"
          value={avgResponse > 0 ? `${avgResponse}ms` : '—'}
        />
        <StatCard
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625z" />
            </svg>
          }
          label="Total Pings"
          value={allPings.length}
        />
      </div>

      {/* Client component for chart and history */}
      <UptimeClient
        projectId={project.id}
        hasChecks={true}
        checks={uptimeChecks}
        pings={allPings.map((p) => ({
          id: p.id,
          created_at: p.created_at,
          status_code: p.status_code,
          response_time_ms: p.response_time_ms,
          is_up: p.is_up ?? (p.status === 'up'),
          error: p.error,
        }))}
      />
    </div>
  );
}
