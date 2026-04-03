import type { Metadata } from 'next';
import { Outfit, DM_Sans } from 'next/font/google';
import './globals.css';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import { getUser } from '../lib/auth';
import { ProjectProvider } from '../lib/ProjectContext';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'VibePing — AI Growth Co-Pilot',
  description: 'Analytics, error tracking, uptime monitoring, and AI insights for vibe-coded apps.',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const isAuthPage = false; // Layout always renders; login page has its own full layout

  return (
    <html lang="en" className={`${outfit.variable} ${dmSans.variable}`}>
      <body className="font-dm-sans bg-[#0A0F1C] text-slate-200 min-h-screen">
        {user ? (
          <ProjectProvider>
            <div className="flex min-h-screen">
              <Sidebar />
              <div className="flex-1 flex flex-col lg:ml-0">
                <TopBar />
                <main className="flex-1 p-6 lg:p-8 overflow-auto">{children}</main>
              </div>
            </div>
          </ProjectProvider>
        ) : (
          // Auth pages render without sidebar/topbar
          <>{children}</>
        )}
      </body>
    </html>
  );
}
