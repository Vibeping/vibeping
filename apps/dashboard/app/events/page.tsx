import { createAuthClient } from '../../lib/auth';
import StatCard from '../../components/StatCard';
import EventList from './EventList';

interface CustomEvent {
  id: string;
  name: string;
  url: string;
  properties: Record<string, unknown> | null;
  payload: Record<string, unknown> | null;
  session_id: string;
  created_at: string;
}

interface GroupedEvent {
  name: string;
  count: number;
  lastTriggered: string;
  occurrences: CustomEvent[];
}

export default async function EventsPage() {
  const supabase = createAuthClient();

  const { data: projects } = await supabase
    .from('projects')
    .select('id, name')
    .order('created_at', { ascending: true })
    .limit(1);

  const project = projects?.[0];

  if (!project) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white font-outfit">Custom Events</h1>
          <p className="text-slate-400 mt-1">Track custom events in your application</p>
        </div>
        <EventEmptyState />
      </div>
    );
  }

  // Fetch custom events
  const { data: events } = await supabase
    .from('events')
    .select('*')
    .eq('project_id', project.id)
    .eq('type', 'custom')
    .order('created_at', { ascending: false })
    .limit(1000);

  const allEvents: CustomEvent[] = (events || []) as CustomEvent[];

  if (allEvents.length === 0) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white font-outfit">Custom Events</h1>
          <p className="text-slate-400 mt-1">Track custom events in your application</p>
        </div>
        <EventEmptyState />
      </div>
    );
  }

  // Group by name
  const grouped: Record<string, GroupedEvent> = {};
  allEvents.forEach((e) => {
    const name = e.name || 'unnamed';
    if (!grouped[name]) {
      grouped[name] = {
        name,
        count: 0,
        lastTriggered: e.created_at,
        occurrences: [],
      };
    }
    grouped[name].count++;
    if (new Date(e.created_at) > new Date(grouped[name].lastTriggered)) {
      grouped[name].lastTriggered = e.created_at;
    }
    grouped[name].occurrences.push(e);
  });

  const groupedEvents = Object.values(grouped).sort((a, b) => b.count - a.count);
  const uniqueNames = groupedEvents.length;
  const mostTriggered = groupedEvents[0]?.name || 'None';
  const totalCount = allEvents.length;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white font-outfit">Custom Events</h1>
        <p className="text-slate-400 mt-1">Track custom events in your application</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
          }
          label="Total Events"
          value={totalCount.toLocaleString()}
        />
        <StatCard
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
            </svg>
          }
          label="Unique Event Names"
          value={uniqueNames}
        />
        <StatCard
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
            </svg>
          }
          label="Most Triggered"
          value={mostTriggered.length > 25 ? mostTriggered.slice(0, 25) + '…' : mostTriggered}
        />
      </div>

      {/* Event list (client for expand/collapse) */}
      <EventList events={groupedEvents} />
    </div>
  );
}

function EventEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className="text-6xl mb-6">📊</div>
      <h2 className="text-2xl font-bold text-white mb-2 font-outfit">
        No custom events yet
      </h2>
      <p className="text-slate-400 text-center max-w-md mb-8">
        Use <code className="text-cyan-400 bg-white/5 px-1.5 py-0.5 rounded">vibeping.track()</code> to start tracking custom events in your app.
      </p>

      <div className="w-full max-w-lg">
        <p className="text-xs text-slate-500 mb-2 uppercase tracking-wide font-medium">
          Example Usage
        </p>
        <div className="bg-[#070B16] border border-white/10 rounded-lg p-4 font-mono text-sm overflow-x-auto">
          <div className="text-slate-500">{'// Track a custom event'}</div>
          <div>
            <span className="text-cyan-400">vibeping</span>
            <span className="text-white">.</span>
            <span className="text-orange-400">track</span>
            <span className="text-white">(</span>
            <span className="text-green-400">&apos;button_click&apos;</span>
            <span className="text-white">, {'{'}</span>
          </div>
          <div className="ml-4">
            <span className="text-slate-300">button</span>
            <span className="text-white">: </span>
            <span className="text-green-400">&apos;signup&apos;</span>
            <span className="text-white">,</span>
          </div>
          <div className="ml-4">
            <span className="text-slate-300">page</span>
            <span className="text-white">: </span>
            <span className="text-green-400">&apos;/pricing&apos;</span>
          </div>
          <div>
            <span className="text-white">{'}'})</span>
          </div>
        </div>
      </div>
    </div>
  );
}
