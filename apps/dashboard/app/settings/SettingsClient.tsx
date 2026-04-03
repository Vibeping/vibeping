'use client';

import { useState, useEffect } from 'react';
import { useProjects, Project } from '../../lib/ProjectContext';

interface SettingsClientProps {
  initialProjects: Project[];
}

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 hover:text-white transition-all"
    >
      {copied ? (
        <>
          <svg
            className="w-3.5 h-3.5 text-green-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Copied!
        </>
      ) : (
        <>
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184"
            />
          </svg>
          {label || 'Copy'}
        </>
      )}
    </button>
  );
}

function ConfirmModal({
  open,
  title,
  message,
  confirmLabel,
  danger,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#111827] border border-white/10 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
        <h3 className="text-lg font-semibold text-white font-outfit">{title}</h3>
        <p className="text-sm text-slate-400 mt-2">{message}</p>
        <div className="flex gap-3 mt-6 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm rounded-lg font-medium transition-all ${
              danger
                ? 'bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30'
                : 'bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/30'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SettingsClient({ initialProjects }: SettingsClientProps) {
  const {
    projects,
    selectedProject,
    setSelectedProject,
    addProject,
    updateProject: updateProjectInContext,
    removeProject,
  } = useProjects();

  const [activeProjectId, setActiveProjectId] = useState<string | null>(
    initialProjects.length > 0 ? initialProjects[0].id : null
  );
  const [showApiKey, setShowApiKey] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [editingUrl, setEditingUrl] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const [urlValue, setUrlValue] = useState('');
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectUrl, setNewProjectUrl] = useState('');
  const [creating, setCreating] = useState(false);
  const [justCreated, setJustCreated] = useState<Project | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    danger?: boolean;
    onConfirm: () => void;
  }>({ open: false, title: '', message: '', confirmLabel: '', onConfirm: () => {} });

  // Sync activeProjectId with context's selectedProject
  useEffect(() => {
    if (selectedProject && activeProjectId !== selectedProject.id) {
      setActiveProjectId(selectedProject.id);
    }
  }, [selectedProject]);

  const activeProject = projects.find((p) => p.id === activeProjectId) || null;

  const handleUpdateProject = async (updates: Record<string, unknown>) => {
    if (!activeProject) return;
    setSaving(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: activeProject.id, ...updates }),
      });
      if (res.ok) {
        const data = await res.json();
        updateProjectInContext(data.project);
      }
    } finally {
      setSaving(false);
      setEditingName(false);
      setEditingUrl(false);
    }
  };

  const handleRegenerateKey = () => {
    setConfirmModal({
      open: true,
      title: 'Regenerate API Key',
      message:
        'This will invalidate the current API key immediately. Any sites using the old key will stop sending data. Are you sure?',
      confirmLabel: 'Regenerate',
      danger: true,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, open: false }));
        await handleUpdateProject({ regenerate_key: true });
        setShowApiKey(true);
      },
    });
  };

  const handleDeleteProject = () => {
    if (!activeProject) return;
    setConfirmModal({
      open: true,
      title: 'Delete Project',
      message: `This will permanently delete "${activeProject.name}" and all associated data. This action cannot be undone.`,
      confirmLabel: 'Delete Project',
      danger: true,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, open: false }));
        const res = await fetch(`/api/projects?id=${activeProject.id}`, { method: 'DELETE' });
        if (res.ok) {
          removeProject(activeProject.id);
          const remaining = projects.filter((p) => p.id !== activeProject.id);
          setActiveProjectId(remaining.length > 0 ? remaining[0].id : null);
        }
      },
    });
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newProjectName, url: newProjectUrl }),
      });
      if (res.ok) {
        const data = await res.json();
        const newProject = { ...data.project, event_count: 0 };
        addProject(newProject);
        setActiveProjectId(newProject.id);
        setSelectedProject(newProject);
        setJustCreated(newProject);
        setNewProjectName('');
        setNewProjectUrl('');
      }
    } finally {
      setCreating(false);
    }
  };

  const maskedKey = activeProject ? activeProject.api_key.slice(0, 6) + '••••••••••••••••••••' : '';

  const scriptTag = activeProject
    ? `<script src="https://cdn.jsdelivr.net/npm/@vibeping/sdk@0.1.0/dist/vibeping.umd.js" data-id="${activeProject.api_key}"></script>`
    : '';

  const npmSnippet = activeProject
    ? `npm install @vibeping/sdk\n\n// Then in your app:\nimport vibeping from '@vibeping/sdk';\nvibeping.init({ id: '${activeProject.api_key}' });`
    : '';

  const justCreatedScriptTag = justCreated
    ? `<script src="https://cdn.jsdelivr.net/npm/@vibeping/sdk@0.1.0/dist/vibeping.umd.js" data-id="${justCreated.api_key}"></script>`
    : '';

  const justCreatedNpmSnippet = justCreated
    ? `npm install @vibeping/sdk\n\n// Then in your app:\nimport vibeping from '@vibeping/sdk';\nvibeping.init({ id: '${justCreated.api_key}' });`
    : '';

  const lovablePrompt = justCreated
    ? `Add this script tag to the <head> of my HTML to enable VibePing analytics:\n\n<script src="https://cdn.jsdelivr.net/npm/@vibeping/sdk@0.1.0/dist/vibeping.umd.js" data-id="${justCreated.api_key}"></script>`
    : '';

  if (justCreated) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-8 text-center">
          {/* Success Icon */}
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-5">
            <svg
              className="w-8 h-8 text-emerald-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-white font-outfit mb-2">
            {justCreated.name} is ready!
          </h1>
          <p className="text-slate-400 mb-8">
            Add the SDK to your app to start tracking. Pick whichever method works for you.
          </p>

          <div className="space-y-6 text-left">
            {/* Prompt for Lovable / Bolt / v0 etc. */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-white flex items-center gap-2">
                  <span className="text-lg">✨</span>
                  Prompt for Lovable / Bolt / v0
                </h3>
                <CopyButton text={lovablePrompt} label="Copy prompt" />
              </div>
              <p className="text-xs text-slate-500 mb-2">
                Paste this into your AI coding tool and it will set everything up for you.
              </p>
              <pre className="px-4 py-3 text-sm bg-black/30 border border-white/10 rounded-lg text-cyan-400 font-mono whitespace-pre-wrap break-words">
                {lovablePrompt}
              </pre>
            </div>

            {/* Script Tag */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-slate-300">Script Tag (easiest)</h3>
                <CopyButton text={justCreatedScriptTag} label="Copy snippet" />
              </div>
              <p className="text-xs text-slate-500 mb-2">
                Add this to the {'<head>'} of your HTML. That&apos;s it — analytics starts
                automatically.
              </p>
              <pre className="px-4 py-3 text-sm bg-black/30 border border-white/10 rounded-lg text-emerald-400 font-mono whitespace-pre-wrap break-all">
                {justCreatedScriptTag}
              </pre>
            </div>

            {/* NPM */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-slate-300">NPM Package</h3>
                <CopyButton text={justCreatedNpmSnippet} label="Copy snippet" />
              </div>
              <p className="text-xs text-slate-500 mb-2">
                For React, Next.js, or any Node.js project.
              </p>
              <pre className="px-4 py-3 text-sm bg-black/30 border border-white/10 rounded-lg text-emerald-400 font-mono whitespace-pre-wrap break-words">
                {justCreatedNpmSnippet}
              </pre>
            </div>
          </div>

          <div className="mt-8 flex gap-3 justify-center">
            <button
              onClick={() => setJustCreated(null)}
              className="px-5 py-2.5 text-sm font-medium rounded-lg bg-gradient-to-r from-cyan-500 to-cyan-400 text-black hover:from-cyan-400 hover:to-cyan-300 transition-all"
            >
              Go to Settings
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-w-0">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white font-outfit">Settings</h1>
        <p className="text-slate-400 mt-1">Manage your projects, API keys, and SDK installation.</p>
      </div>

      {/* Project Switcher — show if multiple projects */}
      {projects.length > 1 && (
        <div className="mb-6">
          <div className="flex gap-2 flex-wrap">
            {projects.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setActiveProjectId(p.id);
                  setEditingName(false);
                  setEditingUrl(false);
                  setShowApiKey(false);
                }}
                className={`px-4 py-2 text-sm rounded-lg border transition-all ${
                  p.id === activeProjectId
                    ? 'bg-cyan-500/20 border-cyan-500/30 text-cyan-400'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {activeProject ? (
        <div className="space-y-6">
          {/* ====== PROJECT SETTINGS ====== */}
          <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white font-outfit mb-5 flex items-center gap-2">
              <svg
                className="w-5 h-5 text-cyan-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              Project Settings
            </h2>

            <div className="space-y-4">
              {/* Project Name */}
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">
                  Project Name
                </label>
                {editingName ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={nameValue}
                      onChange={(e) => setNameValue(e.target.value)}
                      className="flex-1 px-3 py-2 text-sm bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30"
                      autoFocus
                    />
                    <button
                      onClick={() => handleUpdateProject({ name: nameValue })}
                      disabled={saving}
                      className="px-3 py-2 text-sm rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/30 transition-all disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={() => setEditingName(false)}
                      className="px-3 py-2 text-sm rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-white text-sm">{activeProject.name}</span>
                    <button
                      onClick={() => {
                        setNameValue(activeProject.name);
                        setEditingName(true);
                      }}
                      className="text-slate-500 hover:text-cyan-400 transition-colors"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                        />
                      </svg>
                    </button>
                  </div>
                )}
              </div>

              {/* Project URL */}
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">
                  Project URL
                </label>
                {editingUrl ? (
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={urlValue}
                      onChange={(e) => setUrlValue(e.target.value)}
                      placeholder="https://yourapp.com"
                      className="flex-1 px-3 py-2 text-sm bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30"
                      autoFocus
                    />
                    <button
                      onClick={() => handleUpdateProject({ url: urlValue })}
                      disabled={saving}
                      className="px-3 py-2 text-sm rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/30 transition-all disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={() => setEditingUrl(false)}
                      className="px-3 py-2 text-sm rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-white text-sm">{activeProject.url || '(not set)'}</span>
                    <button
                      onClick={() => {
                        setUrlValue(activeProject.url || '');
                        setEditingUrl(true);
                      }}
                      className="text-slate-500 hover:text-cyan-400 transition-colors"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                        />
                      </svg>
                    </button>
                  </div>
                )}
              </div>

              {/* API Key */}
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">
                  API Key
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  <code className="px-3 py-2 text-sm bg-black/30 border border-white/10 rounded-lg text-emerald-400 font-mono">
                    {showApiKey ? activeProject.api_key : maskedKey}
                  </code>
                  <button
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="px-3 py-1.5 text-xs rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition-all"
                  >
                    {showApiKey ? 'Hide' : 'Reveal'}
                  </button>
                  <CopyButton text={activeProject.api_key} />
                  <button
                    onClick={handleRegenerateKey}
                    className="px-3 py-1.5 text-xs rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 hover:bg-orange-500/20 transition-all"
                  >
                    Regenerate
                  </button>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="pt-4 mt-4 border-t border-white/5">
                <button
                  onClick={handleDeleteProject}
                  className="px-4 py-2 text-sm rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all"
                >
                  Delete Project
                </button>
              </div>
            </div>
          </div>

          {/* ====== SDK INSTALLATION ====== */}
          <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-6 min-w-0 overflow-hidden">
            <h2 className="text-lg font-semibold text-white font-outfit mb-5 flex items-center gap-2">
              <svg
                className="w-5 h-5 text-cyan-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5"
                />
              </svg>
              SDK Installation
            </h2>

            {/* Script Tag */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-slate-300">Script Tag (easiest)</h3>
                <CopyButton text={scriptTag} label="Copy snippet" />
              </div>
              <p className="text-xs text-slate-500 mb-2">
                Add this to the {'<head>'} of your HTML. That&apos;s it — analytics starts
                automatically.
              </p>
              <div className="relative min-w-0">
                <pre className="px-4 py-3 text-sm bg-black/30 border border-white/10 rounded-lg text-emerald-400 font-mono overflow-x-auto whitespace-pre-wrap break-all">
                  {scriptTag}
                </pre>
              </div>
            </div>

            {/* NPM */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-slate-300">NPM Package</h3>
                <CopyButton text={npmSnippet} label="Copy snippet" />
              </div>
              <p className="text-xs text-slate-500 mb-2">
                For React, Next.js, or any Node.js project.
              </p>
              <pre className="px-4 py-3 text-sm bg-black/30 border border-white/10 rounded-lg text-emerald-400 font-mono overflow-x-auto whitespace-pre-wrap">
                {npmSnippet}
              </pre>
            </div>
          </div>

          {/* ====== PROJECT LIST ====== */}
          {projects.length > 1 && (
            <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white font-outfit mb-5 flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-cyan-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"
                  />
                </svg>
                All Projects
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-xs text-slate-500 uppercase">
                      <th className="text-left pb-3">Name</th>
                      <th className="text-left pb-3">URL</th>
                      <th className="text-right pb-3">Events</th>
                      <th className="text-right pb-3">Created</th>
                      <th className="text-right pb-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {projects.map((project) => (
                      <tr key={project.id} className="group">
                        <td className="py-3 text-sm text-white font-medium">{project.name}</td>
                        <td className="py-3 text-sm text-slate-400 truncate max-w-[200px]">
                          {project.url || '—'}
                        </td>
                        <td className="py-3 text-sm text-slate-300 text-right">
                          {(project.event_count || 0).toLocaleString()}
                        </td>
                        <td className="py-3 text-sm text-slate-500 text-right">
                          {new Date(project.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 text-right">
                          {project.id !== activeProjectId && (
                            <button
                              onClick={() => {
                                setActiveProjectId(project.id);
                                setEditingName(false);
                                setEditingUrl(false);
                                setShowApiKey(false);
                              }}
                              className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                            >
                              Switch →
                            </button>
                          )}
                          {project.id === activeProjectId && (
                            <span className="text-xs text-cyan-400/60">Active</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ====== NEW PROJECT ====== */}
          <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white font-outfit mb-5 flex items-center gap-2">
              <svg
                className="w-5 h-5 text-cyan-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              New Project
            </h2>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="My Awesome App"
                    required
                    className="w-full px-3 py-2 text-sm bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">
                    Project URL
                  </label>
                  <input
                    type="url"
                    value={newProjectUrl}
                    onChange={(e) => setNewProjectUrl(e.target.value)}
                    placeholder="https://myapp.com"
                    className="w-full px-3 py-2 text-sm bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={creating || !newProjectName.trim()}
                className="px-5 py-2.5 text-sm font-medium rounded-lg bg-gradient-to-r from-cyan-500 to-cyan-400 text-black hover:from-cyan-400 hover:to-cyan-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? 'Creating...' : 'Create Project'}
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* No projects — show create form prominently */
        <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-8 text-center max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-full bg-cyan-500/10 flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-6 h-6 text-cyan-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-white font-outfit mb-2">
            Create Your First Project
          </h2>
          <p className="text-sm text-slate-400 mb-6">Get started by creating a project to track.</p>
          <form onSubmit={handleCreateProject} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">
                Project Name *
              </label>
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="My Awesome App"
                required
                className="w-full px-3 py-2 text-sm bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">
                Project URL
              </label>
              <input
                type="url"
                value={newProjectUrl}
                onChange={(e) => setNewProjectUrl(e.target.value)}
                placeholder="https://myapp.com"
                className="w-full px-3 py-2 text-sm bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30"
              />
            </div>
            <button
              type="submit"
              disabled={creating || !newProjectName.trim()}
              className="w-full px-5 py-2.5 text-sm font-medium rounded-lg bg-gradient-to-r from-cyan-500 to-cyan-400 text-black hover:from-cyan-400 hover:to-cyan-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creating ? 'Creating...' : 'Create Project'}
            </button>
          </form>
        </div>
      )}

      <ConfirmModal
        open={confirmModal.open}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmLabel={confirmModal.confirmLabel}
        danger={confirmModal.danger}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, open: false }))}
      />
    </div>
  );
}
