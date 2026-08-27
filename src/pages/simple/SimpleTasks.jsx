import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { simpleLifeService } from '../../services/simpleLifeService';
import { useAuthStore } from '../../store/useAuthStore';
import { Card } from '../../components/Card';
import { Modal } from '../../components/Modal';
import { 
  Plus, Loader2, Trash, CheckCircle2, Circle, AlertTriangle, 
  Calendar, Clock, CheckSquare, Target, ChevronRight, Home, Edit2
} from 'lucide-react';
import Swal from 'sweetalert2';

// Date formatters
const formatDate = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getFormatTime = (time) => {
  if (!time) return '';
  const [h, m] = time.split(':');
  let hh = parseInt(h);
  const ampm = hh >= 12 ? 'PM' : 'AM';
  hh = hh % 12 || 12;
  return `${hh}:${m} ${ampm}`;
};

const categories = ['Work', 'Home', 'Money', 'Learning', 'Health', 'Travel', 'Personal', 'Other'];
const priorities = [{id: 'high', label: '🔴 High'}, {id: 'medium', label: '🟡 Medium'}, {id: 'low', label: '🟢 Low'}];

export default function SimpleTasks() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  
  // State
  const [now, setNow] = useState(new Date());
  const [quickTitle, setQuickTitle] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [catFilter, setCatFilter] = useState('All');
  const [selectedTask, setSelectedTask] = useState(null);

  // Time updater
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const todayStr = formatDate(now);
  const tomorrowStr = formatDate(new Date(now.getTime() + 86400000));

  // Queries
  const { data: rawTasks, isLoading: tLoad } = useQuery({
    queryKey: ['simple-tasks', user?.id],
    queryFn: () => simpleLifeService.getTasks(user?.id),
    enabled: !!user?.id
  });

  const { data: shifts } = useQuery({
    queryKey: ['simple-shifts', user?.id],
    queryFn: () => simpleLifeService.getShifts(user?.id),
    enabled: !!user?.id
  });

  const { data: visits } = useQuery({
    queryKey: ['simple-visits', user?.id],
    queryFn: () => simpleLifeService.getHomeVisits(user?.id),
    enabled: !!user?.id
  });

  // Mutations
  const addMut = useMutation({
    mutationFn: (d) => simpleLifeService.addTask(user?.id, d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simple-tasks'] });
      setQuickTitle('');
    }
  });

  const updMut = useMutation({
    mutationFn: ({id, updates}) => simpleLifeService.updateTask(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simple-tasks'] });
      setSelectedTask(null);
    }
  });

  const statusMut = useMutation({
    mutationFn: ({id, completed}) => simpleLifeService.updateTaskStatus(id, completed),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['simple-tasks'] })
  });

  const delMut = useMutation({
    mutationFn: (id) => simpleLifeService.deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simple-tasks'] });
      setSelectedTask(null);
    }
  });

  // Helper to parse dates
  const isOverdue = (t) => {
    if (t.completed) return false;
    if (!t.due_date) return false;
    if (t.due_date < todayStr) return true;
    if (t.due_date === todayStr && t.due_time) {
      const [h, m] = t.due_time.split(':').map(Number);
      const dt = new Date(now);
      dt.setHours(h, m, 0, 0);
      if (dt < now) return true;
    }
    return false;
  };

  // Data processing
  const d = useMemo(() => {
    if (!rawTasks) return { all: [], overdue: [], today: [], upcoming: [], completed: [], todayProgress: 0, nextBest: null, stats: {}, todayShift: null, nextVisit: null };

    const sortedShifts = shifts ? [...shifts].sort((a, b) => new Date(a.date) - new Date(b.date)) : [];
    const todayShift = sortedShifts.find(s => s.date === todayStr);

    let tasks = rawTasks.map(t => ({ ...t, isOverdue: isOverdue(t) }));
    
    // Apply Category Filter early to all categories
    if (catFilter !== 'All') {
      tasks = tasks.filter(t => t.category === catFilter);
    }

    const overdue = tasks.filter(t => t.isOverdue && !t.completed);
    
    const today = tasks.filter(t => !t.completed && (
      t.due_date === todayStr || (!t.due_date && !t.isOverdue) // Tasks without a due date are considered "today" in inbox mode
    ));
    
    const upcoming = tasks.filter(t => !t.completed && t.due_date > todayStr);
    
    const completed = tasks.filter(t => t.completed);

    // Today Progress calculation
    // "Total today" = all tasks originally due today + overdue + done today
    const doneToday = completed.filter(t => t.completed_at && t.completed_at.startsWith(todayStr));
    const totalTodayRequired = overdue.length + today.length + doneToday.length;
    const todayProgress = totalTodayRequired > 0 ? Math.round((doneToday.length / totalTodayRequired) * 100) : 0;

    // Next Best Task
    let nextBest = null;
    const candidates = [...overdue, ...today].sort((a, b) => {
      // Prioritize High > Medium > Low
      const pmap = { high: 1, medium: 2, low: 3 };
      if (pmap[a.priority] !== pmap[b.priority]) return pmap[a.priority] - pmap[b.priority];
      // Prioritize by time
      if (a.due_time && !b.due_time) return -1;
      if (!a.due_time && b.due_time) return 1;
      if (a.due_time && b.due_time) return a.due_time.localeCompare(b.due_time);
      return 0;
    });
    if (candidates.length > 0) nextBest = candidates[0];

    // Weekly stats
    const startOfWeek = new Date(now);
    const dayOfWeek = now.getDay() || 7;
    startOfWeek.setDate(now.getDate() - dayOfWeek + 1);
    const startStr = formatDate(startOfWeek);
    
    const createdThisWeek = rawTasks.filter(t => t.created_at >= startStr);
    const completedThisWeek = rawTasks.filter(t => t.completed_at && t.completed_at >= startStr);
    const cRate = createdThisWeek.length > 0 ? Math.round((completedThisWeek.length / createdThisWeek.length) * 100) : 0;
    const stats = {
      created: createdThisWeek.length,
      completed: completedThisWeek.length,
      rate: cRate,
      overdueTotal: overdue.length
    };

    const nextVisit = visits ? visits.find(v => v.departure >= todayStr) : null;

    return { all: tasks, overdue, today, upcoming, completed, todayProgress, doneToday, totalTodayRequired, nextBest, stats, todayShift, nextVisit };
  }, [rawTasks, shifts, visits, now, catFilter, todayStr]);

  const handleQuickAdd = (e) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;
    addMut.mutate({ title: quickTitle, due_date: todayStr });
  };

  const getPriorityIcon = (p) => {
    if (p === 'high') return '🔴';
    if (p === 'low') return '🟢';
    return '🟡';
  };

  const checkShiftConflict = (task) => {
    if (!task.due_time || !d.todayShift || d.todayShift.shift_type === 'Off') return null;
    if (task.due_date !== d.todayShift.date) return null;
    const [th, tm] = task.due_time.split(':').map(Number);
    const [sh, sm] = d.todayShift.start_time.split(':').map(Number);
    const [eh, em] = d.todayShift.end_time.split(':').map(Number);
    
    const tMins = th * 60 + tm;
    let sMins = sh * 60 + sm;
    let eMins = eh * 60 + em;
    
    // overnight shift
    if (eMins < sMins) eMins += 24 * 60;
    
    // adjust task if it falls in overnight range (e.g. 1 AM)
    let checkMins = tMins;
    if (eMins > 24 * 60 && tMins < sMins) checkMins += 24 * 60;
    
    if (checkMins >= sMins && checkMins <= eMins) {
      return d.todayShift;
    }
    return null;
  };

  const renderTask = (t) => {
    const isCompleted = t.completed;
    const conflict = checkShiftConflict(t);

    return (
      <div key={t.id} className="group relative flex flex-col p-4 bg-white dark:bg-zinc-900/90 backdrop-blur-sm border-b border-slate-100 dark:border-zinc-800 last:border-0 hover:bg-slate-50 dark:hover:bg-zinc-800/50/50 transition-colors">
        
        {conflict && !isCompleted && (
          <div className="flex items-center justify-between bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-500 text-xs font-bold p-2 rounded-lg mb-2">
            <span className="flex items-center gap-1"><AlertTriangle size={12}/> SCHEDULE CONFLICT with {conflict.shift_type} Shift</span>
            <button onClick={() => setSelectedTask(t)} className="underline hover:text-amber-600">RESCHEDULE</button>
          </div>
        )}

        <div className="flex items-start gap-3 w-full">
          <button 
            onClick={() => statusMut.mutate({ id: t.id, completed: !isCompleted })}
            className={`mt-1 flex-shrink-0 transition-colors ${isCompleted ? 'text-indigo-500' : 'text-slate-300 hover:text-indigo-500'}`}
          >
            {isCompleted ? <CheckCircle2 size={22}/> : <Circle size={22}/>}
          </button>
          
          <div className="flex-1 min-w-0" onClick={() => setSelectedTask(t)}>
            <div className="flex justify-between items-start cursor-pointer">
              <p className={`font-bold text-[15px] truncate ${isCompleted ? 'text-slate-400 line-through' : 'text-slate-800 dark:text-zinc-50'}`}>
                {t.title} <span className="ml-1 text-xs">{getPriorityIcon(t.priority)}</span>
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs font-medium text-slate-500 dark:text-zinc-400">
              <span className="flex items-center gap-1 bg-slate-100 dark:bg-zinc-800/60 px-2 py-0.5 rounded text-slate-600 dark:text-zinc-300">
                {t.category === 'Work' && '💼'}
                {t.category === 'Home' && '🏠'}
                {t.category === 'Money' && '💰'}
                {t.category === 'Learning' && '📚'}
                {t.category === 'Health' && '🏋'}
                {t.category === 'Travel' && '🚗'}
                {t.category === 'Personal' && '👨‍👩‍👧'}
                {t.category}
              </span>
              
              {t.due_date && (
                <span className={t.isOverdue && !isCompleted ? 'text-red-500 font-bold' : ''}>
                  {t.due_date === todayStr ? 'Today' : t.due_date === tomorrowStr ? 'Tomorrow' : t.due_date}
                  {t.due_time && ` · ${getFormatTime(t.due_time)}`}
                </span>
              )}

              {isCompleted && t.completed_at && (
                <span>Done at {getFormatTime(t.completed_at.split('T')[1]?.substring(0,5))}</span>
              )}
            </div>
          </div>

          <button onClick={() => setSelectedTask(t)} className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-indigo-600 transition-opacity">
            <Edit2 size={16}/>
          </button>
        </div>
      </div>
    );
  };

  if (tLoad) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-indigo-500" size={32} /></div>;

  // Render logic for main list based on filters
  let sections = [];
  if (activeFilter === 'Completed') {
    sections = [{ title: 'COMPLETED', tasks: d.completed }];
  } else if (activeFilter === 'Today') {
    sections = [{ title: 'TODAY', tasks: d.today }];
  } else if (activeFilter === 'Upcoming') {
    sections = [{ title: 'UPCOMING', tasks: d.upcoming }];
  } else if (activeFilter === 'Overdue') {
    sections = [{ title: 'OVERDUE', tasks: d.overdue }];
  } else {
    // All
    if (d.overdue.length > 0) sections.push({ title: `⚠️ OVERDUE · ${d.overdue.length}`, tasks: d.overdue, isOverdue: true });
    sections.push({ title: `TODAY · ${d.today.length}`, tasks: d.today });
    if (d.upcoming.length > 0) sections.push({ title: 'UPCOMING', tasks: d.upcoming });
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-zinc-50">Tasks</h2>
          <p className="text-slate-500">{now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
      </header>

      {/* Today Overview */}
      <Card className="border-none shadow-xl bg-gradient-to-br from-indigo-700 to-purple-800 text-white p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <CheckSquare size={120} />
        </div>
        <div className="relative z-10">
          <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-200 mb-1">TODAY</h3>
          <p className="text-3xl font-black mb-4">
            {d.today.length} remaining <span className="text-indigo-300 text-lg font-bold ml-2">· {d.doneToday.length} completed</span>
          </p>
          <div className="w-full h-3 rounded-full bg-black/20 overflow-hidden">
            <div className="h-full bg-white transition-all duration-1000 ease-out" style={{ width: `${d.todayProgress}%` }}></div>
          </div>
          <p className="text-xs font-bold text-indigo-200 mt-2">{d.todayProgress}% complete</p>
        </div>
      </Card>

      {/* Quick Add */}
      <form onSubmit={handleQuickAdd} className="relative shadow-sm rounded-xl overflow-hidden border border-slate-200 dark:border-zinc-800">
        <input 
          type="text" 
          placeholder="What needs to be done?" 
          value={quickTitle}
          onChange={e => setQuickTitle(e.target.value)}
          className="w-full bg-white dark:bg-zinc-900/90 backdrop-blur-sm p-4 pr-12 outline-none font-medium text-slate-800 dark:text-zinc-50 placeholder:text-slate-400"
        />
        <button type="submit" disabled={!quickTitle.trim()} className="absolute right-2 top-2 bottom-2 w-10 flex justify-center items-center bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg disabled:opacity-50">
          <Plus size={20}/>
        </button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main List */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {['All', 'Today', 'Upcoming', 'Overdue', 'Completed'].map(f => (
                <button key={f} onClick={() => setActiveFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${activeFilter === f ? 'bg-slate-800 dark:bg-[#6366F1] text-white dark:text-zinc-50' : 'bg-white dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-300'}`}
              >
                {f}
              </button>
            ))}
            
            <select 
              value={catFilter} 
              onChange={e => setCatFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-300 outline-none"
            >
              <option value="All">All Categories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="bg-white dark:bg-zinc-900/90 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200 dark:border-zinc-800 overflow-hidden">
            {sections.map((sec, idx) => (
              <div key={idx}>
                {sec.tasks.length > 0 && (
                  <div className={`px-4 py-2 text-xs font-bold tracking-widest ${sec.isOverdue ? 'bg-red-50 dark:bg-red-900/20 text-red-600' : 'bg-slate-50 dark:bg-zinc-800/60 text-slate-500'}`}>
                    {sec.title}
                  </div>
                )}
                <div className="flex flex-col">
                  {sec.tasks.map(t => renderTask(t))}
                </div>
              </div>
            ))}

            {d.all.length === 0 && (
              <div className="p-10 text-center">
                <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4"><CheckSquare size={32}/></div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-zinc-50 mb-2">🎯 NOTHING PENDING</h3>
                <p className="text-slate-500">You're all caught up! Add something you need to get done.</p>
              </div>
            )}
            
            {d.all.length > 0 && sections.every(s => s.tasks.length === 0) && (
              <div className="p-10 text-center">
                <h3 className="text-lg font-bold text-slate-800 dark:text-zinc-50 mb-2">✨ NO TASKS HERE</h3>
                <p className="text-slate-500">Try changing your filters.</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Widgets */}
        <div className="space-y-6">
          
          {d.nextBest && (
            <Card className="border border-indigo-200 dark:border-zinc-800 bg-indigo-50 dark:bg-zinc-900/90 backdrop-blur-sm p-5">
              <h3 className="text-xs font-bold tracking-widest uppercase text-indigo-600 mb-3 flex items-center gap-1"><Target size={14}/> NEXT BEST TASK</h3>
              <p className="font-bold text-slate-800 dark:text-zinc-50 text-lg mb-1 leading-tight">{getPriorityIcon(d.nextBest.priority)} {d.nextBest.title}</p>
              <p className="text-xs text-indigo-700 dark:text-indigo-400 font-medium">{d.nextBest.category} {d.nextBest.isOverdue && ' · Overdue'}</p>
              <button 
                onClick={() => statusMut.mutate({ id: d.nextBest.id, completed: true })}
                className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-lg transition-colors"
              >
                MARK COMPLETE
              </button>
            </Card>
          )}

          {d.nextVisit && (
            <Card className="border border-amber-200 dark:border-zinc-800 bg-amber-50 dark:bg-zinc-900/90 backdrop-blur-sm p-5 shadow-sm">
              <h3 className="font-bold text-amber-800 dark:text-amber-500 uppercase text-xs tracking-wider mb-2 flex items-center gap-2"><Home size={14}/> HOME VISIT · {Math.ceil((new Date(d.nextVisit.departure) - now) / 86400000)} DAYS</h3>
              <div className="space-y-2 mt-3">
                <button onClick={() => { setQuickTitle('Pack bags'); addMut.mutate({ title: 'Pack bags', due_date: todayStr, category: 'Home', home_visit_id: d.nextVisit.id }); }} className="w-full text-left text-sm font-medium text-amber-700 bg-white/50 dark:bg-zinc-950/40 p-2 rounded flex gap-2"><Plus size={16}/> Pack clothes</button>
                <button onClick={() => { setQuickTitle('Book tickets'); addMut.mutate({ title: 'Book tickets', due_date: todayStr, category: 'Travel', home_visit_id: d.nextVisit.id }); }} className="w-full text-left text-sm font-medium text-amber-700 bg-white/50 dark:bg-zinc-950/40 p-2 rounded flex gap-2"><Plus size={16}/> Book train ticket</button>
              </div>
            </Card>
          )}

          <Card className="border-none shadow-sm">
            <h3 className="font-bold text-slate-800 dark:text-zinc-50 uppercase text-xs tracking-wider mb-4">THIS WEEK</h3>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-2xl font-black text-slate-800 dark:text-zinc-50">{d.stats.completed}</p>
                <p className="text-xs font-bold text-slate-500">COMPLETED</p>
              </div>
              <div>
                <p className="text-2xl font-black text-slate-800 dark:text-zinc-50">{d.stats.created}</p>
                <p className="text-xs font-bold text-slate-500">CREATED</p>
              </div>
              <div>
                <p className="text-2xl font-black text-slate-800 dark:text-zinc-50">{d.stats.rate}%</p>
                <p className="text-xs font-bold text-slate-500">COMPLETION</p>
              </div>
              <div>
                <p className={`text-2xl font-black ${d.stats.overdueTotal > 0 ? 'text-red-500' : 'text-emerald-500'}`}>{d.stats.overdueTotal}</p>
                <p className="text-xs font-bold text-slate-500">OVERDUE</p>
              </div>
            </div>
          </Card>

        </div>
      </div>

      {/* Task Details Modal */}
      {selectedTask && (
        <Modal isOpen={!!selectedTask} onClose={() => setSelectedTask(null)} title="Task Details">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Title</label>
              <input 
                type="text" 
                value={selectedTask.title} 
                onChange={e => setSelectedTask({...selectedTask, title: e.target.value})}
                className="w-full border border-slate-200 dark:border-zinc-800 rounded-lg p-2 font-bold bg-white dark:bg-zinc-900/90 backdrop-blur-sm min-h-[44px]" 
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Category</label>
                <select 
                  value={selectedTask.category} 
                  onChange={e => setSelectedTask({...selectedTask, category: e.target.value})}
                  className="w-full border border-slate-200 dark:border-zinc-800 rounded-lg p-2 bg-white dark:bg-zinc-900/90 backdrop-blur-sm min-h-[44px]"
                >
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Priority</label>
                <select 
                  value={selectedTask.priority} 
                  onChange={e => setSelectedTask({...selectedTask, priority: e.target.value})}
                  className="w-full border border-slate-200 dark:border-zinc-800 rounded-lg p-2 bg-white dark:bg-zinc-900/90 backdrop-blur-sm min-h-[44px]"
                >
                  {priorities.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Due Date</label>
                <input 
                  type="date" 
                  value={selectedTask.due_date || ''} 
                  onChange={e => setSelectedTask({...selectedTask, due_date: e.target.value})}
                  className="w-full border border-slate-200 dark:border-zinc-800 rounded-lg p-2 bg-white dark:bg-zinc-900/90 backdrop-blur-sm text-sm min-h-[44px]" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Time</label>
                <input 
                  type="time" 
                  value={selectedTask.due_time || ''} 
                  onChange={e => setSelectedTask({...selectedTask, due_time: e.target.value})}
                  className="w-full border border-slate-200 dark:border-zinc-800 rounded-lg p-2 bg-white dark:bg-zinc-900/90 backdrop-blur-sm text-sm min-h-[44px]" 
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Notes</label>
              <textarea 
                value={selectedTask.description || ''} 
                onChange={e => setSelectedTask({...selectedTask, description: e.target.value})}
                rows={3}
                placeholder="Optional notes..."
                className="w-full border border-slate-200 dark:border-zinc-800 rounded-lg p-2 bg-white dark:bg-zinc-900/90 backdrop-blur-sm text-sm min-h-[44px]" 
              />
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-zinc-800">
              <button 
                onClick={() => updMut.mutate({ id: selectedTask.id, updates: { 
                  title: selectedTask.title, category: selectedTask.category, priority: selectedTask.priority, 
                  due_date: selectedTask.due_date || null, due_time: selectedTask.due_time || null, description: selectedTask.description || null
                }})} 
                className="flex-1 bg-indigo-600 text-white font-bold py-3 rounded-lg"
              >
                SAVE
              </button>
              <button 
                onClick={() => {
                  Swal.fire({
                    title: 'Delete task?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33',
                    confirmButtonText: 'Delete'
                  }).then((result) => { if (result.isConfirmed) delMut.mutate(selectedTask.id); });
                }} 
                className="px-4 border border-red-200 text-red-500 font-bold rounded-lg hover:bg-red-50"
              >
                <Trash size={18}/>
              </button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
}
