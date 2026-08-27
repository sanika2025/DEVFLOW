import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { plannerService } from '../services/plannerService';
import { simpleLifeService } from '../services/simpleLifeService';
import { workoutService } from '../services/workoutService';
import { useAuthStore } from '../store/useAuthStore';
import { Card } from '../components/Card';
import { Modal } from '../components/Modal';
import { Plus, Clock, CheckCircle2, Circle, Loader2, Calendar, Target, Briefcase, Activity, Home, Sun, BookOpen, MoreVertical, X } from 'lucide-react';

export default function Planner() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  
  const [view, setView] = useState('day'); // 'day', 'week'
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', status: 'todo', category: 'Personal', priority: 'medium', due_date: '', due_time: '', repeat_rule: 'None', reminder: 'None' });
  
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [newBlock, setNewBlock] = useState({ title: '', start_time: '', end_time: '', category: 'Work', date: new Date().toISOString().split('T')[0] });

  // --- Data Fetching ---
  const { data: tasksData, isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', user?.id],
    queryFn: () => plannerService.getTasks(user?.id),
    enabled: !!user?.id
  });

  const { data: blocksData, isLoading: blocksLoading } = useQuery({
    queryKey: ['time_blocks', user?.id],
    queryFn: () => plannerService.getTimeBlocks(user?.id),
    enabled: !!user?.id
  });

  const { data: routinesData } = useQuery({
    queryKey: ['routines', user?.id],
    queryFn: () => simpleLifeService.getRoutines(user?.id),
    enabled: !!user?.id
  });

  const { data: shiftsData } = useQuery({
    queryKey: ['shifts', user?.id],
    queryFn: () => simpleLifeService.getShifts(user?.id),
    enabled: !!user?.id
  });

  const { data: workoutsData } = useQuery({
    queryKey: ['workout_sessions', user?.id],
    queryFn: () => workoutService.getWorkoutSessions(user?.id),
    enabled: !!user?.id
  });
  
  const { data: workoutRoutinesData } = useQuery({
    queryKey: ['workout_routines', user?.id],
    queryFn: () => workoutService.getWorkoutRoutines(user?.id),
    enabled: !!user?.id
  });

  const tasks = tasksData?.data || [];
  const timeBlocks = blocksData?.data || [];
  const routines = routinesData?.data || [];
  const shifts = shiftsData?.data || [];
  const workoutSessions = workoutsData?.data || [];
  const workoutRoutines = workoutRoutinesData?.data || [];

  const isLoading = tasksLoading || blocksLoading;

  // --- Mutations ---
  const addTaskMutation = useMutation({
    mutationFn: (task) => plannerService.addTask(user?.id, task),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', user?.id] });
      setIsTaskModalOpen(false);
      setNewTask({ title: '', description: '', status: 'todo', category: 'Personal', priority: 'medium', due_date: '', due_time: '', repeat_rule: 'None', reminder: 'None' });
    }
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, updates }) => plannerService.updateTask(id, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks', user?.id] })
  });

  const addBlockMutation = useMutation({
    mutationFn: (block) => plannerService.addTimeBlock(user?.id, block),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time_blocks', user?.id] });
      setIsBlockModalOpen(false);
      setNewBlock({ title: '', start_time: '', end_time: '', category: 'Work', date: new Date().toISOString().split('T')[0] });
    }
  });
  
  const deleteBlockMutation = useMutation({
    mutationFn: (id) => plannerService.deleteTimeBlock(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['time_blocks', user?.id] })
  });

  // --- Derived Data for Today ---
  const todayStr = selectedDate.toISOString().split('T')[0];
  const todayDayOfWeek = selectedDate.getDay(); // 0 is Sunday
  
  const todayTasks = tasks.filter(t => {
    // If it has a date, match it, otherwise treat as inbox/today if pending
    if (t.due_date) return t.due_date === todayStr;
    return true; // Inbox fallback
  });
  
  const todayBlocks = timeBlocks.filter(b => b.date === todayStr).sort((a, b) => a.start_time.localeCompare(b.start_time));
  
  const todayRoutines = routines.filter(r => r.enabled && r.days && r.days.includes(todayDayOfWeek.toString()));
  
  // Aggregate upcoming
  const upcomingEvents = useMemo(() => {
    const events = [];
    const now = new Date(selectedDate);
    
    // Check next 7 days for shifts
    shifts.forEach(s => {
      if (new Date(s.date) > now && new Date(s.date) < new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)) {
        events.push({ title: `${s.shift_type} Shift`, date: new Date(s.date), category: 'Work', time: s.start_time });
      }
    });
    
    // Check workout routines scheduled
    workoutRoutines.forEach(wr => {
      wr.days_of_week?.forEach(d => {
        let diff = d - todayDayOfWeek;
        if (diff <= 0) diff += 7;
        const targetDate = new Date(now);
        targetDate.setDate(now.getDate() + diff);
        if (diff <= 7 && diff > 0) {
          events.push({ title: wr.title, date: targetDate, category: 'Workout', time: 'Any time' });
        }
      });
    });
    
    return events.sort((a, b) => a.date - b.date).slice(0, 4);
  }, [shifts, workoutRoutines, selectedDate, todayDayOfWeek]);
  
  // Productivity Stats (Last 7 days)
  const stats = useMemo(() => {
    const weekAgo = new Date(new Date().setDate(new Date().getDate() - 7));
    const recentTasks = tasks.filter(t => new Date(t.created_at) > weekAgo || new Date(t.completed_at) > weekAgo);
    
    const created = tasks.filter(t => new Date(t.created_at) > weekAgo).length;
    const completed = tasks.filter(t => t.completed && new Date(t.completed_at) > weekAgo).length;
    const overdue = tasks.filter(t => !t.completed && t.due_date && new Date(t.due_date) < new Date()).length;
    
    return {
      created,
      completed,
      rate: created > 0 ? Math.round((completed / created) * 100) : 0,
      overdue
    };
  }, [tasks]);

  // Handle Drag and Drop
  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData('taskId', taskId);
  };

  const handleDrop = (e, status) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
      updateTaskMutation.mutate({ id: taskId, updates: { status } });
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const completedTodayCount = todayTasks.filter(t => t.completed).length;
  const totalTodayCount = todayTasks.length;
  const progressPercent = totalTodayCount > 0 ? Math.round((completedTodayCount / totalTodayCount) * 100) : 100;

  if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-indigo-600" /></div>;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-24">
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-800 dark:text-zinc-50">Daily Planner</h2>
          <p className="text-slate-500 dark:text-zinc-400 mt-1">Organize your tasks, habits, and time.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center bg-slate-100 dark:bg-zinc-800/80 rounded-lg p-1 mr-2">
            <button 
              onClick={() => {
                const prev = new Date(selectedDate);
                prev.setDate(prev.getDate() - 1);
                setSelectedDate(prev);
              }}
              className="p-1.5 hover:bg-white dark:hover:bg-zinc-700 rounded-md transition-colors text-slate-600 dark:text-zinc-300"
            >
              &lt;
            </button>
            <span className="px-3 font-medium text-sm text-slate-800 dark:text-zinc-100 w-32 text-center">
              {selectedDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
            <button 
              onClick={() => {
                const next = new Date(selectedDate);
                next.setDate(next.getDate() + 1);
                setSelectedDate(next);
              }}
              className="p-1.5 hover:bg-white dark:hover:bg-zinc-700 rounded-md transition-colors text-slate-600 dark:text-zinc-300"
            >
              &gt;
            </button>
            <button onClick={() => setSelectedDate(new Date())} className="ml-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 px-2 hover:underline">Today</button>
          </div>
          
          <button 
            onClick={() => setIsTaskModalOpen(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-medium shadow-sm hover:bg-indigo-700 transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            <Plus size={18} /> Add Task
          </button>
        </div>
      </header>

      {/* Today's Overview */}
      <Card className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-none shadow-lg">
        <div className="flex flex-col md:flex-row gap-6 justify-between items-center">
          <div className="w-full md:w-1/3">
            <h3 className="font-bold text-lg mb-2">Today's Progress</h3>
            <div className="flex justify-between text-sm mb-1 text-indigo-100">
              <span>{completedTodayCount} / {totalTodayCount} tasks completed</span>
              <span className="font-bold">{progressPercent}%</span>
            </div>
            <div className="w-full bg-indigo-900/40 rounded-full h-3">
              <div className="bg-white h-3 rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3 justify-center md:justify-end w-full md:w-2/3">
             <div className="bg-white/10 px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm font-medium backdrop-blur-sm">
               <CheckCircle2 size={16} /> {todayTasks.length} Tasks
             </div>
             {workoutRoutines.some(r => r.days_of_week?.includes(todayDayOfWeek)) && (
               <div className="bg-orange-500/20 px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm font-medium backdrop-blur-sm border border-orange-500/30">
                 <Activity size={16} className="text-orange-300" /> Workout
               </div>
             )}
             {todayRoutines.length > 0 && (
               <div className="bg-blue-500/20 px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm font-medium backdrop-blur-sm border border-blue-500/30">
                 <Sun size={16} className="text-blue-300" /> {todayRoutines.length} Routines
               </div>
             )}
             {shifts.some(s => s.date === todayStr) && (
               <div className="bg-emerald-500/20 px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm font-medium backdrop-blur-sm border border-emerald-500/30">
                 <Briefcase size={16} className="text-emerald-300" /> Shift Today
               </div>
             )}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Schedule & Habits */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="flex flex-col">
            <div className="flex justify-between items-center mb-4">
               <h3 className="font-bold text-slate-800 dark:text-zinc-50 flex items-center gap-2"><Clock size={18} className="text-indigo-500"/> Schedule</h3>
               <button onClick={() => setIsBlockModalOpen(true)} className="text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 p-1 rounded-md transition-colors"><Plus size={16}/></button>
            </div>
            
            <div className="space-y-3 relative">
              {todayBlocks.length === 0 && (
                <div className="text-center py-6 text-slate-400 dark:text-zinc-500 text-sm border-2 border-dashed border-slate-100 dark:border-zinc-800 rounded-lg">
                  No time blocks planned.<br/><button onClick={() => setIsBlockModalOpen(true)} className="text-indigo-500 font-medium mt-1">Plan your day</button>
                </div>
              )}
              {todayBlocks.map(block => (
                <div key={block.id} className="flex gap-3 relative z-10 group">
                  <div className="flex flex-col items-end w-16 shrink-0 text-xs text-slate-500 dark:text-zinc-400 font-medium pt-1">
                    <span>{block.start_time.substring(0,5)}</span>
                  </div>
                  <div className={`flex-1 p-3 rounded-lg border border-l-4 ${getCategoryColor(block.category)} bg-white dark:bg-zinc-900 shadow-sm group-hover:shadow transition-shadow relative`}>
                    <button onClick={() => deleteBlockMutation.mutate(block.id)} className="absolute top-2 right-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><X size={14}/></button>
                    <h4 className="font-semibold text-sm text-slate-800 dark:text-zinc-50">{block.title}</h4>
                    <span className="text-xs text-slate-500 dark:text-zinc-400">{block.start_time.substring(0,5)} - {block.end_time.substring(0,5)} • {block.category}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h3 className="font-bold text-slate-800 dark:text-zinc-50 flex items-center gap-2 mb-4"><Sun size={18} className="text-amber-500"/> Today's Habits</h3>
            <div className="space-y-2">
              {todayRoutines.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-zinc-400">No routines scheduled.</p>
              ) : (
                todayRoutines.map(r => (
                  <div key={r.id} className="flex items-center justify-between p-2 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                    <span className="text-sm font-medium text-slate-700 dark:text-zinc-300">{r.title}</span>
                    <button className="w-5 h-5 rounded-full border border-slate-300 dark:border-zinc-600 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-zinc-700">
                       {/* UI visual only for habits since simple_life doesn't track daily completions yet */}
                    </button>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card>
            <h3 className="font-bold text-slate-800 dark:text-zinc-50 mb-3 text-sm uppercase tracking-wider text-slate-500">Upcoming</h3>
            <div className="space-y-3">
              {upcomingEvents.length === 0 ? (
                <p className="text-sm text-slate-500">Nothing major coming up.</p>
              ) : (
                upcomingEvents.map((ev, i) => (
                  <div key={i} className="flex gap-3 items-center">
                    <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex flex-col items-center justify-center text-indigo-700 dark:text-indigo-400 shrink-0">
                      <span className="text-[10px] font-bold uppercase">{ev.date.toLocaleDateString(undefined, { weekday: 'short' })}</span>
                      <span className="text-sm font-bold leading-none">{ev.date.getDate()}</span>
                    </div>
                    <div className="overflow-hidden">
                      <h4 className="text-sm font-semibold text-slate-800 dark:text-zinc-50 truncate">{ev.title}</h4>
                      <p className="text-xs text-slate-500 truncate">{ev.category} • {ev.time}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: Kanban Board */}
        <div className="lg:col-span-3">
           {totalTodayCount === 0 && todayBlocks.length === 0 ? (
             <Card className="flex flex-col items-center justify-center text-center py-20 min-h-[400px]">
               <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-500/10 rounded-full flex items-center justify-center mb-4">
                 <Target className="text-indigo-500" size={32} />
               </div>
               <h3 className="text-2xl font-bold text-slate-800 dark:text-zinc-50 mb-2">Your day is clear 🎯</h3>
               <p className="text-slate-500 dark:text-zinc-400 max-w-sm mx-auto mb-6">No tasks scheduled for today. Plan your day by adding your first time block or task.</p>
               <button onClick={() => setIsTaskModalOpen(true)} className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition-colors">
                 + Add Task
               </button>
             </Card>
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full min-h-[500px]">
               <KanbanColumn 
                 title="To Do" 
                 status="todo" 
                 tasks={todayTasks.filter(t => t.status === 'todo')} 
                 onDrop={handleDrop} 
                 onDragOver={handleDragOver} 
                 onDragStart={handleDragStart}
                 onStatusChange={(id, status) => updateTaskMutation.mutate({ id, updates: { status } })}
               />
               <KanbanColumn 
                 title="In Progress" 
                 status="in-progress" 
                 tasks={todayTasks.filter(t => t.status === 'in-progress')} 
                 onDrop={handleDrop} 
                 onDragOver={handleDragOver} 
                 onDragStart={handleDragStart}
                 onStatusChange={(id, status) => updateTaskMutation.mutate({ id, updates: { status } })}
               />
               <KanbanColumn 
                 title="Done" 
                 status="done" 
                 tasks={todayTasks.filter(t => t.status === 'done')} 
                 onDrop={handleDrop} 
                 onDragOver={handleDragOver} 
                 onDragStart={handleDragStart}
                 onStatusChange={(id, status) => updateTaskMutation.mutate({ id, updates: { status } })}
               />
             </div>
           )}
           
           {/* Productivity Summary */}
           <div className="mt-6 flex justify-end">
             <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-4 flex gap-6 shadow-sm">
               <div>
                 <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">This Week</p>
                 <p className="font-bold text-slate-800 dark:text-zinc-50">{stats.completed} <span className="text-slate-400 font-normal">/ {stats.created} tasks</span></p>
               </div>
               <div>
                 <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Completion</p>
                 <p className="font-bold text-indigo-600 dark:text-indigo-400">{stats.rate}%</p>
               </div>
               <div>
                 <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Overdue</p>
                 <p className="font-bold text-red-500">{stats.overdue}</p>
               </div>
             </div>
           </div>
        </div>
      </div>

      {/* Task Creation Modal */}
      <Modal isOpen={isTaskModalOpen} onClose={() => setIsTaskModalOpen(false)} title="Create Task" className="max-w-2xl">
        <form onSubmit={(e) => { e.preventDefault(); addTaskMutation.mutate(newTask); }} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1">Task Title</label>
              <input required type="text" value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} placeholder="What needs to be done?" className="w-full border rounded-lg px-3 py-2 bg-transparent dark:border-zinc-800" />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1">Description (Optional)</label>
              <textarea value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})} className="w-full border rounded-lg px-3 py-2 bg-transparent dark:border-zinc-800" rows="2"></textarea>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1">Date</label>
              <input type="date" value={newTask.due_date} onChange={e => setNewTask({...newTask, due_date: e.target.value})} className="w-full border rounded-lg px-3 py-2 bg-transparent dark:border-zinc-800" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1">Time (Optional)</label>
              <input type="time" value={newTask.due_time} onChange={e => setNewTask({...newTask, due_time: e.target.value})} className="w-full border rounded-lg px-3 py-2 bg-transparent dark:border-zinc-800" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1">Category</label>
              <select value={newTask.category} onChange={e => setNewTask({...newTask, category: e.target.value})} className="w-full border rounded-lg px-3 py-2 bg-transparent dark:border-zinc-800">
                <option>Work</option><option>Learning</option><option>Workout</option><option>Personal</option><option>Finance</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1">Priority</label>
              <select value={newTask.priority} onChange={e => setNewTask({...newTask, priority: e.target.value})} className="w-full border rounded-lg px-3 py-2 bg-transparent dark:border-zinc-800">
                <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1">Repeat</label>
              <select value={newTask.repeat_rule} onChange={e => setNewTask({...newTask, repeat_rule: e.target.value})} className="w-full border rounded-lg px-3 py-2 bg-transparent dark:border-zinc-800">
                <option>None</option><option>Daily</option><option>Weekly</option><option>Monthly</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1">Reminder</label>
              <select value={newTask.reminder} onChange={e => setNewTask({...newTask, reminder: e.target.value})} className="w-full border rounded-lg px-3 py-2 bg-transparent dark:border-zinc-800">
                <option>None</option><option>10 minutes before</option><option>30 minutes before</option><option>1 hour before</option>
              </select>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-zinc-800">
            <button type="button" onClick={() => setIsTaskModalOpen(false)} className="px-5 py-2.5 rounded-xl font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">Cancel</button>
            <button type="submit" disabled={addTaskMutation.isPending} className="px-5 py-2.5 rounded-xl font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors">Create Task</button>
          </div>
        </form>
      </Modal>
      
      {/* Time Block Modal */}
      <Modal isOpen={isBlockModalOpen} onClose={() => setIsBlockModalOpen(false)} title="Schedule Block">
        <form onSubmit={(e) => { e.preventDefault(); addBlockMutation.mutate(newBlock); }} className="space-y-4">
           <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1">Title</label>
              <input required type="text" value={newBlock.title} onChange={e => setNewBlock({...newBlock, title: e.target.value})} placeholder="e.g. Deep Work" className="w-full border rounded-lg px-3 py-2 bg-transparent dark:border-zinc-800" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1">Date</label>
                <input required type="date" value={newBlock.date} onChange={e => setNewBlock({...newBlock, date: e.target.value})} className="w-full border rounded-lg px-3 py-2 bg-transparent dark:border-zinc-800" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1">Category</label>
                <select value={newBlock.category} onChange={e => setNewBlock({...newBlock, category: e.target.value})} className="w-full border rounded-lg px-3 py-2 bg-transparent dark:border-zinc-800">
                  <option>Work</option><option>Learning</option><option>Workout</option><option>Personal</option><option>Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1">Start Time</label>
                <input required type="time" value={newBlock.start_time} onChange={e => setNewBlock({...newBlock, start_time: e.target.value})} className="w-full border rounded-lg px-3 py-2 bg-transparent dark:border-zinc-800" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1">End Time</label>
                <input required type="time" value={newBlock.end_time} onChange={e => setNewBlock({...newBlock, end_time: e.target.value})} className="w-full border rounded-lg px-3 py-2 bg-transparent dark:border-zinc-800" />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button type="button" onClick={() => setIsBlockModalOpen(false)} className="px-5 py-2.5 rounded-xl font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">Cancel</button>
              <button type="submit" disabled={addBlockMutation.isPending} className="px-5 py-2.5 rounded-xl font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors">Save Block</button>
            </div>
        </form>
      </Modal>

    </div>
  );
}

function KanbanColumn({ title, status, tasks, onDrop, onDragOver, onDragStart, onStatusChange }) {
  return (
    <div 
      className="bg-slate-50/50 dark:bg-zinc-900/50 rounded-2xl p-4 border border-slate-200/60 dark:border-zinc-800 flex flex-col h-full"
      onDrop={(e) => onDrop(e, status)}
      onDragOver={onDragOver}
    >
      <div className="flex justify-between items-center mb-4 px-1">
        <h3 className="font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider text-xs">{title}</h3>
        <span className="bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 px-2 py-0.5 rounded-full text-xs font-bold">{tasks.length}</span>
      </div>
      <div className="space-y-3 flex-1 overflow-y-auto pr-1 custom-scrollbar pb-4">
        {tasks.map(t => (
          <div 
            key={t.id} 
            draggable 
            onDragStart={(e) => onDragStart(e, t.id)}
            className="bg-white dark:bg-zinc-950 p-3.5 rounded-xl shadow-sm border border-slate-100 dark:border-zinc-800 cursor-grab active:cursor-grabbing hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-colors relative group"
          >
            <div className="flex items-start gap-3">
              <button 
                onClick={() => onStatusChange(t.id, t.status === 'done' ? 'todo' : 'done')}
                className="mt-0.5 shrink-0 text-slate-300 hover:text-indigo-500 transition-colors"
              >
                {t.status === 'done' ? <CheckCircle2 className="text-emerald-500" size={18} /> : <Circle size={18} />}
              </button>
              <div className="flex-1 min-w-0">
                <p className={`font-semibold text-sm truncate ${t.status === 'done' ? 'line-through text-slate-400' : 'text-slate-800 dark:text-zinc-50'}`}>{t.title}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="text-[10px] font-medium bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-zinc-400">{t.category || 'Personal'}</span>
                  {t.priority === 'high' && <span className="text-[10px] font-medium bg-red-50 text-red-600 dark:bg-red-500/10 px-1.5 py-0.5 rounded">High</span>}
                  {t.due_time && <span className="text-[10px] font-medium text-slate-500 flex items-center gap-0.5"><Clock size={10}/> {t.due_time.substring(0,5)}</span>}
                </div>
              </div>
            </div>
          </div>
        ))}
        {tasks.length === 0 && (
          <div className="h-24 flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-zinc-800 rounded-xl">
            <p className="text-sm text-slate-400">Drop here</p>
          </div>
        )}
      </div>
    </div>
  );
}

function getCategoryColor(cat) {
  switch(cat) {
    case 'Work': return 'border-l-blue-500';
    case 'Learning': return 'border-l-indigo-500';
    case 'Workout': return 'border-l-orange-500';
    case 'Personal': return 'border-l-emerald-500';
    default: return 'border-l-slate-500';
  }
}
