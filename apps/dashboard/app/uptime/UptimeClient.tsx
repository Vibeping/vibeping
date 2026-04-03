'use client';

import { useState } from 'react';
import { timeAgo } from '../../lib/utils';

interface Ping {
  id: string;
  created_at: string;
  status_code: number | null;
  response_time_ms: number | null;
  is_up: boolean;
  error: string | null;
}

interface UptimeCheck {
  id: string;
  url: string;
  interval_seconds: number;
  enabled: boolean;
  [key: string]: unknown;
}

interface Props {
  projectId: string;
  hasChecks: boolean;
  checks: UptimeCheck[];
  pings: Ping[];
}

export default function UptimeClient({ projectId, hasChecks, pings }: Props) {
  const [url, setUrl] = useState('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');

  // Setup form for when no checks exist
  if (!hasChecks) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <div className="text-6xl mb-6">📡</div>
        <h2 className="text-2xl font-bold text-white mb-2 font-outfit">
          Add your app URL to start monitoring uptime
        </h2>
        <p className="text-slate-400 text-center max-w-md mb-8">
          We&apos;ll ping your URL every 60 seconds and track response times and availability.
        </p>

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!url.trim()) return;
            setAdding(true);
            setError('');
            try {
              const res = await fetch('/api/uptime/checks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: url.trim(), project_id: projectId }),
              });
              if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || 'Failed to add check');
              }
              window.location.reload();
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Failed to add check');
            } finally {
              setAdding(false);
            }
          }}
          className="w-full max-w-md"
        >
          <div className="flex gap-2">
            <input
              type="url"
              placeholder="https://your-app.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50"
            />
            <button
              type="submit"
              disabled={adding}
              className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition"
            >
              {adding ? 'Adding…' : 'Monitor'}
            </button>
          </div>
          {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
        </form>
      </div>
    );
  }

  // Response time chart (last 24h)
  const twentyFourAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentPings = pings.filter((p) => new Date(p.created_at) >= twentyFourAgo).reverse(); // oldest first for chart

  const maxResponseTime = Math.max(...recentPings.map((p) => p.response_time_ms || 0), 1);

  // Sample to max ~48 bars for display
  const step = Math.max(1, Math.floor(recentPings.length / 48));
  const chartBars = recentPings.filter((_, i) => i % step === 0);

  return (
    <div className="space-y-6">
      {/* Response Time Chart */}
      {chartBars.length > 0 && (
        <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-xl p-5">
          <h2 className="text-lg font-semibold text-white mb-4 font-outfit">
            Response Time (Last 24h)
          </h2>
          <div className="flex items-end gap-[2px] h-32">
            {chartBars.map((ping, i) => {
              const height = ping.response_time_ms
                ? Math.max(4, (ping.response_time_ms / maxResponseTime) * 100)
                : 4;
              return (
                <div
                  key={i}
                  className="flex-1 min-w-[3px] rounded-t group relative"
                  style={{
                    height: `${height}%`,
                    backgroundColor: ping.is_up
                      ? ping.response_time_ms && ping.response_time_ms > 1000
                        ? '#F97316'
                        : '#06B6D4'
                      : '#EF4444',
                  }}
                  title={`${ping.response_time_ms || 0}ms — ${new Date(ping.created_at).toLocaleTimeString()}`}
                />
              );
            })}
          </div>
          <div className="flex justify-between text-xs text-slate-500 mt-2">
            <span>24h ago</span>
            <span>Now</span>
          </div>
        </div>
      )}

      {/* Recent Pings Table */}
      <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-xl p-5">
        <h2 className="text-lg font-semibold text-white mb-4 font-outfit">Check History</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-xs text-slate-500 uppercase">
                <th className="text-left pb-3">Time</th>
                <th className="text-left pb-3">Status</th>
                <th className="text-right pb-3">Code</th>
                <th className="text-right pb-3">Response</th>
                <th className="text-right pb-3">Error</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {pings.slice(0, 50).map((ping) => (
                <tr key={ping.id}>
                  <td className="py-2.5 text-sm text-slate-300">{timeAgo(ping.created_at)}</td>
                  <td className="py-2.5">
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${
                        ping.is_up ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          ping.is_up ? 'bg-green-400' : 'bg-red-400'
                        }`}
                      />
                      {ping.is_up ? 'UP' : 'DOWN'}
                    </span>
                  </td>
                  <td className="py-2.5 text-sm text-slate-400 text-right">
                    {ping.status_code || '—'}
                  </td>
                  <td className="py-2.5 text-sm text-white text-right font-medium">
                    {ping.response_time_ms ? `${ping.response_time_ms}ms` : '—'}
                  </td>
                  <td className="py-2.5 text-xs text-red-400 text-right truncate max-w-[200px]">
                    {ping.error || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
