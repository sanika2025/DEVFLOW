import { supabase } from '../utils/supabaseClient';

export const plannerService = {
  // --- Tasks ---
  getTasks: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return { success: true, data, error: null };
    } catch (error) {
      return { success: false, data: null, error: error.message };
    }
  },

  addTask: async (userId, taskData) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          user_id: userId,
          title: taskData.title,
          description: taskData.description,
          status: taskData.status || 'todo',
          priority: taskData.priority || 'medium',
          category: taskData.category || 'Personal',
          due_date: taskData.due_date || null,
          due_time: taskData.due_time || null,
          repeat_rule: taskData.repeat_rule || 'None',
          reminder: taskData.reminder || 'None',
          completed: taskData.status === 'done' || taskData.status === 'completed'
        })
        .select()
        .single();
      if (error) throw error;
      return { success: true, data, error: null };
    } catch (error) {
      return { success: false, data: null, error: error.message };
    }
  },

  updateTaskStatus: async (taskId, status) => {
    try {
      const completed = status === 'done' || status === 'completed';
      const { error } = await supabase
        .from('tasks')
        .update({ 
          status,
          completed,
          completed_at: completed ? new Date().toISOString() : null 
        })
        .eq('id', taskId);
      if (error) throw error;
      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  
  updateTask: async (taskId, updates) => {
    try {
      if (updates.status) {
          updates.completed = updates.status === 'done' || updates.status === 'completed';
          if (updates.completed) updates.completed_at = new Date().toISOString();
      }
      const { error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId);
      if (error) throw error;
      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  deleteTask: async (taskId) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);
      if (error) throw error;
      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // --- Time Blocks ---
  getTimeBlocks: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('time_blocks')
        .select('*')
        .eq('user_id', userId)
        .order('start_time', { ascending: true });
      if (error) throw error;
      return { success: true, data, error: null };
    } catch (error) {
      return { success: false, data: null, error: error.message };
    }
  },

  addTimeBlock: async (userId, blockData) => {
    try {
      const { data, error } = await supabase
        .from('time_blocks')
        .insert({
          user_id: userId,
          title: blockData.title,
          date: blockData.date,
          start_time: blockData.start_time,
          end_time: blockData.end_time,
          category: blockData.category || 'Personal'
        })
        .select()
        .single();
      if (error) throw error;
      return { success: true, data, error: null };
    } catch (error) {
      return { success: false, data: null, error: error.message };
    }
  },

  deleteTimeBlock: async (blockId) => {
    try {
      const { error } = await supabase
        .from('time_blocks')
        .delete()
        .eq('id', blockId);
      if (error) throw error;
      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};
