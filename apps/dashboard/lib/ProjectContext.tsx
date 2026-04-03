'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export interface Project {
  id: string;
  name: string;
  url: string | null;
  domain?: string;
  api_key: string;
  created_at: string;
  event_count?: number;
}

interface ProjectContextType {
  projects: Project[];
  selectedProject: Project | null;
  setSelectedProject: (project: Project | null) => void;
  addProject: (project: Project) => void;
  updateProject: (project: Project) => void;
  removeProject: (projectId: string) => void;
  refreshProjects: () => Promise<void>;
  loading: boolean;
}

const ProjectContext = createContext<ProjectContextType | null>(null);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProjects = useCallback(async () => {
    try {
      const res = await fetch('/api/projects');
      if (res.ok) {
        const data = await res.json();
        const fetched: Project[] = data.projects || [];
        setProjects(fetched);

        // Auto-select first project if nothing selected or selected was removed
        setSelectedProject((prev) => {
          if (prev && fetched.some((p) => p.id === prev.id)) {
            // Update the selected project data in case it changed
            return fetched.find((p) => p.id === prev.id) || prev;
          }
          return fetched.length > 0 ? fetched[0] : null;
        });
      }
    } catch (err) {
      console.error('[VibePing] Failed to fetch projects:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshProjects();
  }, [refreshProjects]);

  const addProject = useCallback((project: Project) => {
    setProjects((prev) => [...prev, project]);
    // Auto-select the new project if it's the first one
    setSelectedProject((prev) => prev || project);
  }, []);

  const updateProject = useCallback((updated: Project) => {
    setProjects((prev) => prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)));
    setSelectedProject((prev) => (prev?.id === updated.id ? { ...prev, ...updated } : prev));
  }, []);

  const removeProject = useCallback((projectId: string) => {
    setProjects((prev) => {
      const remaining = prev.filter((p) => p.id !== projectId);
      setSelectedProject((sel) => {
        if (sel?.id === projectId) {
          return remaining.length > 0 ? remaining[0] : null;
        }
        return sel;
      });
      return remaining;
    });
  }, []);

  return (
    <ProjectContext.Provider
      value={{
        projects,
        selectedProject,
        setSelectedProject,
        addProject,
        updateProject,
        removeProject,
        refreshProjects,
        loading,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProjects() {
  const ctx = useContext(ProjectContext);
  if (!ctx) {
    throw new Error('useProjects must be used within a ProjectProvider');
  }
  return ctx;
}
