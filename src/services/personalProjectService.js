import { supabase } from '../utils/supabaseClient';

export const personalProjectService = {
  // Projects
  getProjects: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('personal_projects')
        .select(`
          *,
          milestones:personal_project_milestones(*),
          activities:personal_project_activities(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return { success: true, data, error: null };
    } catch (error) {
      return { success: false, data: null, error: error.message };
    }
  },

  addProject: async (userId, projectData) => {
    try {
      const { data, error } = await supabase
        .from('personal_projects')
        .insert({
          user_id: userId,
          title: projectData.title,
          description: projectData.description,
          category: projectData.category || 'Development',
          status: projectData.status || 'Active',
          health: projectData.health || 'On Track',
          deadline: projectData.deadline || null,
          tech_stack: projectData.tech_stack || [],
          repo_url: projectData.repo_url || null,
          doc_url: projectData.doc_url || null,
          progress: projectData.progress || 0
        })
        .select()
        .single();
      
      if (error) throw error;

      // Log creation
      await personalProjectService.logActivity(data.id, 'Project created', 'Project workspace initialized');

      return { success: true, data, error: null };
    } catch (error) {
      return { success: false, data: null, error: error.message };
    }
  },

  updateProject: async (projectId, updates) => {
    try {
      const { data, error } = await supabase
        .from('personal_projects')
        .update(updates)
        .eq('id', projectId)
        .select()
        .single();
      
      if (error) throw error;
      return { success: true, data, error: null };
    } catch (error) {
      return { success: false, data: null, error: error.message };
    }
  },

  deleteProject: async (projectId) => {
    try {
      const { error } = await supabase
        .from('personal_projects')
        .delete()
        .eq('id', projectId);
      
      if (error) throw error;
      return { success: true, data: null, error: null };
    } catch (error) {
      return { success: false, data: null, error: error.message };
    }
  },

  // Milestones
  addMilestone: async (projectId, title, dueDate = null) => {
    try {
      const { data, error } = await supabase
        .from('personal_project_milestones')
        .insert({
          project_id: projectId,
          title: title,
          status: 'Not Started',
          due_date: dueDate
        })
        .select()
        .single();
      
      if (error) throw error;
      
      await personalProjectService.logActivity(projectId, 'Milestone added', `Added milestone: ${title}`);
      
      return { success: true, data, error: null };
    } catch (error) {
      return { success: false, data: null, error: error.message };
    }
  },

  updateMilestone: async (milestoneId, updates, projectId, title) => {
    try {
      const { data, error } = await supabase
        .from('personal_project_milestones')
        .update(updates)
        .eq('id', milestoneId)
        .select()
        .single();
      
      if (error) throw error;

      if (updates.status === 'Completed' && projectId) {
        await personalProjectService.logActivity(projectId, 'Milestone completed', `Completed milestone: ${title}`);
      }
      
      return { success: true, data, error: null };
    } catch (error) {
      return { success: false, data: null, error: error.message };
    }
  },
  
  deleteMilestone: async (milestoneId) => {
    try {
      const { error } = await supabase
        .from('personal_project_milestones')
        .delete()
        .eq('id', milestoneId);
      if (error) throw error;
      return { success: true, data: null, error: null };
    } catch (error) {
      return { success: false, data: null, error: error.message };
    }
  },

  // Activities
  logActivity: async (projectId, activityType, description) => {
    try {
      const { data, error } = await supabase
        .from('personal_project_activities')
        .insert({
          project_id: projectId,
          activity_type: activityType,
          description: description
        })
        .select()
        .single();
      
      if (error) throw error;
      return { success: true, data, error: null };
    } catch (error) {
      return { success: false, data: null, error: error.message };
    }
  }
};
