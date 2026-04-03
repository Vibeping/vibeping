const mockErrors = [
  { id: 1, message: 'TypeError: Cannot read property "map" of undefined', count: 142, lastSeen: '2 min ago', status: 'unresolved' },
  { id: 2, message: 'ReferenceError: process is not defined', count: 87, lastSeen: '15 min ago', status: 'unresolved' },
  { id: 3, message: 'ChunkLoadError: Loading chunk 5 failed', count: 34, lastSeen: '1 hr ago', status: 'investigating' },
  { id: 4, message: 'NetworkError: Failed to fetch /api/user', count: 12, lastSeen: '3 hr ago', status: 'resolved' },
];

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    unresolved: 'bg-red-100 text-red-700',
    investigating: 'bg-amber-100 text-amber-700',
    resolved: 'bg-green-100 text-green-700',
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-slate-100 text-slate-700'}`}>
      {status}
    </span>
  );
}

export default function ErrorsPage() {
  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Error Tracking</h1>
          <p className="text-slate-500 mt-1">Uncaught exceptions and unhandled rejections</p>
        </div>
        <button className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors text-sm font-medium">
          Resolve All
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Error</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Count</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Last Seen</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {mockErrors.map((error) => (
              <tr key={error.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <p className="text-sm font-mono text-slate-900 truncate max-w-md">{error.message}</p>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">{error.count}</td>
                <td className="px-6 py-4 text-sm text-slate-500">{error.lastSeen}</td>
                <td className="px-6 py-4"><StatusBadge status={error.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
