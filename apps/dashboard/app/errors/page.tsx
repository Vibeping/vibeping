import { createAuthClient } from '../../lib/auth';
import StatCard from '../../components/StatCard';
import ErrorList from './ErrorList';

interface ErrorEvent {
  id: string;
  name: string;
  url: string;
  payload: Record<string, unknown> | null;
  properties: Record<string, unknown> | null;
  session_id: string;
  created_at: string;
  project_id: string;
  type: string;
}

interface GroupedError {
  message: string;
  url: string;
  count: number;
  lastSeen: string;
  occurrences: ErrorEvent[];
}

export default async function ErrorsPage() {
  const supabase = createAuthClient();

  const { data: projects } = await supabase
    .from('projects')
    .select('id, name')
    .order('created_at', { ascending: true })
    .limit(1);

  const project = projects?.[0];

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <div className="text-6xl mb-6">🎉</div>
        <h2 className="text-2xl font-bold text-white mb-2 font-outfit">
          No errors detected!
        </h2>
        <p className="text-slate-400 text-center max-w-md">
          Your app is running clean.
        </p>
      </div>
    );
  }

  // Fetch all error events
  const { data: errors } = await supabase
    .from('events')
    .select('*')
    .eq('project_id', project.id)
    .eq('type', 'error')
    .order('created_at', { ascending: false })
    .limit(500);

  const errorEvents: ErrorEvent[] = (errors || []) as ErrorEvent[];

  // Errors today
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const errorsToday = errorEvents.filter(
    (e) => new Date(e.created_at) >= todayStart
  ).length;

  // Group by message
  const grouped: Record<string, GroupedError> = {};
  errorEvents.forEach((e) => {
    const payload = e.payload as Record<string, unknown> | null;
    const props = e.properties as Record<string, unknown> | null;
    const message =
      (payload?.message as string) ||
      (props?.message as string) ||
      e.name ||
      'Unknown error';
    const url = e.url || (payload?.url as string) || '';

    if (!grouped[message]) {
      grouped[message] = {
        message,
        url,
        count: 0,
        lastSeen: e.created_at,
        occurrences: [],
      };
    }
    grouped[message].count++;
    if (new Date(e.created_at) > new Date(grouped[message].lastSeen)) {
      grouped[message].lastSeen = e.created_at;
    }
    grouped[message].occurrences.push(e);
  });

  const groupedErrors = Object.values(grouped);
  const uniqueErrors = groupedErrors.length;
  const mostFrequent =
    groupedErrors.length > 0
      ? groupedErrors.sort((a, b) => b.count - a.count)[0].message
      : 'None';

  if (errorEvents.length === 0) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white font-outfit">Error Tracking</h1>
          <p className="text-slate-400 mt-1">Monitor and debug application errors</p>
        </div>
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <div className="text-6xl mb-6">🎉</div>
          <h2 className="text-2xl font-bold text-white mb-2 font-outfit">
            No errors detected!
          </h2>
          <p className="text-slate-400 text-center max-w-md">
            Your app is running clean.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white font-outfit">Error Tracking</h1>
        <p className="text-slate-400 mt-1">Monitor and debug application errors</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          }
          label="Errors Today"
          value={errorsToday}
          alert={errorsToday > 0}
        />
        <StatCard
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6z" />
            </svg>
          }
          label="Unique Errors"
          value={uniqueErrors}
        />
        <StatCard
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
          }
          label="Most Frequent"
          value={mostFrequent.length > 30 ? mostFrequent.slice(0, 30) + '…' : mostFrequent}
        />
      </div>

      {/* Error List (client component for interactivity) */}
      <ErrorList errors={groupedErrors} />
    </div>
  );
}
