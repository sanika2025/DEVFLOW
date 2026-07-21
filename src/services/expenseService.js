import { supabase } from '../utils/supabaseClient';

export const expenseService = {
  getExpenses: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });
      if (error) throw error;
      return { success: true, data, error: null };
    } catch (error) {
      return { success: false, data: null, error: error.message };
    }
  },

  addExpense: async (userId, expenseData) => {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .insert({
          user_id: userId,
          amount: parseFloat(expenseData.amount),
          category: expenseData.category,
          description: expenseData.description,
          date: expenseData.date || new Date().toISOString()
        })
        .select()
        .single();
      if (error) throw error;
      return { success: true, data, error: null };
    } catch (error) {
      return { success: false, data: null, error: error.message };
    }
  },

  deleteExpense: async (expenseId) => {
    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expenseId);
      if (error) throw error;
      return { success: true, data: null, error: null };
    } catch (error) {
      return { success: false, data: null, error: error.message };
    }
  },

  getMonthlyAnalytics: async (userId) => {
    // Basic aggregation: In a production app you could use a database view or RPC
    // For now we will fetch all user expenses and aggregate in JS
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', userId);
      
      if (error) throw error;

      // Calculate totals per category
      const categoryTotals = data.reduce((acc, curr) => {
        acc[curr.category] = (acc[curr.category] || 0) + parseFloat(curr.amount);
        return acc;
      }, {});
      
      // Calculate total spending
      const total = data.reduce((sum, curr) => sum + parseFloat(curr.amount), 0);

      // Return chart-ready format
      const chartData = Object.entries(categoryTotals).map(([name, value]) => ({ name, value }));

      return { success: true, data: { chartData, total, raw: data }, error: null };
    } catch (error) {
      return { success: false, data: null, error: error.message };
    }
  }
};
