import { supabase } from '../utils/supabaseClient';

export const lessonService = {
  getDayLessons: async (dayId) => {
    try {
      const { data, error } = await supabase
        .from('curriculum_nodes')
        .select('*')
        .eq('node_type', 'lesson')
        .eq('parent_id', dayId)
        .order('order_index', { ascending: true });
      if (error) throw error;
      return { success: true, data, error: null };
    } catch (error) {
      return { success: false, data: null, error: error.message };
    }
  },

  getLessonDetails: async (lessonId) => {
    try {
      // Fetch the node
      const { data: lesson, error: lessonError } = await supabase
        .from('curriculum_nodes')
        .select('*')
        .eq('id', lessonId)
        .single();
      if (lessonError) throw lessonError;

      // Fetch sections
      const { data: sections, error: sectionsError } = await supabase
        .from('lesson_sections')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('order_index', { ascending: true });
      if (sectionsError) throw sectionsError;

      // Fetch the parent day to get dayNumber
      const { data: dayNode } = await supabase
        .from('curriculum_nodes')
        .select('order_index')
        .eq('id', lesson.parent_id)
        .single();

      return { 
        success: true, 
        data: { ...lesson, sections, dayNumber: dayNode?.order_index || 1 }, 
        error: null 
      };
    } catch (error) {
      return { success: false, data: null, error: error.message };
    }
  },

  getDayCodingChallenges: async (dayId) => {
    try {
      const { data, error } = await supabase
        .from('coding_challenges')
        .select('*')
        .eq('day_id', dayId);
      if (error) throw error;
      return { success: true, data, error: null };
    } catch (error) {
      return { success: false, data: null, error: error.message };
    }
  },

  getDayCheatSheets: async (dayId) => {
    try {
      const { data, error } = await supabase
        .from('cheat_sheets')
        .select('*')
        .eq('day_id', dayId);
      if (error) throw error;
      return { success: true, data, error: null };
    } catch (error) {
      return { success: false, data: null, error: error.message };
    }
  },

  getDayQuiz: async (dayNumber) => {
    try {
      // 1. Fetch the quiz by matching the title to "Day X Quiz%"
      const { data: quizzes, error: quizError } = await supabase
        .from('quizzes')
        .select('*')
        .ilike('title', `Day ${dayNumber} Quiz%`)
        .limit(1);
      
      if (quizError) throw quizError;
      if (!quizzes || quizzes.length === 0) return { success: true, data: null, error: null };
      
      const quiz = quizzes[0];

      // 2. Fetch the questions for this quiz
      const { data: questions, error: questionsError } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('quiz_id', quiz.id)
        .order('id', { ascending: true }); // Or order_index if you prefer

      if (questionsError) throw questionsError;

      return { success: true, data: { ...quiz, questions }, error: null };
    } catch (error) {
      return { success: false, data: null, error: error.message };
    }
  }
};
