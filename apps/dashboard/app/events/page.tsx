const mockEvents = [
  { name: 'button_click', count: 4521, lastTriggered: '1 min ago' },
  { name: 'signup_complete', count: 342, lastTriggered: '5 min ago' },
  { name: 'purchase', count: 128, lastTriggered: '12 min ago' },
  { name: 'search', count: 2103, lastTriggered: '30s ago' },
  { name: 'page_scroll_50', count: 8934, lastTriggered: '10s ago' },
  { name: 'form_submit', count: 671, lastTriggered: '3 min ago' },
];

export default function EventsPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Custom Events</h1>
        <p className="text-slate-500 mt-1">Track any user interaction with <code className="bg-slate-100 px-1.5 py-0.5 rounded text-sm font-mono">vibeping.track()</code></p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <p className="text-sm text-slate-500">Total Events (24h)</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">16,699</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <p className="text-sm text-slate-500">Unique Event Types</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">6</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <p className="text-sm text-slate-500">Events / Min</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">11.6</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Event Name</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Count (24h)</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Last Triggered</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Trend</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {mockEvents.map((event) => (
              <tr key={event.name} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <code className="text-sm font-mono bg-slate-100 px-2 py-1 rounded">{event.name}</code>
                </td>
                <td className="px-6 py-4 text-sm font-semibold text-slate-900">{event.count.toLocaleString()}</td>
                <td className="px-6 py-4 text-sm text-slate-500">{event.lastTriggered}</td>
                <td className="px-6 py-4">
                  <div className="h-6 w-20 flex items-end gap-px">
                    {Array.from({ length: 12 }, (_, i) => (
                      <div key={i} className="flex-1 bg-brand-500 rounded-sm" style={{ height: `${Math.random() * 80 + 20}%` }} />
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
