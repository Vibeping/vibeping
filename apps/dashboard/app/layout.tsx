import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'VibePing — AI Growth Co-Pilot',
  description: 'Analytics, error tracking, uptime monitoring, and AI insights for vibe-coded apps.',
};

function Sidebar() {
  const navItems = [
    { href: '/', label: 'Overview', icon: '📊' },
    { href: '/errors', label: 'Errors', icon: '🐛' },
    { href: '/uptime', label: 'Uptime', icon: '🟢' },
    { href: '/events', label: 'Events', icon: '⚡' },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-white min-h-screen p-6">
      <div className="mb-8">
        <h1 className="text-xl font-bold">🏓 VibePing</h1>
        <p className="text-slate-400 text-sm mt-1">AI Growth Co-Pilot</p>
      </div>
      <nav className="space-y-1">
        {navItems.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </a>
        ))}
      </nav>
    </aside>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 p-8">{children}</main>
      </body>
    </html>
  );
}
