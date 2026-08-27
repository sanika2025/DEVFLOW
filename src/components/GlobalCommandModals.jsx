import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { simpleLifeService } from '../services/simpleLifeService';
import { useAuthStore } from '../store/useAuthStore';
import { Modal } from './Modal';
import Swal from 'sweetalert2';
import { 
  Plus, DollarSign, Wallet, CheckSquare, Calendar, Target, Home
} from 'lucide-react';

export function GlobalCommandModals({ isOpen, onClose, type }) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  // Unified state for forms
  const [expenseForm, setExpenseForm] = useState({ amount: '', category: 'Food', description: '' });
  const [incomeForm, setIncomeForm] = useState({ amount: '', source: 'Salary' });
  const [taskForm, setTaskForm] = useState({ title: '', category: 'Work', priority: 'medium', due_date: new Date().toISOString().split('T')[0], due_time: '', repeat_rule: 'None', reminder: 'None' });
  const [shiftForm, setShiftForm] = useState({ date: new Date().toISOString().split('T')[0], shift_type: 'Morning', start_time: '08:00', end_time: '16:00' });
  const [routineForm, setRoutineForm] = useState({ title: '', category: 'Health', start_time: '07:00' });
  const [visitForm, setVisitForm] = useState({ departure: new Date().toISOString().split('T')[0], return: '', travel_mode: 'Train', estimated_cost: '', notes: '' });

  // Mutations
  const addExpMut = useMutation({
    mutationFn: (d) => simpleLifeService.addExpense(user?.id, d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simple-expenses'] });
      onClose();
      setExpenseForm({ amount: '', category: 'Food', description: '' });
      Swal.fire({ icon: 'success', title: 'Added', timer: 1000, showConfirmButton: false });
    }
  });

  const addIncMut = useMutation({
    mutationFn: (d) => simpleLifeService.addIncome(user?.id, d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simple-income'] });
      onClose();
      setIncomeForm({ amount: '', source: 'Salary' });
      Swal.fire({ icon: 'success', title: 'Added', timer: 1000, showConfirmButton: false });
    }
  });

  const addTaskMut = useMutation({
    mutationFn: (d) => simpleLifeService.addTask(user?.id, d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simple-tasks'] });
      onClose();
      setTaskForm({ title: '', category: 'Work', priority: 'Medium', due_date: new Date().toISOString().split('T')[0], due_time: '' });
      Swal.fire({ icon: 'success', title: 'Added', timer: 1000, showConfirmButton: false });
    }
  });

  const addShiftMut = useMutation({
    mutationFn: (d) => simpleLifeService.addShift(user?.id, d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simple-shifts'] });
      onClose();
      Swal.fire({ icon: 'success', title: 'Added', timer: 1000, showConfirmButton: false });
    }
  });

  const addRoutineMut = useMutation({
    mutationFn: (d) => simpleLifeService.addRoutine(user?.id, d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simple-routines'] });
      onClose();
      setRoutineForm({ title: '', category: 'Health', start_time: '07:00' });
      Swal.fire({ icon: 'success', title: 'Added', timer: 1000, showConfirmButton: false });
    }
  });

  const addVisitMut = useMutation({
    mutationFn: (d) => simpleLifeService.addHomeVisit(user?.id, d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simple-home-visits'] });
      onClose();
      Swal.fire({ icon: 'success', title: 'Planned', timer: 1000, showConfirmButton: false });
    }
  });

  const renderForm = () => {
    switch (type) {
      case 'expense':
        return (
          <form onSubmit={(e) => { e.preventDefault(); addExpMut.mutate(expenseForm); }} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Amount</label>
              <input type="number" autoFocus required value={expenseForm.amount} onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})} className="w-full text-2xl font-bold py-3 border-b-2 border-slate-200 dark:border-zinc-800 focus:border-indigo-500 outline-none bg-transparent min-h-[44px]" placeholder="0" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description (Optional)</label>
              <input type="text" value={expenseForm.description} onChange={e => setExpenseForm({...expenseForm, description: e.target.value})} className="w-full border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 outline-none focus:border-indigo-500 bg-white dark:bg-zinc-900/50 min-h-[44px]" placeholder="e.g. Lunch at Cafe" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Category</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Other'].map(c => (
                  <button type="button" key={c} onClick={() => setExpenseForm({...expenseForm, category: c})} className={`p-2 rounded-xl border text-sm font-medium transition-colors min-h-[44px] ${expenseForm.category === c ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300' : 'border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800/50'}`}>{c}</button>
                ))}
              </div>
            </div>
            <button type="submit" disabled={addExpMut.isPending} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold mt-4 disabled:opacity-50 min-h-[44px]">Save Expense</button>
          </form>
        );
      case 'income':
        return (
          <form onSubmit={(e) => { e.preventDefault(); addIncMut.mutate(incomeForm); }} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Amount</label>
              <input type="number" autoFocus required value={incomeForm.amount} onChange={e => setIncomeForm({...incomeForm, amount: e.target.value})} className="w-full text-2xl font-bold py-3 border-b-2 border-slate-200 dark:border-zinc-800 focus:border-emerald-500 outline-none bg-transparent min-h-[44px]" placeholder="0" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Source</label>
              <input type="text" required value={incomeForm.source} onChange={e => setIncomeForm({...incomeForm, source: e.target.value})} className="w-full border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 outline-none focus:border-emerald-500 bg-white dark:bg-zinc-900/50 min-h-[44px]" placeholder="e.g. Salary, Bonus" />
            </div>
            <button type="submit" disabled={addIncMut.isPending} className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold mt-4 disabled:opacity-50 min-h-[44px]">Save Income</button>
          </form>
        );
      case 'task':
        return (
          <form onSubmit={(e) => { e.preventDefault(); addTaskMut.mutate(taskForm); }} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Task Title</label>
              <input type="text" autoFocus required value={taskForm.title} onChange={e => setTaskForm({...taskForm, title: e.target.value})} className="w-full border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-3 outline-none focus:border-indigo-500 bg-white dark:bg-zinc-900/50 min-h-[44px]" placeholder="What needs to be done?" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select value={taskForm.category} onChange={e => setTaskForm({...taskForm, category: e.target.value})} className="w-full border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 outline-none focus:border-indigo-500 bg-white dark:bg-zinc-900/50 min-h-[44px]">
                  {['Work', 'Personal', 'Home', 'Health', 'Learning', 'Travel'].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Priority</label>
                <select value={taskForm.priority} onChange={e => setTaskForm({...taskForm, priority: e.target.value})} className="w-full border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 outline-none focus:border-indigo-500 bg-white dark:bg-zinc-900/50 min-h-[44px]">
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Due Date</label>
                <input type="date" required value={taskForm.due_date} onChange={e => setTaskForm({...taskForm, due_date: e.target.value})} className="w-full border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 outline-none focus:border-indigo-500 bg-white dark:bg-zinc-900/50 min-h-[44px]" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Time (Optional)</label>
                <input type="time" value={taskForm.due_time} onChange={e => setTaskForm({...taskForm, due_time: e.target.value})} className="w-full border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 outline-none focus:border-indigo-500 bg-white dark:bg-zinc-900/50 min-h-[44px]" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Repeat</label>
                <select value={taskForm.repeat_rule} onChange={e => setTaskForm({...taskForm, repeat_rule: e.target.value})} className="w-full border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 outline-none focus:border-indigo-500 bg-white dark:bg-zinc-900/50 min-h-[44px]">
                  <option>None</option><option>Daily</option><option>Weekly</option><option>Monthly</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Reminder</label>
                <select value={taskForm.reminder} onChange={e => setTaskForm({...taskForm, reminder: e.target.value})} className="w-full border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 outline-none focus:border-indigo-500 bg-white dark:bg-zinc-900/50 min-h-[44px]">
                  <option>None</option><option>10 min before</option><option>30 min before</option><option>1 hour before</option>
                </select>
              </div>
            </div>
            <button type="submit" disabled={addTaskMut.isPending} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold mt-4 disabled:opacity-50 min-h-[44px]">Add Task</button>
          </form>
        );
      case 'shift':
        return (
          <form onSubmit={(e) => { e.preventDefault(); addShiftMut.mutate(shiftForm); }} className="space-y-4">
            <div className="grid grid-cols-4 gap-2 mb-4">
              {['Morning', 'Evening', 'Night', 'Off'].map(t => (
                <button type="button" key={t} onClick={() => setShiftForm({...shiftForm, shift_type: t})} className={`p-2 rounded-xl border flex flex-col items-center gap-1 min-h-[44px] transition-all ${shiftForm.shift_type === t ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400' : 'border-slate-200 dark:border-zinc-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-zinc-800/50'}`}>
                  <span className="text-xs font-bold">{t}</span>
                </button>
              ))}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Date</label>
              <input type="date" required value={shiftForm.date} onChange={e => setShiftForm({...shiftForm, date: e.target.value})} className="w-full border border-slate-200 dark:border-zinc-800 rounded-xl p-3 outline-none focus:border-indigo-500 bg-white dark:bg-zinc-900/50 min-h-[44px]" />
            </div>
            {shiftForm.shift_type !== 'Off' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Start Time</label>
                  <input type="time" required value={shiftForm.start_time} onChange={e => setShiftForm({...shiftForm, start_time: e.target.value})} className="w-full border border-slate-200 dark:border-zinc-800 rounded-xl p-3 outline-none focus:border-indigo-500 bg-white dark:bg-zinc-900/50 min-h-[44px]" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">End Time</label>
                  <input type="time" required value={shiftForm.end_time} onChange={e => setShiftForm({...shiftForm, end_time: e.target.value})} className="w-full border border-slate-200 dark:border-zinc-800 rounded-xl p-3 outline-none focus:border-indigo-500 bg-white dark:bg-zinc-900/50 min-h-[44px]" />
                </div>
              </div>
            )}
            <button type="submit" disabled={addShiftMut.isPending} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold mt-4 disabled:opacity-50 min-h-[44px]">Save Shift</button>
          </form>
        );
      case 'routine':
        return (
          <form onSubmit={(e) => { e.preventDefault(); addRoutineMut.mutate(routineForm); }} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Routine Name</label>
              <input type="text" required placeholder="e.g. Morning Workout" value={routineForm.title} onChange={e => setRoutineForm({...routineForm, title: e.target.value})} className="w-full border border-slate-200 dark:border-zinc-800 rounded-xl p-3 outline-none focus:border-blue-500 bg-white dark:bg-zinc-900/50 min-h-[44px]" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Start Time</label>
                <input type="time" required value={routineForm.start_time} onChange={e => setRoutineForm({...routineForm, start_time: e.target.value})} className="w-full border border-slate-200 dark:border-zinc-800 rounded-xl p-3 outline-none focus:border-blue-500 bg-white dark:bg-zinc-900/50 min-h-[44px]" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select value={routineForm.category} onChange={e => setRoutineForm({...routineForm, category: e.target.value})} className="w-full border border-slate-200 dark:border-zinc-800 rounded-xl p-3 outline-none focus:border-blue-500 bg-white dark:bg-zinc-900/50 min-h-[44px]">
                  {['Health', 'Work', 'Learning', 'Food', 'Personal', 'Family', 'Sleep'].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <button type="submit" disabled={addRoutineMut.isPending} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold mt-4 disabled:opacity-50 min-h-[44px]">Save Routine</button>
          </form>
        );
      case 'visit':
        return (
          <form onSubmit={(e) => { e.preventDefault(); addVisitMut.mutate(visitForm); }} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Departure</label>
                <input type="date" required value={visitForm.departure} onChange={e => setVisitForm({...visitForm, departure: e.target.value})} className="w-full border border-slate-200 dark:border-zinc-800 rounded-xl p-3 outline-none focus:border-amber-500 bg-white dark:bg-zinc-900/50 min-h-[44px]" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Return</label>
                <input type="date" value={visitForm.return} onChange={e => setVisitForm({...visitForm, return: e.target.value})} className="w-full border border-slate-200 dark:border-zinc-800 rounded-xl p-3 outline-none focus:border-amber-500 bg-white dark:bg-zinc-900/50 min-h-[44px]" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Travel Mode</label>
              <div className="grid grid-cols-4 gap-2">
                {['Train', 'Flight', 'Bus', 'Car'].map(mode => (
                  <button type="button" key={mode} onClick={() => setVisitForm({...visitForm, travel_mode: mode})} className={`p-2 rounded-xl border flex flex-col items-center gap-1 min-h-[44px] transition-all ${visitForm.travel_mode === mode ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-500' : 'border-slate-200 dark:border-zinc-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-zinc-800/50'}`}>
                    <span className="text-xs font-bold">{mode}</span>
                  </button>
                ))}
              </div>
            </div>
            <button type="submit" disabled={addVisitMut.isPending} className="w-full bg-amber-500 text-white py-3 rounded-xl font-bold mt-4 disabled:opacity-50 min-h-[44px]">Plan Visit</button>
          </form>
        );
      default:
        return null;
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'expense': return 'Add Expense';
      case 'income': return 'Add Income';
      case 'task': return 'Add Task';
      case 'shift': return 'Add Shift';
      case 'routine': return 'Add Routine';
      case 'visit': return 'Plan Home Visit';
      default: return 'Add Item';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={getTitle()}>
      {renderForm()}
    </Modal>
  );
}
