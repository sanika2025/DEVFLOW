import { supabase } from '../utils/supabaseClient';

export const careerService = {
  getProfile: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('career_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      if (error && error.code !== 'PGRST116') throw error; // ignore no rows error
      return { success: true, data, error: null };
    } catch (error) {
      return { success: false, data: null, error: error.message };
    }
  },

  upsertProfile: async (userId, profileData) => {
    try {
      const { data, error } = await supabase
        .from('career_profiles')
        .upsert({ 
          user_id: userId, 
          current_job_title: profileData.current_job_title, 
          target_job_title: profileData.target_job_title,
          years_experience: profileData.years_experience
        }, { onConflict: 'user_id' })
        .select()
        .single();
      if (error) throw error;
      return { success: true, data, error: null };
    } catch (error) {
      return { success: false, data: null, error: error.message };
    }
  }
};
