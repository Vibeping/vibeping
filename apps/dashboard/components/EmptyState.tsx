'use client';

import { useState } from 'react';

interface EmptyStateProps {
  projectId?: string;
}

export default function EmptyState({ projectId }: EmptyStateProps) {
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const dataId = projectId || 'YOUR_PROJECT_ID';
  const snippet = `<script src="https://cdn.jsdelivr.net/npm/@vibeping/sdk@0.1.0/dist/vibeping.umd.js" data-id="${dataId}" defer></script>`;
  const prompt = `Add this script tag to the <head> of my HTML to enable VibePing analytics:\n\n${snippet}`;

  function handleCopySnippet() {
    navigator.clipboard.writeText(snippet);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  }

  function handleCopyPrompt() {
    navigator.clipboard.writeText(prompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  }

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className="text-6xl mb-6">🏓</div>
      <h2 className="text-2xl font-bold text-white mb-2 font-outfit">No data yet</h2>
      <p className="text-slate-400 text-center max-w-md mb-8">
        Install the VibePing SDK to start tracking pageviews, errors, uptime, and web vitals.
      </p>

      <div className="w-full max-w-xl space-y-5">
        {/* Prompt for AI tools */}
        <div>
          <p className="text-xs text-slate-500 mb-2 uppercase tracking-wide font-medium flex items-center gap-1.5">
            <span className="text-sm">✨</span> Prompt for Lovable / Bolt / v0
          </p>
          <div className="relative bg-[#070B16] border border-white/10 rounded-lg p-4 font-mono text-sm text-cyan-400 whitespace-pre-wrap break-words">
            <code>{prompt}</code>
            <button
              onClick={handleCopyPrompt}
              className="absolute top-2 right-2 px-3 py-1 text-xs bg-white/10 hover:bg-white/20 text-white rounded-md transition"
            >
              {copiedPrompt ? '✓ Copied' : 'Copy prompt'}
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-1.5">
            Paste this into your AI coding tool and it will set everything up.
          </p>
        </div>

        {/* Script tag */}
        <div>
          <p className="text-xs text-slate-500 mb-2 uppercase tracking-wide font-medium">
            Or add this to your HTML
          </p>
          <div className="relative bg-[#070B16] border border-white/10 rounded-lg p-4 font-mono text-sm text-cyan-400 whitespace-pre-wrap break-all">
            <code>{snippet}</code>
            <button
              onClick={handleCopySnippet}
              className="absolute top-2 right-2 px-3 py-1 text-xs bg-white/10 hover:bg-white/20 text-white rounded-md transition"
            >
              {copiedSnippet ? '✓ Copied' : 'Copy'}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center">
        <p className="text-slate-500 text-sm">
          Or install via npm:{' '}
          <code className="text-cyan-400 bg-white/5 px-2 py-0.5 rounded">npm i @vibeping/sdk</code>
        </p>
      </div>
    </div>
  );
}
