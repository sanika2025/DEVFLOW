import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { simpleLifeService } from '../../services/simpleLifeService';
import { useAuthStore } from '../../store/useAuthStore';
import { Card } from '../../components/Card';
import { Modal } from '../../components/Modal';
import { 
  Plus, Loader2, Trash, CheckCircle2, Circle, 
  Sun, Moon, Coffee, Target, Play, ChevronRight, Home, CheckSquare, Edit2, Zap
} from 'lucide-react';
import Swal from 'sweetalert2';

// Helper to format Date to YYYY-MM-DD
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

export default function SimpleRoutines() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  
  // State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isTemplateOpen, setIsTemplateOpen] = useState(false);
  const [now, setNow] = useState(new Date());

  // Form
  const [form, setForm] = useState({
    title: '', category: 'Health', start_time: '08:00', end_time: '08:30', 
    shift_type: 'All', days: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
  });

  // Time updater for dynamic progress/next up
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const todayStr = formatDate(now);
  const currentDayName = now.toLocaleDateString('en-GB', { weekday: 'short' });

  // Queries
  const { data: routines, isLoading: rLoad } = useQuery({
    queryKey: ['simple-routines', user?.id],
    queryFn: () => simpleLifeService.getRoutines(user?.id),
    enabled: !!user?.id
  });

  const { data: completions, isLoading: cLoad } = useQuery({
    queryKey: ['simple-routine-completions', user?.id],
    queryFn: () => {
      // Get completions for the last 30 days
      const d = new Date(now);
      d.setDate(d.getDate() - 30);
      return simpleLifeService.getRoutineCompletions(user?.id, formatDate(d), null);
    },
    enabled: !!user?.id
  });

  const { data: shifts } = useQuery({
    queryKey: ['simple-shifts', user?.id],
    queryFn: () => simpleLifeService.getShifts(user?.id),
    enabled: !!user?.id
  });

  const { data: tasks } = useQuery({
    queryKey: ['simple-tasks', user?.id],
    queryFn: () => simpleLifeService.getTasks(user?.id),
    enabled: !!user?.id
  });

  const { data: homeVisits } = useQuery({
    queryKey: ['simple-visits', user?.id],
    queryFn: () => simpleLifeService.getHomeVisits(user?.id),
    enabled: !!user?.id
  });

  // Mutations
  const addMut = useMutation({
    mutationFn: (d) => simpleLifeService.addRoutine(user?.id, d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simple-routines'] });
      setIsAddOpen(false);
      setForm({ title: '', category: 'Health', start_time: '08:00', end_time: '08:30', shift_type: 'All', days: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'] });
      Swal.fire({ icon: 'success', title: 'Routine Added', timer: 1000, showConfirmButton: false });
    }
  });

  const addBulkMut = useMutation({
    mutationFn: (arr) => simpleLifeService.addMultipleRoutines(arr),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simple-routines'] });
      setIsTemplateOpen(false);
      Swal.fire({ icon: 'success', title: 'Template Applied', timer: 1000, showConfirmButton: false });
    }
  });

  const delMut = useMutation({
    mutationFn: (id) => simpleLifeService.deleteRoutine(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['simple-routines'] })
  });

  const completeMut = useMutation({
    mutationFn: (d) => simpleLifeService.logRoutineCompletion(user?.id, d),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['simple-routine-completions'] })
  });

  // Derived Data
  const d = useMemo(() => {
    if (!routines || !completions) return { todayRoutine: [], nextUp: null, stats: {}, streaks: {}, weekly: [], todayShift: null, progress: 0, pendingTasks: [], upcomingVisit: null };

    const sortedShifts = shifts ? [...shifts].sort((a, b) => new Date(a.date) - new Date(b.date)) : [];
    const todayShift = sortedShifts.find(s => s.date === todayStr) || { date: todayStr, shift_type: 'Off' };

    // 1. Filter routines for TODAY
    let todayRoutines = routines.filter(r => {
      if (!r.enabled) return false;
      if (r.days && r.days.length > 0 && !r.days.includes(currentDayName)) return false;
      if (r.shift_type && r.shift_type !== 'All' && r.shift_type !== todayShift.shift_type) return false;
      return true;
    });

    // 2. Map completion status
    todayRoutines = todayRoutines.map(r => {
      const completion = completions.find(c => c.routine_id === r.id && c.date === todayStr);
      let status = 'pending';
      if (completion) {
        status = completion.status; // 'completed' or 'skipped'
      } else {
        // If not completed yet, check if time has passed
        const [h, m] = r.start_time.split(':').map(Number);
        const rTime = new Date(now);
        rTime.setHours(h, m, 0, 0);
        // Give 1 hour buffer before considering it missed
        rTime.setHours(rTime.getHours() + 1);
        if (now > rTime) status = 'missed';
      }
      return { ...r, status, completion };
    }).sort((a, b) => a.start_time.localeCompare(b.start_time));

    // 3. Progress
    const completedCount = todayRoutines.filter(r => r.status === 'completed').length;
    const progress = todayRoutines.length > 0 ? Math.round((completedCount / todayRoutines.length) * 100) : 0;

    // 4. Next Up
    const nextUp = todayRoutines.find(r => r.status === 'pending' || r.status === 'missed');
    if (nextUp && nextUp.status !== 'missed') {
      const [h, m] = nextUp.start_time.split(':').map(Number);
      const nt = new Date(now);
      nt.setHours(h, m, 0, 0);
      if (nt > now) {
        const diff = nt - now;
        nextUp.startsIn = Math.floor(diff / 60000); // mins
      }
    }

    // 5. Streaks & Habits
    const streaks = {};
    routines.forEach(r => {
      // Calculate current streak by walking backward from yesterday
      let streak = 0;
      let checkDate = new Date(now);
      checkDate.setDate(checkDate.getDate() - 1); // start from yesterday
      
      while(true) {
        const checkStr = formatDate(checkDate);
        // Only count if it was required on that day (simulate by checking days array and maybe shift, though shift history is complex)
        // Simplification: just check if there's a 'completed' record
        const comp = completions.find(c => c.routine_id === r.id && c.date === checkStr);
        if (comp && comp.status === 'completed') {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          // Check if it was required yesterday. If it wasn't required, skip the day and continue streak.
          // Simplification: if no record, break streak
          break;
        }
      }
      streaks[r.id] = streak;
    });

    // 6. Weekly Overview
    const weekly = [];
    const startOfWeek = new Date(now);
    const dayOfWeek = now.getDay() || 7;
    startOfWeek.setDate(now.getDate() - dayOfWeek + 1);
    
    for(let i=0; i<7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(date.getDate() + i);
      const ds = formatDate(date);
      
      // Calculate % for that day
      const dayCompletions = completions.filter(c => c.date === ds && c.status === 'completed').length;
      // We don't exactly know how many were *required* on past days easily without complex logic, 
      // but we can just map simple dots based on any completion
      weekly.push({
        date: ds,
        dayName: date.toLocaleDateString('en-GB', { weekday: 'short' }).charAt(0),
        hasAny: dayCompletions > 0,
        isToday: ds === todayStr
      });
    }

    // 7. Stats for this week
    const thisWeekComps = completions.filter(c => c.date >= formatDate(startOfWeek) && c.status === 'completed');
    const stats = {
      completed: thisWeekComps.length,
      bestDay: ''
    };

    // 8. Tasks
    const pendingTasks = tasks ? tasks.filter(t => !t.completed).slice(0, 3) : [];

    // 9. Home Visit Conflict
    const upcomingVisit = homeVisits ? homeVisits.find(v => v.departure >= todayStr || (v.return && v.return >= todayStr)) : null;

    return { todayRoutine: todayRoutines, nextUp, progress, completedCount, streaks, weekly, stats, todayShift, pendingTasks, upcomingVisit };
  }, [routines, completions, shifts, tasks, homeVisits, now, todayStr, currentDayName]);

  const toggleDay = (day) => {
    if (form.days.includes(day)) setForm({...form, days: form.days.filter(d => d !== day)});
    else setForm({...form, days: [...form.days, day]});
  };

  const applyTemplate = (type) => {
    const defaultDays = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    let toAdd = [];
    if (type === 'Morning') {
      toAdd = [
        { user_id: user.id, title: 'Wake Up & Hydrate', start_time: '06:00', end_time: '06:15', category: 'Health', shift_type: 'Morning', days: defaultDays },
        { user_id: user.id, title: 'Stretch / Exercise', start_time: '06:15', end_time: '06:45', category: 'Health', shift_type: 'Morning', days: defaultDays },
        { user_id: user.id, title: 'Breakfast', start_time: '06:45', end_time: '07:15', category: 'Food', shift_type: 'Morning', days: defaultDays },
      ];
    } else if (type === 'Night') {
      toAdd = [
        { user_id: user.id, title: 'Wake Up & Lunch', start_time: '14:00', end_time: '15:00', category: 'Food', shift_type: 'Night', days: defaultDays },
        { user_id: user.id, title: 'Workout', start_time: '17:00', end_time: '18:00', category: 'Health', shift_type: 'Night', days: defaultDays },
        { user_id: user.id, title: 'Prepare for Work', start_time: '20:30', end_time: '21:00', category: 'Work', shift_type: 'Night', days: defaultDays },
      ];
    } else if (type === 'Day Off') {
      toAdd = [
        { user_id: user.id, title: 'Morning Exercise', start_time: '08:30', end_time: '09:30', category: 'Health', shift_type: 'Off', days: defaultDays },
        { user_id: user.id, title: 'Personal Project / Learning', start_time: '10:00', end_time: '12:00', category: 'Learning', shift_type: 'Off', days: defaultDays },
        { user_id: user.id, title: 'Family Time', start_time: '18:00', end_time: '21:00', category: 'Family', shift_type: 'Off', days: defaultDays },
      ];
    }
    if (toAdd.length > 0) addBulkMut.mutate(toAdd);
  };

  if (rLoad || cLoad) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-blue-500" size={32} /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-zinc-50">Routines</h2>
          <p className="text-slate-500">{now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        <button onClick={() => setIsAddOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white p-2 md:px-6 md:py-2 rounded-xl font-bold shadow-md transition-colors flex items-center gap-2">
          <Plus size={18} /> <span className="hidden md:inline">ADD ROUTINE</span>
        </button>
      </header>

      {/* Main Shift Header & Progress */}
      <Card className={`${d.todayShift?.shift_type === 'Off' ? 'bg-slate-50 dark:bg-zinc-900/90 backdrop-blur-sm border border-slate-200 dark:border-zinc-800' : 'bg-gradient-to-br from-blue-600 to-indigo-800 dark:bg-zinc-900/90 backdrop-blur-sm dark:border-zinc-800 text-white'} border-none shadow-xl`}>
        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className={`p-4 rounded-2xl ${d.todayShift?.shift_type === 'Off' ? 'bg-slate-200 dark:bg-slate-700 text-slate-500' : 'bg-white/20 text-white backdrop-blur-sm'}`}>
              {d.todayShift?.shift_type === 'Off' ? <Coffee size={32}/> : d.todayShift?.shift_type === 'Night' ? <Moon size={32}/> : <Sun size={32}/>}
            </div>
            <div>
              <p className={`text-xs font-bold tracking-widest uppercase mb-1 ${d.todayShift?.shift_type === 'Off' ? 'text-slate-500' : 'text-blue-200'}`}>
                {d.todayShift?.shift_type === 'Off' ? 'DAY OFF' : 'TODAY\'S WORK SHIFT'}
              </p>
              <h3 className={`text-2xl font-black ${d.todayShift?.shift_type === 'Off' ? 'text-slate-800 dark:text-zinc-50' : 'text-white'}`}>
                {d.todayShift?.shift_type === 'Off' ? 'No work scheduled today.' : `${d.todayShift?.shift_type.toUpperCase()} SHIFT`}
              </h3>
              {d.todayShift?.shift_type !== 'Off' && d.todayShift?.start_time && (
                <p className="font-medium opacity-90 mt-1">{getFormatTime(d.todayShift.start_time)} → {getFormatTime(d.todayShift.end_time)}</p>
              )}
            </div>
          </div>

          <div className={`mt-6 pt-6 border-t ${d.todayShift?.shift_type === 'Off' ? 'border-slate-200 dark:border-zinc-800' : 'border-white/20'}`}>
            <div className="flex justify-between items-center mb-2">
              <span className={`text-sm font-bold uppercase tracking-wider ${d.todayShift?.shift_type === 'Off' ? 'text-slate-500' : 'text-blue-100'}`}>Today's Routine Progress</span>
              <span className={`font-black text-xl ${d.todayShift?.shift_type === 'Off' ? 'text-slate-800 dark:text-zinc-50' : 'text-white'}`}>{d.progress}%</span>
            </div>
            <div className={`w-full h-3 rounded-full overflow-hidden ${d.todayShift?.shift_type === 'Off' ? 'bg-slate-200 dark:bg-slate-700' : 'bg-black/30'}`}>
              <div 
                className={`h-full ${d.todayShift?.shift_type === 'Off' ? 'bg-blue-500' : 'bg-white'} transition-all duration-1000 ease-out`} 
                style={{ width: `${d.progress}%` }}
              ></div>
            </div>
            <p className={`text-xs font-medium mt-2 ${d.todayShift?.shift_type === 'Off' ? 'text-slate-500' : 'text-blue-200'}`}>{d.completedCount} of {d.todayRoutine.length} completed</p>
          </div>
        </div>
      </Card>

      {routines?.length === 0 ? (
        <Card className="p-8 text-center border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/90 backdrop-blur-sm">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4"><Target size={32}/></div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-zinc-50 mb-2">BUILD YOUR DAILY ROUTINE</h3>
          <p className="text-slate-500 mb-6 max-w-sm mx-auto">Create habits and routines designed around your actual work schedule.</p>
          <div className="flex flex-col gap-3 max-w-xs mx-auto">
            <button onClick={() => setIsAddOpen(true)} className="bg-blue-600 text-white py-3 rounded-xl font-bold">+ ADD ROUTINE</button>
            <button onClick={() => setIsTemplateOpen(true)} className="bg-white border border-slate-200 text-slate-700 py-3 rounded-xl font-bold">BROWSE TEMPLATES</button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Column: Timeline & Next Up */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Next Up */}
            {d.nextUp && (
              <Card className="border border-blue-200 dark:border-zinc-800 bg-blue-50 dark:bg-zinc-900/90 backdrop-blur-sm flex justify-between items-center p-4 md:p-6">
                <div>
                  <p className="text-xs font-bold tracking-widest text-blue-600 dark:text-blue-400 uppercase mb-2 flex items-center gap-2"><Play size={14}/> NEXT UP</p>
                  <h4 className="text-xl font-black text-slate-800 dark:text-zinc-50 flex items-center gap-2">
                    {d.nextUp.title}
                  </h4>
                  <p className="text-blue-700 dark:text-blue-300 font-medium mt-1">
                    {getFormatTime(d.nextUp.start_time)} 
                    {d.nextUp.startsIn !== undefined && ` • Starts in ${d.nextUp.startsIn} min`}
                  </p>
                </div>
                <button 
                  onClick={() => completeMut.mutate({ routine_id: d.nextUp.id, date: todayStr, status: 'completed' })}
                  className="w-12 h-12 rounded-full bg-white dark:bg-zinc-800/60 shadow-md flex items-center justify-center text-slate-300 hover:text-emerald-500 hover:scale-110 transition-all border border-slate-100 dark:border-zinc-800"
                >
                  <CheckCircle2 size={28} />
                </button>
              </Card>
            )}

            {/* Timeline */}
            <Card className="border-none shadow-sm">
              <h3 className="font-bold text-slate-800 dark:text-zinc-50 uppercase text-sm tracking-wider mb-6">TODAY'S ROUTINE</h3>
              
              <div className="space-y-0 relative">
                <div className="absolute left-[31px] top-4 bottom-4 w-px bg-slate-200 dark:bg-zinc-800/60"></div>
                
                {d.todayRoutine.map((r, i) => {
                  const isCompleted = r.status === 'completed';
                  const isMissed = r.status === 'missed';
                  const isSkipped = r.status === 'skipped';
                  
                  return (
                    <div key={r.id} className="relative flex items-start gap-4 py-3 group hover:bg-slate-50 dark:hover:bg-zinc-800/30 -mx-4 px-4 rounded-xl transition-colors">
                      <div className="bg-white dark:bg-zinc-900/90 backdrop-blur-sm relative z-10 p-1">
                        <button 
                          onClick={() => completeMut.mutate({ routine_id: r.id, date: todayStr, status: isCompleted ? 'skipped' : 'completed' })}
                          className={`rounded-full transition-colors ${isCompleted ? 'text-emerald-500' : isSkipped ? 'text-slate-300' : isMissed ? 'text-red-400' : 'text-slate-300 hover:text-blue-500'}`}
                        >
                          {isCompleted ? <CheckCircle2 size={24}/> : <Circle size={24}/>}
                        </button>
                      </div>
                      
                      <div className="flex-1 min-w-0 pt-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className={`font-bold ${isCompleted || isSkipped ? 'text-slate-400 line-through' : 'text-slate-800 dark:text-zinc-50'}`}>{r.title}</p>
                            <p className="text-xs font-medium text-slate-500 mt-0.5">{getFormatTime(r.start_time)}</p>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {isMissed && !isCompleted && !isSkipped && (
                              <div className="flex gap-2">
                                <button onClick={() => completeMut.mutate({ routine_id: r.id, date: todayStr, status: 'completed' })} className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">Mark Done</button>
                                <button onClick={() => completeMut.mutate({ routine_id: r.id, date: todayStr, status: 'skipped' })} className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">Skip</button>
                              </div>
                            )}
                            <button onClick={() => delMut.mutate(r.id)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 p-1"><Trash size={14}/></button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {d.todayRoutine.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-slate-500 italic">No routines scheduled for {d.todayShift?.shift_type === 'Off' ? 'your day off' : 'today\'s shift'}.</p>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Sidebar Widgets */}
          <div className="space-y-6">
            
            {/* Weekly Strip */}
            <Card className="border-none shadow-sm">
              <h3 className="font-bold text-slate-800 dark:text-zinc-50 uppercase text-sm tracking-wider mb-4">THIS WEEK</h3>
              <div className="flex justify-between">
                {d.weekly.map((w, i) => (
                  <div key={i} className="flex flex-col items-center gap-2">
                    <span className={`text-xs font-bold ${w.isToday ? 'text-blue-600' : 'text-slate-400'}`}>{w.dayName}</span>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${w.hasAny ? 'bg-blue-100 text-blue-600' : 'bg-slate-50 dark:bg-zinc-800/60 text-slate-300'}`}>
                      {w.hasAny ? <CheckCircle2 size={16}/> : <Circle size={16}/>}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Habits & Streaks */}
            <Card className="border-none shadow-sm">
              <h3 className="font-bold text-slate-800 dark:text-zinc-50 uppercase text-sm tracking-wider mb-4 flex items-center gap-2"><Zap size={16} className="text-amber-500"/> CURRENT STREAKS</h3>
              <div className="space-y-3">
                {routines.slice(0, 4).map(r => (
                  <div key={r.id} className="flex justify-between items-center">
                    <span className="font-medium text-slate-700 dark:text-zinc-300 text-sm truncate pr-4">{r.title}</span>
                    <span className="font-black text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-lg text-xs whitespace-nowrap">🔥 {d.streaks[r.id] || 0} days</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Tasks Connection */}
            {d.pendingTasks.length > 0 && (
              <Card className="border border-indigo-200 dark:border-zinc-800 shadow-sm bg-indigo-50 dark:bg-zinc-900/90 backdrop-blur-sm">
                <h3 className="font-bold text-indigo-900 dark:text-indigo-400 uppercase text-sm tracking-wider mb-3 flex items-center gap-2"><CheckSquare size={16}/> TODAY'S TASKS</h3>
                <div className="space-y-2 mb-4">
                  {d.pendingTasks.map(t => (
                    <div key={t.id} className="flex items-center gap-2 text-sm text-indigo-800 dark:text-indigo-300">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0"></div>
                      <span className="truncate">{t.title}</span>
                    </div>
                  ))}
                </div>
                <a href="/simple-tasks" className="text-xs font-bold text-indigo-600 hover:underline">View all tasks →</a>
              </Card>
            )}

            {/* Home Visit Connection */}
            {d.upcomingVisit && (
              <Card className="border border-amber-200 dark:border-zinc-800 shadow-sm bg-amber-50 dark:bg-zinc-900/90 backdrop-blur-sm">
                <h3 className="font-bold text-amber-800 dark:text-amber-500 uppercase text-sm tracking-wider mb-2 flex items-center gap-2"><Home size={16}/> UPCOMING TRIP</h3>
                <p className="text-sm font-bold text-slate-800 dark:text-zinc-50 mb-1">Home Visit in {Math.ceil((new Date(d.upcomingVisit.departure) - now) / 86400000)} days</p>
                <p className="text-xs text-amber-700 dark:text-amber-600 mb-3">Ensure your packing and preparations are complete.</p>
                <a href="/simple-home-visits" className="text-xs font-bold text-amber-600 hover:underline">View trip details →</a>
              </Card>
            )}

          </div>
        </div>
      )}

      {/* Modals */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add Routine">
        <form onSubmit={(e) => { e.preventDefault(); addMut.mutate(form); }} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Routine Name</label>
            <input type="text" required placeholder="e.g. Morning Workout" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full border border-slate-200 dark:border-zinc-800 rounded-xl p-3 outline-none focus:border-blue-500 bg-white dark:bg-zinc-900/90 backdrop-blur-sm min-h-[44px]" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Start Time</label>
              <input type="time" required value={form.start_time} onChange={e => setForm({...form, start_time: e.target.value})} className="w-full border border-slate-200 dark:border-zinc-800 rounded-xl p-3 outline-none focus:border-blue-500 bg-white dark:bg-zinc-900/90 backdrop-blur-sm min-h-[44px]" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Category</label>
              <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full border border-slate-200 dark:border-zinc-800 rounded-xl p-3 outline-none focus:border-blue-500 bg-white dark:bg-zinc-900/90 backdrop-blur-sm min-h-[44px]">
                <option>Health</option><option>Work</option><option>Learning</option><option>Food</option><option>Personal</option><option>Family</option><option>Sleep</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Applies to Shift</label>
            <div className="flex flex-wrap gap-2">
              {['All', 'Morning', 'Evening', 'Night', 'Off'].map(shift => (
                <button type="button" key={shift} onClick={() => setForm({...form, shift_type: shift})} className={`px-4 py-2 rounded-xl text-sm font-bold border transition-colors ${form.shift_type === shift ? 'bg-blue-50 border-blue-500 text-blue-600' : 'bg-white border-slate-200 text-slate-600'}`}>{shift}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Repeat Days</label>
            <div className="flex gap-1">
              {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(day => (
                <button type="button" key={day} onClick={() => toggleDay(day)} className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-colors ${form.days.includes(day) ? 'bg-blue-600 border-blue-600 text-white' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>{day.charAt(0)}</button>
              ))}
            </div>
          </div>
          
          <button type="submit" disabled={addMut.isPending} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-black mt-6 disabled:opacity-50 shadow-md">SAVE ROUTINE</button>
        </form>
      </Modal>

      <Modal isOpen={isTemplateOpen} onClose={() => setIsTemplateOpen(false)} title="Routine Templates">
        <div className="space-y-4">
          <p className="text-sm text-slate-500 mb-4">Quickly populate standard routines based on your shift type. You can edit them later.</p>
          
          <button onClick={() => applyTemplate('Morning')} className="w-full p-4 border border-slate-200 hover:border-blue-500 rounded-xl text-left group transition-colors">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-amber-50 text-amber-500 rounded-lg"><Sun size={20}/></div>
              <h4 className="font-bold text-slate-800 dark:text-zinc-50 group-hover:text-blue-600">Morning Shift Package</h4>
            </div>
            <p className="text-xs text-slate-500">Adds: Wake Up (6 AM), Stretch, Breakfast. Applies only on Morning shifts.</p>
          </button>

          <button onClick={() => applyTemplate('Night')} className="w-full p-4 border border-slate-200 hover:border-blue-500 rounded-xl text-left group transition-colors">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-indigo-50 text-indigo-500 rounded-lg"><Moon size={20}/></div>
              <h4 className="font-bold text-slate-800 dark:text-zinc-50 group-hover:text-blue-600">Night Shift Package</h4>
            </div>
            <p className="text-xs text-slate-500">Adds: Wake Up (2 PM), Workout (5 PM), Prepare for Work. Applies only on Night shifts.</p>
          </button>

          <button onClick={() => applyTemplate('Day Off')} className="w-full p-4 border border-slate-200 hover:border-blue-500 rounded-xl text-left group transition-colors">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-emerald-50 text-emerald-500 rounded-lg"><Coffee size={20}/></div>
              <h4 className="font-bold text-slate-800 dark:text-zinc-50 group-hover:text-blue-600">Day Off Package</h4>
            </div>
            <p className="text-xs text-slate-500">Adds: Morning Exercise, Personal Learning, Family Time. Applies only on Days Off.</p>
          </button>
        </div>
      </Modal>

    </div>
  );
}
