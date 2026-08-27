import { supabase } from '../utils/supabaseClient';

export const simpleLifeService = {
  // Expenses
  getExpenses: async (userId) => {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });
    if (error) throw error;
    return data;
  },
  
  addExpense: async (userId, expenseData) => {
    const { data, error } = await supabase
      .from('expenses')
      .insert({
        user_id: userId,
        amount: parseFloat(expenseData.amount),
        category: expenseData.category,
        description: expenseData.description,
        date: expenseData.date || new Date().toISOString(),
        home_visit_id: expenseData.home_visit_id || null
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  deleteExpense: async (expenseId) => {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', expenseId);
    if (error) throw error;
    return true;
  },

  // Income
  getIncome: async (userId) => {
    const { data, error } = await supabase
      .from('income')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });
    if (error) throw error;
    return data;
  },
  
  addIncome: async (userId, incomeData) => {
    const { data, error } = await supabase
      .from('income')
      .insert({
        user_id: userId,
        amount: parseFloat(incomeData.amount),
        source: incomeData.source,
        date: incomeData.date || new Date().toISOString()
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  deleteIncome: async (incomeId) => {
    const { error } = await supabase
      .from('income')
      .delete()
      .eq('id', incomeId);
    if (error) throw error;
    return true;
  },

  updateIncome: async (incomeId, updates) => {
    const { data, error } = await supabase
      .from('income')
      .update(updates)
      .eq('id', incomeId)
      .select();
    if (error) throw error;
    return data;
  },

  // Recurring Bills
  getBills: async (userId) => {
    const { data, error } = await supabase
      .from('recurring_bills')
      .select('*')
      .eq('user_id', userId)
      .order('due_date', { ascending: true });
    if (error) throw error;
    return data;
  },
  
  addBill: async (userId, billData) => {
    const { data, error } = await supabase
      .from('recurring_bills')
      .insert({
        user_id: userId,
        name: billData.name,
        amount: parseFloat(billData.amount),
        due_date: parseInt(billData.due_date),
        frequency: billData.frequency || 'monthly',
        category: billData.category,
        is_active: billData.is_active !== undefined ? billData.is_active : true
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  deleteBill: async (billId) => {
    const { error } = await supabase
      .from('recurring_bills')
      .delete()
      .eq('id', billId);
    if (error) throw error;
    return true;
  },

  // Shifts
  getShifts: async (userId) => {
    const { data, error } = await supabase
      .from('shifts')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: true });
    if (error) throw error;
    return data;
  },
  
  addShift: async (userId, shiftData) => {
    const { data, error } = await supabase
      .from('shifts')
      .insert({
        user_id: userId,
        date: shiftData.date,
        shift_type: shiftData.shift_type,
        start_time: shiftData.start_time || null,
        end_time: shiftData.end_time || null,
        location: shiftData.location || null,
        notes: shiftData.notes || null
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  deleteShift: async (shiftId) => {
    const { error } = await supabase
      .from('shifts')
      .delete()
      .eq('id', shiftId);
    if (error) throw error;
    return true;
  },

  updateShift: async (shiftId, updates) => {
    const { data, error } = await supabase
      .from('shifts')
      .update(updates)
      .eq('id', shiftId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  addMultipleShifts: async (shiftsArray) => {
    const { data, error } = await supabase
      .from('shifts')
      .insert(shiftsArray)
      .select();
    if (error) throw error;
    return data;
  },

  // Home Visits
  getHomeVisits: async (userId) => {
    const { data, error } = await supabase
      .from('home_visits')
      .select('*')
      .eq('user_id', userId)
      .order('departure', { ascending: false });
    if (error) throw error;
    return data;
  },
  
  addHomeVisit: async (userId, visitData) => {
    const { data, error } = await supabase
      .from('home_visits')
      .insert({
        user_id: userId,
        departure: visitData.departure,
        return: visitData.return || null,
        destination: visitData.destination || 'Home',
        estimated_cost: visitData.estimated_cost ? parseFloat(visitData.estimated_cost) : null,
        actual_cost: visitData.actual_cost ? parseFloat(visitData.actual_cost) : null,
        travel_mode: visitData.travel_mode || 'Train',
        status: visitData.status || 'planned',
        notes: visitData.notes || null
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  deleteHomeVisit: async (visitId) => {
    const { error } = await supabase
      .from('home_visits')
      .delete()
      .eq('id', visitId);
    if (error) throw error;
    return true;
  },

  updateHomeVisit: async (visitId, updates) => {
    const { data, error } = await supabase
      .from('home_visits')
      .update(updates)
      .eq('id', visitId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Routines
  getRoutines: async (userId) => {
    const { data, error } = await supabase
      .from('routines')
      .select('*')
      .eq('user_id', userId)
      .order('start_time', { ascending: true });
    if (error) throw error;
    return data;
  },
  
  addRoutine: async (userId, routineData) => {
    const { data, error } = await supabase
      .from('routines')
      .insert({
        user_id: userId,
        title: routineData.title,
        start_time: routineData.start_time,
        end_time: routineData.end_time || null,
        days: routineData.days || [],
        category: routineData.category || null,
        shift_type: routineData.shift_type || null,
        enabled: routineData.enabled !== undefined ? routineData.enabled : true
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  deleteRoutine: async (routineId) => {
    const { error } = await supabase
      .from('routines')
      .delete()
      .eq('id', routineId);
    if (error) throw error;
    return true;
  },

  updateRoutine: async (routineId, updates) => {
    const { data, error } = await supabase
      .from('routines')
      .update(updates)
      .eq('id', routineId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  addMultipleRoutines: async (routinesArray) => {
    const { data, error } = await supabase
      .from('routines')
      .insert(routinesArray)
      .select();
    if (error) throw error;
    return data;
  },

  getRoutineCompletions: async (userId, startDate, endDate) => {
    let query = supabase
      .from('routine_completions')
      .select('*')
      .eq('user_id', userId);
    
    if (startDate) query = query.gte('date', startDate);
    if (endDate) query = query.lte('date', endDate);

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  logRoutineCompletion: async (userId, completionData) => {
    // Uses upsert to handle both complete and skip for a specific date
    const { data, error } = await supabase
      .from('routine_completions')
      .upsert({
        routine_id: completionData.routine_id,
        user_id: userId,
        date: completionData.date,
        completed_at: completionData.status === 'completed' ? new Date().toISOString() : null,
        status: completionData.status
      }, { onConflict: 'routine_id, date' })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Tasks
  getTasks: async (userId) => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },
  
  addTask: async (userId, taskData) => {
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        user_id: userId,
        title: taskData.title,
        description: taskData.description || null,
        category: taskData.category || 'Other',
        due_date: taskData.due_date || null,
        due_time: taskData.due_time || null,
        duration_minutes: taskData.duration_minutes ? parseInt(taskData.duration_minutes) : null,
        priority: taskData.priority || 'medium',
        completed: false,
        status: 'todo',
        recurring: taskData.recurring || null,
        home_visit_id: taskData.home_visit_id || null,
        repeat_rule: taskData.repeat_rule || 'None',
        reminder: taskData.reminder || 'None'
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  
  updateTaskStatus: async (taskId, completed) => {
    const updates = { 
      completed, 
      status: completed ? 'completed' : 'pending',
      completed_at: completed ? new Date().toISOString() : null
    };
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', taskId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  updateTask: async (taskId, updates) => {
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', taskId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  deleteTask: async (taskId) => {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);
    if (error) throw error;
    return true;
  }
};
