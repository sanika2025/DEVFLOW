import { supabase } from '../utils/supabaseClient';

export const projectService = {
  getProjects: async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          milestones:project_milestones(
            *,
            tasks:project_tasks(*)
          ),
          submissions:project_submissions(*)
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return { success: true, data, error: null };
    } catch (error) {
      return { success: false, data: null, error: error.message };
    }
  },

  getProjectDetails: async (projectId) => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          milestones:project_milestones(
            *,
            tasks:project_tasks(*)
          )
        `)
        .eq('id', projectId)
        .single();
      if (error) throw error;
      return { success: true, data, error: null };
    } catch (error) {
      return { success: false, data: null, error: error.message };
    }
  }
};
