import { supabase } from '../utils/supabaseClient';

export const progressService = {
  getUserProgress: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('lesson_progress')
        .select('*')
        .eq('user_id', userId);
      
      if (error) throw error;

      // Map to match LearningHub expectations
      const mappedData = data.map(p => ({
        day: { id: p.lesson_id },
        status: p.completion_percentage >= 100 ? 'completed' : 'in-progress'
      }));

      return { success: true, data: mappedData, error: null };
    } catch (error) {
      console.error('Progress Error:', error);
      return { success: false, data: null, error: error.message };
    }
  },

  markDayComplete: async (userId, dayId) => {
    try {
      const { data, error } = await supabase
        .from('lesson_progress')
        .upsert({
          user_id: userId,
          lesson_id: dayId,
          completion_percentage: 100,
          completed_at: new Date().toISOString()
        }, { onConflict: 'user_id, lesson_id' })
        .select()
        .single();
      if (error) throw error;
      return { success: true, data, error: null };
    } catch (error) {
      return { success: false, data: null, error: error.message };
    }
  },

  markDayCompleteByNumber: async (userId, dayNumber) => {
    try {
      const { data: dayNode, error: dayError } = await supabase
        .from('curriculum_nodes')
        .select('id')
        .eq('node_type', 'day')
        .eq('order_index', parseInt(dayNumber))
        .limit(1)
        .single();
        
      if (dayError || !dayNode) throw new Error('Day not found');
      
      const { data, error } = await supabase
        .from('lesson_progress')
        .upsert({
          user_id: userId,
          lesson_id: dayNode.id,
          completion_percentage: 100,
          completed_at: new Date().toISOString()
        }, { onConflict: 'user_id, lesson_id' })
        .select()
        .single();
      if (error) throw error;
      return { success: true, data, error: null };
    } catch (error) {
      console.error(error);
      return { success: false, data: null, error: error.message };
    }
  }
};
