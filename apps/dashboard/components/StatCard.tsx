interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  trend?: { value: string; positive: boolean } | null;
  alert?: boolean;
}

export default function StatCard({ icon, label, value, trend, alert }: StatCardProps) {
  return (
    <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-slate-400">{icon}</span>
        {trend && (
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              trend.positive ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
            }`}
          >
            {trend.positive ? '↑' : '↓'} {trend.value}
          </span>
        )}
      </div>
      <p className="text-sm text-slate-400 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${alert ? 'text-orange-400' : 'text-white'}`}>{value}</p>
    </div>
  );
}
