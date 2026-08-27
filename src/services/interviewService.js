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
  },

  // Progress Tracking
  getProgress: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('interview_progress')
        .select('*')
        .eq('user_id', userId);
      // Ignores if table missing
      if (error && error.code !== '42P01') throw error;
      return { success: true, data: data || [], error: null };
    } catch (error) {
      return { success: false, data: null, error: error.message };
    }
  },

  updateProgress: async (userId, questionId, status, score = null) => {
    try {
      const { data, error } = await supabase
        .from('interview_progress')
        .upsert({
          user_id: userId,
          question_id: questionId,
          status: status,
          last_score: score,
          last_practiced_at: new Date().toISOString()
        }, { onConflict: 'user_id, question_id' })
        .select()
        .single();
      if (error) throw error;
      return { success: true, data, error: null };
    } catch (error) {
      return { success: false, data: null, error: error.message };
    }
  },

  // Mock Interviews
  getMockInterviews: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('mock_interviews')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error && error.code !== '42P01') throw error;
      return { success: true, data: data || [], error: null };
    } catch (error) {
      return { success: false, data: null, error: error.message };
    }
  },

  saveMockInterview: async (userId, mockData) => {
    try {
      const { data, error } = await supabase
        .from('mock_interviews')
        .insert({
          user_id: userId,
          role: mockData.role,
          topics: mockData.topics || [],
          duration_minutes: mockData.duration_minutes,
          questions_answered: mockData.questions_answered,
          score_overall: mockData.score_overall,
          score_technical: mockData.score_technical,
          score_communication: mockData.score_communication,
          feedback_summary: mockData.feedback_summary
        })
        .select()
        .single();
      if (error) throw error;
      return { success: true, data, error: null };
    } catch (error) {
      return { success: false, data: null, error: error.message };
    }
  },

  // Stats
  getStats: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('user_interview_stats')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      if (error && error.code !== '42P01' && error.code !== 'PGRST116') throw error;
      return { success: true, data: data || { current_streak: 0, overall_readiness: 0 }, error: null };
    } catch (error) {
      return { success: false, data: null, error: error.message };
    }
  },
  
  updateStats: async (userId, updates) => {
    try {
      const { data, error } = await supabase
        .from('user_interview_stats')
        .upsert({ user_id: userId, ...updates }, { onConflict: 'user_id' })
        .select()
        .single();
      if (error) throw error;
      return { success: true, data, error: null };
    } catch (error) {
      return { success: false, data: null, error: error.message };
    }
  }
};
