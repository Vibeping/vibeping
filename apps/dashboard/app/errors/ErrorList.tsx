'use client';

import { useState } from 'react';
import { timeAgo } from '../../lib/utils';

interface ErrorEvent {
  id: string;
  name: string;
  url: string;
  payload: Record<string, unknown> | null;
  properties: Record<string, unknown> | null;
  session_id: string;
  created_at: string;
}

interface GroupedError {
  message: string;
  url: string;
  count: number;
  lastSeen: string;
  occurrences: ErrorEvent[];
}

type SortMode = 'recent' | 'frequent';

export default function ErrorList({ errors }: { errors: GroupedError[] }) {
  const [sortBy, setSortBy] = useState<SortMode>('recent');
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const sorted = [...errors].sort((a, b) => {
    if (sortBy === 'frequent') return b.count - a.count;
    return new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime();
  });

  return (
    <div>
      {/* Sort controls */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm text-slate-400">Sort by:</span>
        <button
          onClick={() => setSortBy('recent')}
          className={`px-3 py-1 text-xs rounded-full transition ${
            sortBy === 'recent'
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
              : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10'
          }`}
        >
          Most Recent
        </button>
        <button
          onClick={() => setSortBy('frequent')}
          className={`px-3 py-1 text-xs rounded-full transition ${
            sortBy === 'frequent'
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
              : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10'
          }`}
        >
          Most Frequent
        </button>
      </div>

      {/* Error cards */}
      <div className="space-y-3">
        {sorted.map((err, idx) => {
          const isExpanded = expandedIdx === idx;
          const latestOccurrence = err.occurrences[0];
          const payload = latestOccurrence?.payload as Record<string, unknown> | null;
          const props = latestOccurrence?.properties as Record<string, unknown> | null;
          const stack = (payload?.stack as string) || (props?.stack as string) || '';
          const browser = (payload?.browser as string) || (props?.browser as string) || (props?.userAgent as string) || '';
          const os = (payload?.os as string) || (props?.os as string) || '';
          const pageUrl = latestOccurrence?.url || (payload?.url as string) || '';

          return (
            <div key={idx} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
              {/* Red severity bar */}
              <div className="h-1 bg-red-500" />

              <button
                onClick={() => setExpandedIdx(isExpanded ? null : idx)}
                className="w-full text-left p-4 hover:bg-white/5 transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-red-400 truncate">
                      {err.message}
                    </p>
                    {err.url && (
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {err.url}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-400 shrink-0">
                    <span className="bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full font-medium">
                      {err.count}×
                    </span>
                    <span>{timeAgo(err.lastSeen)}</span>
                    <svg
                      className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </div>
                </div>
              </button>

              {/* Expanded details */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-white/5">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 mb-4">
                    {pageUrl && (
                      <div>
                        <p className="text-xs text-slate-500 mb-0.5">Page URL</p>
                        <p className="text-xs text-slate-300 truncate">{pageUrl}</p>
                      </div>
                    )}
                    {browser && (
                      <div>
                        <p className="text-xs text-slate-500 mb-0.5">Browser / UA</p>
                        <p className="text-xs text-slate-300 truncate">{browser}</p>
                      </div>
                    )}
                    {os && (
                      <div>
                        <p className="text-xs text-slate-500 mb-0.5">OS</p>
                        <p className="text-xs text-slate-300">{os}</p>
                      </div>
                    )}
                  </div>

                  {stack && (
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Stack Trace</p>
                      <pre className="bg-[#070B16] border border-white/10 rounded-lg p-3 text-xs text-red-300 overflow-x-auto max-h-48 overflow-y-auto whitespace-pre-wrap">
                        {stack}
                      </pre>
                    </div>
                  )}

                  {/* Recent occurrences */}
                  <div className="mt-4">
                    <p className="text-xs text-slate-500 mb-2">
                      Recent Occurrences ({Math.min(err.occurrences.length, 5)} of {err.occurrences.length})
                    </p>
                    <div className="space-y-1">
                      {err.occurrences.slice(0, 5).map((occ) => (
                        <div
                          key={occ.id}
                          className="flex items-center justify-between text-xs bg-white/5 rounded px-3 py-1.5"
                        >
                          <span className="text-slate-400 truncate">{occ.url || '—'}</span>
                          <span className="text-slate-500 shrink-0 ml-2">{timeAgo(occ.created_at)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
