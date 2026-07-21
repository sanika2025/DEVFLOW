import { supabase } from '../utils/supabaseClient';

export const courseService = {
  getCourses: async () => {
    try {
      const { data, error } = await supabase
        .from('curriculum_nodes')
        .select('*')
        .eq('node_type', 'course')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return { success: true, data, error: null };
    } catch (error) {
      return { success: false, data: null, error: error.message };
    }
  },

  getCourseFullRoadmap: async (courseId) => {
    try {
      // Fetch all nodes belonging to this course (months, weeks, days)
      const { data: allNodes, error } = await supabase
        .from('curriculum_nodes')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) throw error;

      // Group them into a tree structure in JavaScript
      const months = allNodes.filter(n => n.node_type === 'month' && n.parent_id === courseId);
      const weeks = allNodes.filter(n => n.node_type === 'week');
      const days = allNodes.filter(n => n.node_type === 'day');

      // Map weeks to days
      const weeksWithDays = weeks.map(week => ({
        ...week,
        week_number: week.order_index,
        days: days.filter(d => d.parent_id === week.id).map(d => ({...d, day_number: d.order_index}))
      }));

      // Map months to weeks
      const tree = months.map(month => ({
        ...month,
        month_number: month.order_index,
        course_id: month.parent_id,
        weeks: weeksWithDays.filter(w => w.parent_id === month.id)
      }));

      return { success: true, data: tree, error: null };
    } catch (error) {
      return { success: false, data: null, error: error.message };
    }
  },
  
  getDayDetails: async (dayId) => {
    try {
      const { data, error } = await supabase
        .from('curriculum_nodes')
        .select('*')
        .eq('id', dayId)
        .eq('node_type', 'day')
        .single();
      if (error) throw error;
      return { success: true, data, error: null };
    } catch (error) {
      return { success: false, data: null, error: error.message };
    }
  }
};
