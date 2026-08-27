import { supabase } from '../utils/supabaseClient';

export const workoutService = {
  // ROUTINES
  getWorkoutRoutines: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('workout_routines')
        .select('*, workout_exercises(*)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      // Sort exercises inside the routines
      if (data) {
        data.forEach(routine => {
          if (routine.workout_exercises) {
            routine.workout_exercises.sort((a, b) => a.order_index - b.order_index);
          }
        });
      }
      if (error) throw error;
      return { success: true, data, error: null };
    } catch (error) {
      return { success: false, data: null, error: error.message };
    }
  },

  addWorkoutRoutine: async (userId, routine) => {
    try {
      const { data, error } = await supabase
        .from('workout_routines')
        .insert({ 
          user_id: userId, 
          title: routine.title, 
          description: routine.description,
          days_of_week: routine.days_of_week,
          difficulty: routine.difficulty,
          estimated_duration: routine.estimated_duration
        })
        .select()
        .single();
      if (error) throw error;
      return { success: true, data, error: null };
    } catch (error) {
      return { success: false, data: null, error: error.message };
    }
  },

  updateWorkoutRoutine: async (routineId, updates) => {
    try {
      const { data, error } = await supabase
        .from('workout_routines')
        .update(updates)
        .eq('id', routineId)
        .select()
        .single();
      if (error) throw error;
      return { success: true, data, error: null };
    } catch (error) {
      return { success: false, data: null, error: error.message };
    }
  },

  deleteWorkoutRoutine: async (routineId) => {
    try {
      const { error } = await supabase.from('workout_routines').delete().eq('id', routineId);
      if (error) throw error;
      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // EXERCISES
  addExercises: async (routineId, exercises) => {
    try {
      const payload = exercises.map(ex => ({
        routine_id: routineId,
        name: ex.name,
        sets: ex.sets,
        reps: ex.reps,
        weight_lbs: ex.weight_lbs,
        rest_time: ex.rest_time,
        order_index: ex.order_index
      }));
      const { data, error } = await supabase.from('workout_exercises').insert(payload).select();
      if (error) throw error;
      return { success: true, data, error: null };
    } catch (error) {
      return { success: false, data: null, error: error.message };
    }
  },

  // SESSIONS
  getWorkoutSessions: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('workout_sessions')
        .select('*, workout_routines(title), workout_sets(*)')
        .eq('user_id', userId)
        .order('start_time', { ascending: false });
      if (error) throw error;
      return { success: true, data, error: null };
    } catch (error) {
      return { success: false, data: null, error: error.message };
    }
  },

  startSession: async (userId, routineId) => {
    try {
      const { data, error } = await supabase
        .from('workout_sessions')
        .insert({ user_id: userId, routine_id: routineId })
        .select()
        .single();
      if (error) throw error;
      return { success: true, data, error: null };
    } catch (error) {
      return { success: false, data: null, error: error.message };
    }
  },

  completeSession: async (sessionId, durationMinutes) => {
    try {
      const { data, error } = await supabase
        .from('workout_sessions')
        .update({ 
          end_time: new Date().toISOString(), 
          duration_minutes: durationMinutes,
          is_completed: true 
        })
        .eq('id', sessionId)
        .select()
        .single();
      if (error) throw error;
      return { success: true, data, error: null };
    } catch (error) {
      return { success: false, data: null, error: error.message };
    }
  },

  // SETS
  saveSets: async (sessionId, sets) => {
    try {
      const payload = sets.map(s => ({
        session_id: sessionId,
        exercise_id: s.exercise_id,
        set_number: s.set_number,
        reps_completed: s.reps_completed,
        weight_used: s.weight_used,
        is_completed: s.is_completed
      }));
      const { data, error } = await supabase.from('workout_sets').insert(payload).select();
      if (error) throw error;
      return { success: true, data, error: null };
    } catch (error) {
      return { success: false, data: null, error: error.message };
    }
  },

  // GOALS
  getWorkoutGoals: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('workout_goals')
        .select('*')
        .eq('user_id', userId)
        .single();
      if (error && error.code !== 'PGRST116') throw error; // Allow empty
      return { success: true, data, error: null };
    } catch (error) {
      return { success: false, data: null, error: error.message };
    }
  },

  saveWorkoutGoals: async (userId, weeklyTarget, monthlyTarget) => {
    try {
      const { data, error } = await supabase
        .from('workout_goals')
        .upsert({ user_id: userId, weekly_target: weeklyTarget, monthly_target: monthlyTarget }, { onConflict: 'user_id' })
        .select()
        .single();
      if (error) throw error;
      return { success: true, data, error: null };
    } catch (error) {
      return { success: false, data: null, error: error.message };
    }
  }
};
