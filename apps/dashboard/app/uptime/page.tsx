const mockMonitors = [
  { id: 1, name: 'Production API', url: 'https://api.example.com', status: 'up', uptime: '99.98%', latency: '142ms', lastCheck: '30s ago' },
  { id: 2, name: 'Marketing Site', url: 'https://example.com', status: 'up', uptime: '99.95%', latency: '89ms', lastCheck: '30s ago' },
  { id: 3, name: 'Staging', url: 'https://staging.example.com', status: 'down', uptime: '97.20%', latency: '—', lastCheck: '30s ago' },
  { id: 4, name: 'Webhook Endpoint', url: 'https://api.example.com/webhooks', status: 'up', uptime: '100%', latency: '203ms', lastCheck: '30s ago' },
];

export default function UptimePage() {
  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Uptime Monitoring</h1>
          <p className="text-slate-500 mt-1">Real-time status of your endpoints</p>
        </div>
        <button className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors text-sm font-medium">
          + Add Monitor
        </button>
      </div>

      <div className="space-y-4">
        {mockMonitors.map((monitor) => (
          <div key={monitor.id} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-3 h-3 rounded-full ${monitor.status === 'up' ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
              <div>
                <h3 className="font-semibold text-slate-900">{monitor.name}</h3>
                <p className="text-sm text-slate-500">{monitor.url}</p>
              </div>
            </div>
            <div className="flex items-center gap-8 text-sm">
              <div>
                <p className="text-slate-500">Uptime</p>
                <p className="font-semibold text-slate-900">{monitor.uptime}</p>
              </div>
              <div>
                <p className="text-slate-500">Latency</p>
                <p className="font-semibold text-slate-900">{monitor.latency}</p>
              </div>
              <div>
                <p className="text-slate-500">Last Check</p>
                <p className="font-semibold text-slate-900">{monitor.lastCheck}</p>
              </div>
              <div className="h-8 w-32 flex items-end gap-px">
                {Array.from({ length: 24 }, (_, i) => (
                  <div
                    key={i}
                    className={`flex-1 rounded-sm ${monitor.status === 'down' && i > 20 ? 'bg-red-400' : 'bg-green-400'}`}
                    style={{ height: `${Math.random() * 60 + 40}%` }}
                  />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
