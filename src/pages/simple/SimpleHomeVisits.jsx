import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { simpleLifeService } from '../../services/simpleLifeService';
import { useAuthStore } from '../../store/useAuthStore';
import { Card } from '../../components/Card';
import { Modal } from '../../components/Modal';
import { 
  Home, Plus, Loader2, Trash, Calendar, Edit2, 
  MapPin, Clock, Train, Bus, Plane, Car, Navigation,
  CheckCircle2, Circle, ChevronLeft, ChevronRight, DollarSign, ListTodo
} from 'lucide-react';
import Swal from 'sweetalert2';

export default function SimpleHomeVisits() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  
  // State
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Modals
  const [isPlanOpen, setIsPlanOpen] = useState(false);
  const [isTaskOpen, setIsTaskOpen] = useState(false);
  const [isExpenseOpen, setIsExpenseOpen] = useState(false);
  
  // Forms
  const [visitForm, setVisitForm] = useState({ departure: '', return: '', destination: 'Home', estimated_cost: '', travel_mode: 'Train', notes: '' });
  const [taskForm, setTaskForm] = useState({ title: '', home_visit_id: '' });
  const [expenseForm, setExpenseForm] = useState({ amount: '', description: '', category: 'Travel', home_visit_id: '' });
  
  // Queries
  const { data: visits, isLoading: vLoad } = useQuery({
    queryKey: ['simple-visits', user?.id],
    queryFn: () => simpleLifeService.getHomeVisits(user?.id),
    enabled: !!user?.id
  });
  
  const { data: expenses, isLoading: eLoad } = useQuery({
    queryKey: ['simple-expenses', user?.id],
    queryFn: () => simpleLifeService.getExpenses(user?.id),
    enabled: !!user?.id
  });
  
  const { data: tasks, isLoading: tLoad } = useQuery({
    queryKey: ['simple-tasks', user?.id],
    queryFn: () => simpleLifeService.getTasks(user?.id),
    enabled: !!user?.id
  });

  // Mutations
  const addVisitMut = useMutation({
    mutationFn: (d) => simpleLifeService.addHomeVisit(user?.id, d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simple-visits'] });
      setIsPlanOpen(false);
      setVisitForm({ departure: '', return: '', destination: 'Home', estimated_cost: '', travel_mode: 'Train', notes: '' });
      Swal.fire({ icon: 'success', title: 'Visit Planned', timer: 1000, showConfirmButton: false });
    }
  });

  const delVisitMut = useMutation({
    mutationFn: (id) => simpleLifeService.deleteHomeVisit(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['simple-visits'] })
  });

  const addTaskMut = useMutation({
    mutationFn: (d) => simpleLifeService.addTask(user?.id, d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simple-tasks'] });
      setIsTaskOpen(false);
      setTaskForm({ title: '', home_visit_id: '' });
    }
  });

  const toggleTaskMut = useMutation({
    mutationFn: ({id, completed}) => simpleLifeService.updateTaskStatus(id, completed),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['simple-tasks'] })
  });
  
  const delTaskMut = useMutation({
    mutationFn: (id) => simpleLifeService.deleteTask(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['simple-tasks'] })
  });

  const addExpMut = useMutation({
    mutationFn: (d) => simpleLifeService.addExpense(user?.id, d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simple-expenses'] });
      setIsExpenseOpen(false);
      setExpenseForm({ amount: '', description: '', category: 'Travel', home_visit_id: '' });
    }
  });

  // Derived State Calculations
  const d = useMemo(() => {
    if (!visits) return { nextVisit: null, pastVisits: [], monthStats: {}, yearStats: {} };
    
    const today = new Date();
    today.setHours(0,0,0,0);
    
    // Sort visits by departure
    const sorted = [...visits].sort((a, b) => new Date(a.departure) - new Date(b.departure));
    
    const nextVisit = sorted.find(v => new Date(v.departure) >= today || (new Date(v.return || v.departure) >= today));
    const pastVisits = sorted.filter(v => v.id !== nextVisit?.id).reverse();
    
    // Enrich nextVisit
    if (nextVisit) {
      nextVisit.daysUntil = Math.ceil((new Date(nextVisit.departure) - today) / (1000 * 60 * 60 * 24));
      nextVisit.duration = nextVisit.return ? Math.ceil((new Date(nextVisit.return) - new Date(nextVisit.departure)) / (1000 * 60 * 60 * 24)) : 1;
      nextVisit.tasks = tasks?.filter(t => t.home_visit_id === nextVisit.id) || [];
      nextVisit.expenses = expenses?.filter(e => e.home_visit_id === nextVisit.id) || [];
      nextVisit.actualSpend = nextVisit.expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
    }
    
    // Stats for current Month
    const targetMonth = currentDate.getMonth();
    const targetYear = currentDate.getFullYear();
    const mVisits = sorted.filter(v => new Date(v.departure).getMonth() === targetMonth && new Date(v.departure).getFullYear() === targetYear);
    
    let mDays = 0;
    mVisits.forEach(v => {
      mDays += v.return ? Math.ceil((new Date(v.return) - new Date(v.departure)) / (1000 * 60 * 60 * 24)) : 1;
    });
    
    const mSpend = expenses?.filter(e => e.home_visit_id && mVisits.some(v => v.id === e.home_visit_id)).reduce((s, e) => s + parseFloat(e.amount), 0) || 0;
    
    // Stats for current Year
    const yVisits = sorted.filter(v => new Date(v.departure).getFullYear() === targetYear);
    let yDays = 0;
    yVisits.forEach(v => {
      yDays += v.return ? Math.ceil((new Date(v.return) - new Date(v.departure)) / (1000 * 60 * 60 * 24)) : 1;
    });
    const ySpend = expenses?.filter(e => e.home_visit_id && yVisits.some(v => v.id === e.home_visit_id)).reduce((s, e) => s + parseFloat(e.amount), 0) || 0;
    
    return {
      nextVisit,
      pastVisits,
      monthStats: { count: mVisits.length, days: mDays, spend: mSpend },
      yearStats: { count: yVisits.length, days: yDays, spend: ySpend }
    };
  }, [visits, expenses, tasks, currentDate]);

  const changeMonth = (offset) => {
    const d = new Date(currentDate);
    d.setMonth(d.getMonth() + offset);
    setCurrentDate(d);
  };

  const getTravelIcon = (mode) => {
    switch(mode) {
      case 'Train': return <Train size={16} />;
      case 'Bus': return <Bus size={16} />;
      case 'Flight': return <Plane size={16} />;
      case 'Car': return <Car size={16} />;
      default: return <Navigation size={16} />;
    }
  };

  if (vLoad) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-amber-500" size={32} /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <header>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-zinc-50">Home Visits</h2>
        <p className="text-slate-500">{currentDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</p>
      </header>

      {/* Primary Next Visit Card */}
      {d.nextVisit ? (
        <Card className="bg-amber-500 text-white border-none shadow-xl overflow-hidden relative group">
          <div className="absolute right-0 top-0 w-64 h-64 bg-amber-400 rounded-full blur-3xl opacity-50 -mr-20 -mt-20 pointer-events-none transition-transform group-hover:scale-110"></div>
          <div className="relative z-10 p-6 md:p-8">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-amber-100 text-sm font-bold tracking-widest uppercase mb-4 flex items-center gap-2">
                  <Home size={16} /> NEXT HOME VISIT
                </p>
                <h3 className="text-5xl md:text-6xl font-black tracking-tight mb-2">
                  {d.nextVisit.daysUntil === 0 ? "Today" : d.nextVisit.daysUntil < 0 ? "Ongoing" : `in ${d.nextVisit.daysUntil} days`}
                </h3>
                <p className="text-xl text-amber-100 font-bold mb-6">
                  {new Date(d.nextVisit.departure).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} 
                  {d.nextVisit.return && ` → ${new Date(d.nextVisit.return).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`}
                </p>
              </div>
              <button onClick={() => delVisitMut.mutate(d.nextVisit.id)} className="bg-amber-600/50 hover:bg-amber-600 p-2 rounded-xl transition-colors">
                <Trash size={20} />
              </button>
            </div>
            
            <div className="flex flex-wrap gap-4 text-sm mt-4">
              <div className="bg-amber-600/40 px-4 py-2 rounded-xl backdrop-blur-sm border border-amber-400/30">
                <p className="text-amber-200 mb-1 uppercase text-xs font-bold">Stay</p>
                <p className="font-bold text-lg">{d.nextVisit.duration} Days</p>
              </div>
              <div className="bg-amber-600/40 px-4 py-2 rounded-xl backdrop-blur-sm border border-amber-400/30">
                <p className="text-amber-200 mb-1 uppercase text-xs font-bold">Mode</p>
                <p className="font-bold text-lg flex items-center gap-2">{getTravelIcon(d.nextVisit.travel_mode)} {d.nextVisit.travel_mode}</p>
              </div>
              <div className="bg-amber-600/40 px-4 py-2 rounded-xl backdrop-blur-sm border border-amber-400/30">
                <p className="text-amber-200 mb-1 uppercase text-xs font-bold">Budget</p>
                <p className="font-bold text-lg">₹{parseFloat(d.nextVisit.estimated_cost || 0).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="bg-slate-50 dark:bg-zinc-900/90 backdrop-blur-sm border border-slate-200 dark:border-zinc-800 text-center py-12">
          <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Home size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-zinc-50 mb-2">WHEN ARE YOU GOING HOME?</h3>
          <p className="text-slate-500 max-w-md mx-auto mb-6">You don't have a home visit planned yet. Plan your next visit and keep everything organized in one place.</p>
          <button 
            onClick={() => setIsPlanOpen(true)}
            className="bg-amber-500 text-white px-8 py-3 rounded-xl font-bold shadow-md hover:bg-amber-600 transition-colors"
          >
            + PLAN VISIT
          </button>
        </Card>
      )}

      {/* Quick Actions */}
      {d.nextVisit && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button onClick={() => setIsPlanOpen(true)} className="bg-white dark:bg-zinc-900/90 backdrop-blur-sm border border-slate-200 dark:border-zinc-800 hover:border-amber-500 text-slate-700 dark:text-zinc-300 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-sm">
            <Plus size={18} className="text-amber-500" /> PLAN VISIT
          </button>
          <button onClick={() => { setExpenseForm({...expenseForm, home_visit_id: d.nextVisit.id}); setIsExpenseOpen(true); }} className="bg-white dark:bg-zinc-900/90 backdrop-blur-sm border border-slate-200 dark:border-zinc-800 hover:border-emerald-500 text-slate-700 dark:text-zinc-300 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-sm">
            <DollarSign size={18} className="text-emerald-500" /> ADD EXPENSE
          </button>
          <button onClick={() => { setTaskForm({...taskForm, home_visit_id: d.nextVisit.id}); setIsTaskOpen(true); }} className="bg-white dark:bg-zinc-900/90 backdrop-blur-sm border border-slate-200 dark:border-zinc-800 hover:border-indigo-500 text-slate-700 dark:text-zinc-300 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-sm">
            <ListTodo size={18} className="text-indigo-500" /> ADD TASK
          </button>
        </div>
      )}

      {d.nextVisit && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Trip Summary (Expenses) */}
          <Card className="border-none shadow-sm">
            <h3 className="font-bold text-slate-800 dark:text-zinc-50 mb-4 uppercase text-sm tracking-wider flex items-center gap-2">
              <DollarSign size={16} className="text-emerald-500"/> TRIP SUMMARY
            </h3>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-zinc-800">
                <span className="text-slate-500">Estimated Budget</span>
                <span className="font-bold">₹{parseFloat(d.nextVisit.estimated_cost || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-zinc-800">
                <span className="text-slate-500">Actual Spending</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">₹{d.nextVisit.actualSpend.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="font-bold text-slate-800 dark:text-zinc-50">Remaining</span>
                <span className={`font-black text-xl ${(parseFloat(d.nextVisit.estimated_cost||0) - d.nextVisit.actualSpend) < 0 ? 'text-red-500' : 'text-slate-800 dark:text-zinc-50'}`}>
                  ₹{(parseFloat(d.nextVisit.estimated_cost || 0) - d.nextVisit.actualSpend).toLocaleString()}
                </span>
              </div>
            </div>

            {d.nextVisit.expenses?.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Logged Expenses</p>
                {d.nextVisit.expenses.map(e => (
                  <div key={e.id} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-zinc-900/90 backdrop-blur-sm rounded-xl text-sm">
                    <span className="font-medium">{e.description || e.category}</span>
                    <span className="font-bold">₹{parseFloat(e.amount).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 italic text-center py-4">No expenses logged for this trip yet.</p>
            )}
          </Card>

          {/* Before You Go (Tasks) */}
          <Card className="border-none shadow-sm">
            <h3 className="font-bold text-slate-800 dark:text-zinc-50 mb-4 uppercase text-sm tracking-wider flex items-center gap-2">
              <ListTodo size={16} className="text-indigo-500"/> BEFORE YOU GO
            </h3>
            
            <div className="space-y-2">
              {d.nextVisit.tasks?.map(task => (
                <div key={task.id} className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-zinc-800/50/50 rounded-xl group transition-colors">
                  <button 
                    onClick={() => toggleTaskMut.mutate({ id: task.id, completed: !task.completed })}
                    className="text-slate-400 hover:text-indigo-500 transition-colors"
                  >
                    {task.completed ? <CheckCircle2 size={22} className="text-emerald-500" /> : <Circle size={22} />}
                  </button>
                  <span className={`flex-1 font-medium ${task.completed ? 'text-slate-400 line-through' : 'text-slate-700 dark:text-zinc-300'}`}>
                    {task.title}
                  </span>
                  <button onClick={() => delTaskMut.mutate(task.id)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all p-1">
                    <Trash size={16} />
                  </button>
                </div>
              ))}
              
              {(!d.nextVisit.tasks || d.nextVisit.tasks.length === 0) && (
                <div className="text-center py-8">
                  <p className="text-slate-500 text-sm mb-4">No preparation tasks added yet.</p>
                  <button onClick={() => { setTaskForm({...taskForm, home_visit_id: d.nextVisit.id}); setIsTaskOpen(true); }} className="text-indigo-600 font-bold text-sm hover:underline">
                    + Add Task
                  </button>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Statistics Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Month History */}
        <Card className="border-none shadow-sm bg-gradient-to-br from-slate-900 to-slate-800 text-white">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold uppercase tracking-wider text-sm flex items-center gap-2 text-slate-300">
              <Calendar size={16} /> {currentDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
            </h3>
            <div className="flex gap-2">
              <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-white/10 rounded-lg transition-colors"><ChevronLeft size={18}/></button>
              <button onClick={() => changeMonth(1)} className="p-1 hover:bg-white/10 rounded-lg transition-colors"><ChevronRight size={18}/></button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Visits</p>
              <p className="text-2xl font-black">{d.monthStats.count}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Days Home</p>
              <p className="text-2xl font-black">{d.monthStats.days}</p>
            </div>
            <div className="col-span-2">
              <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Travel Spending</p>
              <p className="text-2xl font-black text-emerald-400">₹{d.monthStats.spend.toLocaleString()}</p>
            </div>
          </div>
        </Card>

        {/* Year History */}
        <Card className="border-none shadow-sm bg-slate-50 dark:bg-zinc-800/60/30">
          <h3 className="font-bold uppercase tracking-wider text-sm flex items-center gap-2 text-slate-500 dark:text-zinc-400 mb-6">
            THIS YEAR ({currentDate.getFullYear()})
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Visits</p>
              <p className="text-2xl font-black text-slate-800 dark:text-zinc-50">{d.yearStats.count}</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Days Home</p>
              <p className="text-2xl font-black text-slate-800 dark:text-zinc-50">{d.yearStats.days}</p>
            </div>
            <div className="col-span-2">
              <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Travel Spending</p>
              <p className="text-2xl font-black text-slate-800 dark:text-zinc-50">₹{d.yearStats.spend.toLocaleString()}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Previous Visits */}
      <div className="space-y-4">
        <h3 className="font-bold text-slate-800 dark:text-zinc-50 uppercase text-sm tracking-wider ml-2">Previous Visits</h3>
        {d.pastVisits.length > 0 ? (
          d.pastVisits.map(visit => {
            const duration = visit.return ? Math.ceil((new Date(visit.return) - new Date(visit.departure)) / (1000 * 60 * 60 * 24)) : 1;
            return (
              <Card key={visit.id} className="p-4 flex justify-between items-center border-none shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-slate-100 dark:bg-zinc-800/60 text-slate-500 rounded-xl">
                    <Home size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 dark:text-zinc-50">
                      {new Date(visit.departure).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {visit.return && ` → ${new Date(visit.return).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                    </p>
                    <p className="text-sm text-slate-500 flex items-center gap-3 mt-1">
                      <span>{duration} days</span>
                      <span className="flex items-center gap-1">{getTravelIcon(visit.travel_mode)} {visit.travel_mode}</span>
                      {visit.estimated_cost && <span className="font-medium text-slate-700 dark:text-zinc-300">₹{parseFloat(visit.estimated_cost).toLocaleString()}</span>}
                    </p>
                  </div>
                </div>
                <button onClick={() => delVisitMut.mutate(visit.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors bg-slate-50 dark:bg-zinc-900/90 backdrop-blur-sm rounded-lg">
                  <Trash size={16}/>
                </button>
              </Card>
            );
          })
        ) : (
          <Card className="p-8 text-center border-none shadow-sm">
            <p className="text-slate-500 font-medium">No previous visits yet.</p>
            <p className="text-sm text-slate-400 mt-2">Your completed home visits will appear here.</p>
          </Card>
        )}
      </div>

      {/* Modals */}
      <Modal isOpen={isPlanOpen} onClose={() => setIsPlanOpen(false)} title="Plan Home Visit">
        <form onSubmit={(e) => { e.preventDefault(); addVisitMut.mutate(visitForm); }} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Departure</label>
              <input type="date" required value={visitForm.departure} onChange={e => setVisitForm({...visitForm, departure: e.target.value})} className="w-full border border-slate-200 dark:border-zinc-800 rounded-xl p-3 outline-none focus:border-amber-500 bg-white dark:bg-zinc-900/90 backdrop-blur-sm min-h-[44px]" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Return</label>
              <input type="date" value={visitForm.return} onChange={e => setVisitForm({...visitForm, return: e.target.value})} className="w-full border border-slate-200 dark:border-zinc-800 rounded-xl p-3 outline-none focus:border-amber-500 bg-white dark:bg-zinc-900/90 backdrop-blur-sm min-h-[44px]" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Travel Mode</label>
            <div className="grid grid-cols-4 gap-2">
              {['Train', 'Bus', 'Flight', 'Car'].map(mode => (
                <button 
                  key={mode} type="button"
                  onClick={() => setVisitForm({...visitForm, travel_mode: mode})}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${visitForm.travel_mode === mode ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-600' : 'border-slate-200 dark:border-zinc-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-zinc-800'}`}
                >
                  {getTravelIcon(mode)}
                  <span className="text-xs font-bold">{mode}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Estimated Cost (₹)</label>
            <input type="number" placeholder="2500" value={visitForm.estimated_cost} onChange={e => setVisitForm({...visitForm, estimated_cost: e.target.value})} className="w-full border border-slate-200 dark:border-zinc-800 rounded-xl p-3 outline-none focus:border-amber-500 bg-white dark:bg-zinc-900/90 backdrop-blur-sm min-h-[44px]" />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Notes / Ticket Ref</label>
            <input type="text" placeholder="PNR / Notes" value={visitForm.notes} onChange={e => setVisitForm({...visitForm, notes: e.target.value})} className="w-full border border-slate-200 dark:border-zinc-800 rounded-xl p-3 outline-none focus:border-amber-500 bg-white dark:bg-zinc-900/90 backdrop-blur-sm min-h-[44px]" />
          </div>
          <button type="submit" disabled={addVisitMut.isPending} className="w-full bg-amber-500 hover:bg-amber-600 text-white py-4 rounded-xl font-black mt-6 disabled:opacity-50 transition-colors shadow-md">SAVE VISIT</button>
        </form>
      </Modal>

      <Modal isOpen={isExpenseOpen} onClose={() => setIsExpenseOpen(false)} title="Log Travel Expense">
        <form onSubmit={(e) => { e.preventDefault(); addExpMut.mutate(expenseForm); }} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Amount</label>
            <input type="number" autoFocus required value={expenseForm.amount} onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})} className="w-full text-2xl font-black py-3 border-b-2 border-slate-200 focus:border-emerald-500 outline-none bg-transparent min-h-[44px]" placeholder="0" />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Description</label>
            <input type="text" required placeholder="e.g. Train ticket, Cab to station" value={expenseForm.description} onChange={e => setExpenseForm({...expenseForm, description: e.target.value})} className="w-full border border-slate-200 dark:border-zinc-800 rounded-xl p-3 outline-none focus:border-emerald-500 bg-white dark:bg-zinc-900/90 backdrop-blur-sm min-h-[44px]" />
          </div>
          <button type="submit" disabled={addExpMut.isPending} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-xl font-black mt-6 disabled:opacity-50 shadow-md">Add Expense</button>
        </form>
      </Modal>

      <Modal isOpen={isTaskOpen} onClose={() => setIsTaskOpen(false)} title="Add Preparation Task">
        <form onSubmit={(e) => { e.preventDefault(); addTaskMut.mutate(taskForm); }} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Task</label>
            <input type="text" autoFocus required placeholder="e.g. Book ticket, Pack clothes" value={taskForm.title} onChange={e => setTaskForm({...taskForm, title: e.target.value})} className="w-full border border-slate-200 dark:border-zinc-800 rounded-xl p-3 outline-none focus:border-indigo-500 bg-white dark:bg-zinc-900/90 backdrop-blur-sm" />
          </div>
          <button type="submit" disabled={addTaskMut.isPending} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl font-black mt-6 disabled:opacity-50 shadow-md">Add Task</button>
        </form>
      </Modal>

    </div>
  );
}
