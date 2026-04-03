'use client';

import { useState } from 'react';

export default function EmptyState() {
  const [copied, setCopied] = useState(false);

  const snippet = `<script src="https://cdn.vibeping.com/sdk.js" data-project="YOUR_PROJECT_ID" defer></script>`;

  function handleCopy() {
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className="text-6xl mb-6">🏓</div>
      <h2 className="text-2xl font-bold text-white mb-2 font-outfit">
        No data yet
      </h2>
      <p className="text-slate-400 text-center max-w-md mb-8">
        Install the VibePing SDK to start tracking pageviews, errors, uptime, and web vitals.
      </p>

      <div className="w-full max-w-xl">
        <p className="text-xs text-slate-500 mb-2 uppercase tracking-wide font-medium">
          Add this to your HTML
        </p>
        <div className="relative bg-[#070B16] border border-white/10 rounded-lg p-4 font-mono text-sm text-cyan-400 overflow-x-auto">
          <code>{snippet}</code>
          <button
            onClick={handleCopy}
            className="absolute top-2 right-2 px-3 py-1 text-xs bg-white/10 hover:bg-white/20 text-white rounded-md transition"
          >
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>
      </div>

      <div className="mt-8 text-center">
        <p className="text-slate-500 text-sm">
          Or install via npm:{' '}
          <code className="text-cyan-400 bg-white/5 px-2 py-0.5 rounded">
            npm i @vibeping/sdk
          </code>
        </p>
      </div>
    </div>
  );
}
