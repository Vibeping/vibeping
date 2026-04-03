'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function OnboardingState() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setCreating(true);
    setError('');

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), url: url.trim() || undefined }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to create project');
        return;
      }

      // Refresh the page — server component will now find the project
      // and show EmptyState with the real project ID
      router.refresh();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className="w-full max-w-md">
        {/* Icon */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🏓</div>
          <h1 className="text-3xl font-bold text-white font-outfit mb-2">Welcome to VibePing!</h1>
          <p className="text-slate-400 text-base">
            Create your first project to start tracking pageviews, errors, uptime, and web vitals.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-6 space-y-4">
            {/* Project Name */}
            <div>
              <label
                htmlFor="project-name"
                className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5"
              >
                Project Name <span className="text-red-400">*</span>
              </label>
              <input
                id="project-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Awesome App"
                required
                autoFocus
                className="w-full px-3 py-2.5 text-sm bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all"
              />
            </div>

            {/* Website URL */}
            <div>
              <label
                htmlFor="project-url"
                className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5"
              >
                Website URL <span className="text-slate-600">(optional)</span>
              </label>
              <input
                id="project-url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://myapp.com"
                className="w-full px-3 py-2.5 text-sm bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all"
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="px-4 py-2.5 text-sm rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={creating || !name.trim()}
            className="w-full px-6 py-3 text-sm font-semibold rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/20"
          >
            {creating ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Creating...
              </span>
            ) : (
              'Create Project'
            )}
          </button>
        </form>

        {/* Subtle helper text */}
        <p className="text-center text-xs text-slate-600 mt-6">
          You can add more projects later from Settings.
        </p>
      </div>
    </div>
  );
}
