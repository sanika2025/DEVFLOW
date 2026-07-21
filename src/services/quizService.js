import { supabase } from '../utils/supabaseClient';

export const quizService = {
  getQuiz: async (dayId) => {
    try {
      const { data, error } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('day_id', dayId);
      if (error) throw error;
      return { success: true, data, error: null };
    } catch (error) {
      return { success: false, data: null, error: error.message };
    }
  },

  submitQuiz: async (userId, dayId, score) => {
    // Basic implementation: could store scores in another table, or just update user progress
    // Currently schema just has user_progress for days, we could add score to progress or a separate quiz_attempts table.
    // For now we will return success.
    return { success: true, data: { score }, error: null };
  },

  getFlashcards: async (dayId) => {
    try {
      const { data, error } = await supabase
        .from('flashcards')
        .select('*')
        .eq('day_id', dayId);
      if (error) throw error;
      return { success: true, data, error: null };
    } catch (error) {
      return { success: false, data: null, error: error.message };
    }
  }
};
