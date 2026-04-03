'use client';

import { useState, useEffect, useRef } from 'react';
import { createBrowserClient } from '../lib/supabase';
import { useRouter } from 'next/navigation';

interface Project {
  id: string;
  name: string;
  domain: string;
}

export default function TopBar() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const router = useRouter();
  const supabase = createBrowserClient();
  const projectRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || '');
      }

      const { data } = await supabase
        .from('projects')
        .select('id, name, domain')
        .order('created_at', { ascending: false });

      if (data && data.length > 0) {
        setProjects(data);
        setSelectedProject(data[0]);
      }
    }
    load();
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (projectRef.current && !projectRef.current.contains(e.target as Node)) {
        setProjectDropdownOpen(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <header className="h-16 border-b border-white/5 bg-[#0A0F1C]/80 backdrop-blur-xl flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        {/* Project Selector */}
        <div className="relative" ref={projectRef}>
          <button
            onClick={() => setProjectDropdownOpen(!projectDropdownOpen)}
            className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-white transition"
          >
            <span className="w-2 h-2 rounded-full bg-green-400" />
            <span>{selectedProject?.name || 'Select project'}</span>
            <svg
              className="w-4 h-4 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {projectDropdownOpen && (
            <div className="absolute top-full left-0 mt-1 w-64 bg-[#0F1629] border border-white/10 rounded-lg shadow-xl z-50 py-1">
              {projects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => {
                    setSelectedProject(project);
                    setProjectDropdownOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 transition ${
                    selectedProject?.id === project.id ? 'text-cyan-400' : 'text-slate-300'
                  }`}
                >
                  <div className="font-medium">{project.name}</div>
                  <div className="text-xs text-slate-500">{project.domain}</div>
                </button>
              ))}
              <div className="border-t border-white/5 mt-1 pt-1">
                <button
                  onClick={() => {
                    setProjectDropdownOpen(false);
                    router.push('/settings');
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-cyan-400 hover:bg-white/5 transition flex items-center gap-2"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  New Project
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* User Menu */}
      <div className="relative" ref={userRef}>
        <button
          onClick={() => setUserMenuOpen(!userMenuOpen)}
          className="flex items-center gap-2 px-3 py-2 hover:bg-white/5 rounded-lg transition"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-sm font-medium">
            {userEmail.charAt(0).toUpperCase() || '?'}
          </div>
          <span className="text-sm text-slate-300 hidden sm:inline">{userEmail}</span>
        </button>

        {userMenuOpen && (
          <div className="absolute top-full right-0 mt-1 w-56 bg-[#0F1629] border border-white/10 rounded-lg shadow-xl z-50 py-1">
            <div className="px-4 py-3 border-b border-white/5">
              <p className="text-sm text-white font-medium truncate">{userEmail}</p>
            </div>
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-white/5 transition"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
