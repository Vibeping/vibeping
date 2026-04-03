import { redirect } from 'next/navigation';
import { getUser, createAuthClient } from '../../lib/auth';
import SettingsClient from './SettingsClient';

export const metadata = {
  title: 'Settings | VibePing',
  description: 'Manage your projects, API keys, and SDK installation.',
};

export default async function SettingsPage() {
  const user = await getUser();

  if (!user) {
    redirect('/login');
  }

  const supabase = createAuthClient();

  // Fetch all projects for the user
  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, url, api_key, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });

  // Get event counts per project
  const projectsWithCounts = await Promise.all(
    (projects || []).map(async (project) => {
      const { count } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', project.id);

      return {
        ...project,
        event_count: count || 0,
      };
    })
  );

  return <SettingsClient initialProjects={projectsWithCounts} />;
}
