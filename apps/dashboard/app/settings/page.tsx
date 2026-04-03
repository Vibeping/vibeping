import { createAuthClient } from '../../lib/auth';
import { redirect } from 'next/navigation';
import SettingsClient from './SettingsClient';

export default async function SettingsPage() {
  const supabase = createAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch all projects for this user
  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, url, api_key, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });

  // Get event counts for each project
  const projectsWithCounts = await Promise.all(
    (projects || []).map(async (project) => {
      const { count } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', project.id);
      return { ...project, event_count: count || 0 };
    })
  );

  return <SettingsClient initialProjects={projectsWithCounts} />;
}
