import { supabase } from '../utils/supabaseClient';

export const progressService = {
  getUserProgress: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('user_progress')
        .select(`
          *,
          day:days(estimated_hours)
        `)
        .eq('user_id', userId);
      if (error) throw error;
      return { success: true, data, error: null };
    } catch (error) {
      return { success: false, data: null, error: error.message };
    }
  },

  markDayComplete: async (userId, dayId) => {
    try {
      const { data, error } = await supabase
        .from('user_progress')
        .upsert({
          user_id: userId,
          day_id: dayId,
          status: 'completed',
          completed_at: new Date().toISOString()
        }, { onConflict: 'user_id, day_id' })
        .select()
        .single();
      if (error) throw error;
      return { success: true, data, error: null };
    } catch (error) {
      return { success: false, data: null, error: error.message };
    }
  }
};
