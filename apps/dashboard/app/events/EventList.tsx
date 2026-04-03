'use client';

import { useState } from 'react';
import { timeAgo } from '../../lib/utils';

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

export default function EventList({ events }: { events: GroupedEvent[] }) {
  const [expandedName, setExpandedName] = useState<string | null>(null);

  return (
    <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-xl overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="text-xs text-slate-500 uppercase border-b border-white/5">
            <th className="text-left p-4 pb-3">Event Name</th>
            <th className="text-right p-4 pb-3">Count</th>
            <th className="text-right p-4 pb-3 hidden sm:table-cell">Last Triggered</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {events.map((evt) => {
            const isExpanded = expandedName === evt.name;
            return (
              <tr key={evt.name} className="group">
                <td colSpan={3} className="p-0">
                  {/* Row */}
                  <button
                    onClick={() => setExpandedName(isExpanded ? null : evt.name)}
                    className="w-full text-left flex items-center justify-between p-4 hover:bg-white/5 transition"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0" />
                      <span className="text-sm font-medium text-white">{evt.name}</span>
                    </div>
                    <div className="flex items-center gap-6">
                      <span className="text-sm text-white font-medium">{evt.count}</span>
                      <span className="text-xs text-slate-400 hidden sm:inline">
                        {timeAgo(evt.lastTriggered)}
                      </span>
                      <svg
                        className={`w-4 h-4 text-slate-400 transition-transform ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                        />
                      </svg>
                    </div>
                  </button>

                  {/* Expanded occurrences */}
                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-2">
                      <p className="text-xs text-slate-500 mb-2">
                        Recent occurrences ({Math.min(evt.occurrences.length, 20)} of{' '}
                        {evt.occurrences.length})
                      </p>
                      {evt.occurrences.slice(0, 20).map((occ) => {
                        const props = {
                          ...(occ.properties || {}),
                          ...(occ.payload && typeof occ.payload === 'object' ? occ.payload : {}),
                        };
                        const entries = Object.entries(props).filter(
                          ([k]) => !['type', 'name'].includes(k)
                        );

                        return (
                          <div
                            key={occ.id}
                            className="bg-white/5 border border-white/5 rounded-lg p-3"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs text-slate-400">
                                {timeAgo(occ.created_at)}
                              </span>
                              {occ.url && (
                                <span className="text-xs text-slate-500 truncate max-w-[200px]">
                                  {occ.url}
                                </span>
                              )}
                            </div>
                            {entries.length > 0 ? (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                                {entries.map(([key, value]) => (
                                  <div key={key} className="flex gap-2 text-xs">
                                    <span className="text-slate-500 shrink-0">{key}:</span>
                                    <span className="text-slate-300 truncate">
                                      {typeof value === 'object'
                                        ? JSON.stringify(value)
                                        : String(value)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-slate-500 italic">No properties</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
