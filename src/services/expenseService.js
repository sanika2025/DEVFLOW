import { supabase } from '../utils/supabaseClient';

export const expenseService = {
  // Expenses
  getExpenses: async (userId, monthPrefix = null) => {
    try {
      let query = supabase
        .from('expenses')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (monthPrefix) {
        // Simple string match for YYYY-MM
        // In PostgreSQL, date fields can be cast to text, but we can also use gte/lt
        const startDate = new Date(`${monthPrefix}-01T00:00:00Z`);
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 1);
        query = query.gte('date', startDate.toISOString()).lt('date', endDate.toISOString());
      }

      const { data, error } = await query;
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
          date: expenseData.date || new Date().toISOString(),
          payment_method: expenseData.payment_method || 'Cash'
        })
        .select()
        .single();
      if (error) throw error;
      return { success: true, data, error: null };
    } catch (error) {
      return { success: false, data: null, error: error.message };
    }
  },

  updateExpense: async (expenseId, updates) => {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .update(updates)
        .eq('id', expenseId)
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

  // Budgets
  getBudget: async (userId, month) => {
    try {
      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', userId)
        .eq('month', month)
        .maybeSingle(); // might not exist
      if (error && error.code !== 'PGRST116') throw error; // ignore no rows
      return { success: true, data: data || { total_budget: 0, category_budgets: {} }, error: null };
    } catch (error) {
      return { success: false, data: null, error: error.message };
    }
  },

  upsertBudget: async (userId, month, budgetData) => {
    try {
      const { data, error } = await supabase
        .from('budgets')
        .upsert({
          user_id: userId,
          month: month,
          total_budget: parseFloat(budgetData.total_budget),
          category_budgets: budgetData.category_budgets || {}
        }, { onConflict: 'user_id, month' })
        .select()
        .single();
      if (error) throw error;
      return { success: true, data, error: null };
    } catch (error) {
      return { success: false, data: null, error: error.message };
    }
  },

  // Analytics
  getMonthlyAnalytics: async (userId, currentMonthStr) => {
    // currentMonthStr format: 'YYYY-MM'
    try {
      const [year, month] = currentMonthStr.split('-').map(Number);
      
      const currentStart = new Date(year, month - 1, 1);
      const currentEnd = new Date(year, month, 0, 23, 59, 59, 999);
      
      const prevStart = new Date(year, month - 2, 1);
      const prevEnd = new Date(year, month - 1, 0, 23, 59, 59, 999);

      // Fetch expenses for current and previous month
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', userId)
        .gte('date', prevStart.toISOString())
        .lte('date', currentEnd.toISOString());

      if (error) throw error;

      const currentMonthExpenses = data.filter(e => new Date(e.date) >= currentStart);
      const prevMonthExpenses = data.filter(e => new Date(e.date) < currentStart);

      // Aggregates for current month
      let totalSpent = 0;
      const categoryTotals = {};
      const dailyTotals = {};

      currentMonthExpenses.forEach(exp => {
        const amt = parseFloat(exp.amount);
        totalSpent += amt;
        categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + amt;
        
        const dayStr = exp.date.split('T')[0];
        dailyTotals[dayStr] = (dailyTotals[dayStr] || 0) + amt;
      });

      // Aggregates for previous month
      let prevTotalSpent = 0;
      prevMonthExpenses.forEach(exp => {
        prevTotalSpent += parseFloat(exp.amount);
      });

      // Chart Data (Category Breakdown)
      const categoryBreakdown = Object.entries(categoryTotals)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

      return {
        success: true,
        data: {
          totalSpent,
          prevTotalSpent,
          categoryBreakdown,
          dailyTotals,
          rawCurrentMonth: currentMonthExpenses,
        },
        error: null
      };
    } catch (error) {
      return { success: false, data: null, error: error.message };
    }
  }
};
