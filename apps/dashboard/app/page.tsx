function StatCard({ title, value, change, icon }: { title: string; value: string; change: string; icon: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <span className="text-2xl">{icon}</span>
        <span className="text-sm text-green-600 font-medium">{change}</span>
      </div>
      <h3 className="text-sm font-medium text-slate-500">{title}</h3>
      <p className="text-3xl font-bold text-slate-900 mt-1">{value}</p>
    </div>
  );
}

export default function OverviewPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Overview</h1>
        <p className="text-slate-500 mt-1">Your app&apos;s health at a glance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Pageviews (24h)" value="12,847" change="+14.2%" icon="👀" />
        <StatCard title="Unique Visitors" value="3,241" change="+8.1%" icon="👤" />
        <StatCard title="Error Rate" value="0.12%" change="-23%" icon="🐛" />
        <StatCard title="Avg LCP" value="1.8s" change="-5.3%" icon="⚡" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Traffic Overview</h2>
          <div className="h-64 flex items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-lg">
            📈 Chart placeholder — connect to real data
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">AI Insights</h2>
          <div className="space-y-3">
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
              <p className="text-sm text-blue-800">💡 Your LCP improved 12% after the last deploy. Keep optimizing images for even better results.</p>
            </div>
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
              <p className="text-sm text-amber-800">⚠️ Error rate spiked 3x on /checkout between 2-4pm. Likely related to payment API timeout.</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg border border-green-100">
              <p className="text-sm text-green-800">✅ Uptime has been 99.98% for the last 30 days. No action needed.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
