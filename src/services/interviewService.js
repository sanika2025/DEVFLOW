import { supabase } from '../utils/supabaseClient';

export const interviewService = {
  getQuestions: async (categoryId = null) => {
    try {
      let query = supabase.from('interview_questions').select('*');
      if (categoryId && categoryId !== 'All') {
        query = query.eq('category', categoryId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return { success: true, data, error: null };
    } catch (error) {
      return { success: false, data: null, error: error.message };
    }
  },

  getDayQuestions: async (dayId) => {
    try {
      const { data, error } = await supabase
        .from('interview_questions')
        .select('*')
        .eq('day_id', dayId);
      if (error) throw error;
      return { success: true, data, error: null };
    } catch (error) {
      return { success: false, data: null, error: error.message };
    }
  },

  saveBookmark: async (userId, questionId) => {
    try {
      const { data, error } = await supabase
        .from('bookmarks')
        .insert({ user_id: userId, item_type: 'interview_question', item_id: questionId })
        .select()
        .single();
      if (error) throw error;
      return { success: true, data, error: null };
    } catch (error) {
      return { success: false, data: null, error: error.message };
    }
  },

  removeBookmark: async (userId, questionId) => {
    try {
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .match({ user_id: userId, item_type: 'interview_question', item_id: questionId });
      if (error) throw error;
      return { success: true, data: null, error: null };
    } catch (error) {
      return { success: false, data: null, error: error.message };
    }
  },

  getBookmarks: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('bookmarks')
        .select('*')
        .eq('user_id', userId)
        .eq('item_type', 'interview_question');
      if (error) throw error;
      return { success: true, data, error: null };
    } catch (error) {
      return { success: false, data: null, error: error.message };
    }
  }
};
