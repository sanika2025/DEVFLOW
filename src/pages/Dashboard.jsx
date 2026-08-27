import { useMemo } from 'react';
import { BookOpen, Target, Clock, Zap, Loader2, Dumbbell, Flame, CheckCircle2, PlayCircle, Circle, ArrowRight, Activity, Wallet, BrainCircuit, Sparkles, LayoutDashboard, Flag, Plus, CheckCircle, PlusCircle, PieChart, Star, TrendingUp, Calendar } from 'lucide-react';
import { StatsCard } from '../components/StatsCard';
import { Card } from '../components/Card';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/useAuthStore';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { BarChart, Bar, ResponsiveContainer, XAxis, Tooltip, CartesianGrid, YAxis, Legend } from 'recharts';

import { progressService } from '../services/progressService';
import { workoutService } from '../services/workoutService';
import { plannerService } from '../services/plannerService';
import { interviewService } from '../services/interviewService';
import { expenseService } from '../services/expenseService';
import { personalProjectService } from '../services/personalProjectService';

export default function Dashboard() {
  const { user, profile } = useAuthStore();
  const navigate = useNavigate();
  
  // -- Data Fetching --
  const { data: progressDataObj, isLoading: progressLoading } = useQuery({
    queryKey: ['progress', user?.id],
    queryFn: () => progressService.getUserProgress(user?.id),
    enabled: !!user?.id
  });

  const { data: routinesData, isLoading: workoutLoading } = useQuery({
    queryKey: ['workout_routines', user?.id],
    queryFn: () => workoutService.getWorkoutRoutines(user?.id),
    enabled: !!user?.id
  });

  const { data: sessionsData } = useQuery({
    queryKey: ['workout_sessions', user?.id],
    queryFn: () => workoutService.getWorkoutSessions(user?.id),
    enabled: !!user?.id
  });

  const { data: tasksData, isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', user?.id],
    queryFn: () => plannerService.getTasks(user?.id),
    enabled: !!user?.id
  });

  const { data: interviewStatsData, isLoading: intLoading } = useQuery({
    queryKey: ['interview_stats', user?.id],
    queryFn: () => interviewService.getStats(user?.id),
    enabled: !!user?.id
  });

  const { data: mockInterviewsData } = useQuery({
    queryKey: ['mock_interviews', user?.id],
    queryFn: () => interviewService.getMockInterviews(user?.id),
    enabled: !!user?.id
  });

  const { data: interviewProgressData } = useQuery({
    queryKey: ['interview_progress', user?.id],
    queryFn: () => interviewService.getProgress(user?.id),
    enabled: !!user?.id
  });

  const currentMonthStr = new Date().toISOString().slice(0,7);
  const { data: expenseData, isLoading: expLoading } = useQuery({
    queryKey: ['expenses_analytics', user?.id, currentMonthStr],
    queryFn: () => expenseService.getMonthlyAnalytics(user?.id, currentMonthStr),
    enabled: !!user?.id
  });

  const { data: budgetData } = useQuery({
    queryKey: ['budget', user?.id, currentMonthStr],
    queryFn: () => expenseService.getBudget(user?.id, currentMonthStr),
    enabled: !!user?.id
  });

  const { data: projectsData, isLoading: projLoading } = useQuery({
    queryKey: ['personal_projects', user?.id],
    queryFn: () => personalProjectService.getProjects(user?.id),
    enabled: !!user?.id
  });

  const isLoading = progressLoading || workoutLoading || tasksLoading || intLoading || expLoading || projLoading;

  // -- Derived Data --
  const progressData = progressDataObj?.data || [];
  const routines = routinesData?.data || [];
  const sessions = sessionsData?.data || [];
  const tasks = tasksData?.data || [];
  const interviewStats = interviewStatsData?.data || { overall_readiness: 0, current_streak: 0 };
  const mockInterviews = mockInterviewsData?.data || [];
  const interviewProgress = interviewProgressData?.data || [];
  const expenses = expenseData?.data || { totalSpent: 0 };
  const budget = budgetData?.data?.amount || 0;
  const projects = projectsData?.data || [];

  const todayStr = new Date().toISOString().split('T')[0];

  // 1. Planner KPIs
  const todayTasks = tasks.filter(t => t.due_date === todayStr || (!t.due_date && !t.completed));
  const completedTodayTasksCount = todayTasks.filter(t => t.completed || t.status === 'done').length;
  const topPriorities = [...todayTasks].sort((a,b) => {
    const pA = a.priority==='high'?3:a.priority==='medium'?2:1;
    const pB = b.priority==='high'?3:b.priority==='medium'?2:1;
    return pB - pA;
  }).slice(0, 3);

  // 2. Study KPIs
  const hoursStudied = progressData.filter(p => p.status === 'completed').reduce((acc, curr) => acc + (curr.day?.estimated_hours || 0.5), 0);
  const currentStreak = useMemo(() => {
    if (!progressData.length) return 0;
    const dates = [...new Set(progressData.filter(p => p.completed_at).map(p => new Date(p.completed_at).toISOString().split('T')[0]))].sort((a, b) => new Date(b) - new Date(a));
    if (!dates.length) return 0;
    let streak = 0; let cur = new Date(); cur.setHours(0,0,0,0);
    for (let i = 0; i < dates.length; i++) {
      const d = new Date(dates[i]); d.setHours(0,0,0,0);
      const diff = Math.ceil(Math.abs(cur - d) / (1000 * 60 * 60 * 24));
      if (diff === 0 || diff === 1) { streak++; cur = d; } else break;
    }
    return Math.max(streak, 0); 
  }, [progressData]);

  // 3. Workout KPIs
  const todayWorkout = useMemo(() => {
    const todayDay = new Date().getDay();
    const completedToday = sessions.find(s => s.is_completed && new Date(s.end_time).toDateString() === new Date().toDateString());
    if (completedToday) return { type: 'completed', text: 'Completed' };
    const scheduled = routines.find(r => r.days_of_week && r.days_of_week.includes(todayDay));
    if (scheduled) return { type: 'scheduled', text: `${scheduled.estimated_duration || 45} min planned` };
    return { type: 'rest', text: 'Rest Day' };
  }, [routines, sessions]);

  // 4. Interview Readiness
  const questionsPracticedThisWeek = useMemo(() => {
    const oneWeekAgo = new Date(); oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return interviewProgress.filter(p => new Date(p.last_practiced_at) >= oneWeekAgo).length;
  }, [interviewProgress]);
  const lastMockScore = mockInterviews.length > 0 ? mockInterviews[0].score_overall : 0;

  // 5. Active Projects
  const activeProjects = projects.filter(p => p.status !== 'Completed' && p.status !== 'Archived').slice(0, 2);

  // 6. Weekly Chart Data (Merged)
  const chartData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dataObj = days.map(d => ({ name: d, Study: 0, Tasks: 0, Workout: 0, Interview: 0 }));
    
    // Study
    progressData.forEach(p => {
      if (p.completed_at && p.status === 'completed') {
        const dayIdx = new Date(p.completed_at).getDay();
        dataObj[dayIdx].Study += (p.day?.estimated_hours || 0.5);
      }
    });
    // Tasks
    tasks.forEach(t => {
      if ((t.completed || t.status === 'done') && t.updated_at) {
        const dayIdx = new Date(t.updated_at).getDay();
        dataObj[dayIdx].Tasks += 1;
      }
    });
    // Workout
    sessions.forEach(s => {
      if (s.is_completed && s.end_time) {
        const dayIdx = new Date(s.end_time).getDay();
        dataObj[dayIdx].Workout += (s.duration_minutes || 30) / 60; // in hours
      }
    });
    // Interview
    mockInterviews.forEach(m => {
      if (m.created_at) {
         const dayIdx = new Date(m.created_at).getDay();
         dataObj[dayIdx].Interview += 1; // 1 hr per mock
      }
    });

    return dataObj;
  }, [progressData, tasks, sessions, mockInterviews]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } } };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6 max-w-7xl mx-auto pb-12 px-4 sm:px-0">
      {/* 1. HEADER */}
      <motion.header variants={itemVariants} className="flex flex-col gap-2">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-800 dark:text-zinc-50 tracking-tight">
          Good Morning, {profile?.full_name?.split(' ')[0] || 'User'} 👋
        </h2>
        <div className="flex items-center gap-2 text-slate-500 dark:text-zinc-400 font-medium">
          <Calendar size={16}/> {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          <span className="px-2 hidden sm:inline">•</span>
          <span className="hidden sm:inline">Here’s what needs your attention today.</span>
        </div>
      </motion.header>

      {/* 2. TODAY AT A GLANCE (KPIs) */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard title="Study Time" value={`${hoursStudied.toFixed(1)}h`} icon={Clock} iconColor="text-indigo-500" iconBg="bg-indigo-50 dark:bg-indigo-500/10" />
        <StatsCard title="Tasks" value={`${completedTodayTasksCount} / ${todayTasks.length}`} subtitle="Completed today" icon={Target} iconColor="text-emerald-500" iconBg="bg-emerald-50 dark:bg-emerald-500/10" />
        <StatsCard title="Learning Streak" value={`${currentStreak} days`} icon={Flame} iconColor="text-orange-500" iconBg="bg-orange-50 dark:bg-orange-500/10" />
        <StatsCard title="Workout" value={todayWorkout.text} subtitle={todayWorkout.type === 'rest' ? 'Enjoy your recovery' : ''} icon={Dumbbell} iconColor="text-blue-500" iconBg="bg-blue-50 dark:bg-blue-500/10" />
      </motion.div>

      {/* MAIN GRID */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN (Priority & Charts) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* 3. TODAY'S PRIORITIES */}
          <Card className="flex flex-col border-indigo-100 dark:border-indigo-500/20 shadow-sm relative overflow-hidden">
             <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
             <div className="flex justify-between items-center mb-4 relative z-10">
               <h3 className="font-bold text-slate-800 dark:text-zinc-50 text-xl flex items-center gap-2">
                 <Target className="text-indigo-600 dark:text-indigo-400" size={24} /> Today's Focus
               </h3>
               <button onClick={() => navigate('/planner')} className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 transition-colors flex items-center gap-1">
                 View Planner <ArrowRight size={16} />
               </button>
             </div>
             <div className="space-y-3 relative z-10">
               {topPriorities.length === 0 ? (
                 <div className="p-6 text-center border-2 border-dashed border-slate-200 dark:border-zinc-800 rounded-xl">
                   <p className="text-slate-500 dark:text-zinc-400 font-medium">Your day is clear! Take a break or add a task.</p>
                 </div>
               ) : (
                 topPriorities.map(t => (
                   <div key={t.id} className="flex gap-3 items-center p-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-sm hover:border-indigo-300 transition-colors group cursor-pointer" onClick={() => navigate('/planner')}>
                     {t.completed || t.status === 'done' ? (
                       <CheckCircle className="text-emerald-500 shrink-0" size={20} />
                     ) : (
                       <Circle className="text-slate-300 shrink-0 group-hover:text-indigo-400 transition-colors" size={20} />
                     )}
                     <div className="flex-1 min-w-0">
                       <h4 className={`font-semibold truncate ${t.completed || t.status === 'done' ? 'line-through text-slate-400' : 'text-slate-800 dark:text-zinc-50'}`}>{t.title}</h4>
                       <div className="flex gap-2 items-center mt-1">
                         <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${t.priority === 'high' ? 'bg-rose-50 text-rose-700' : t.priority === 'medium' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                           {t.priority}
                         </span>
                         {t.estimated_minutes && <span className="text-xs text-slate-500 flex items-center gap-1"><Clock size={12}/> {t.estimated_minutes}m</span>}
                         {t.category && <span className="text-xs text-slate-500 px-1.5 py-0.5 bg-slate-100 dark:bg-zinc-800 rounded">{t.category}</span>}
                       </div>
                     </div>
                   </div>
                 ))
               )}
             </div>
          </Card>

          {/* 4. CONTINUE LEARNING */}
          <Card className="p-0 overflow-hidden border-slate-200 dark:border-zinc-800">
             <div className="flex flex-col sm:flex-row items-stretch">
               <div className="p-6 flex-1 w-full flex flex-col justify-center">
                 <div className="flex items-center gap-2 mb-2">
                   <BookOpen size={16} className="text-indigo-600" />
                   <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Continue Learning</span>
                 </div>
                 <h3 className="font-bold text-slate-800 dark:text-zinc-50 text-xl mb-1">Advanced React Patterns</h3>
                 <p className="text-sm text-slate-500 mb-4">Last studied 2 hours ago</p>
                 <div className="flex items-center gap-3">
                   <div className="flex-1 h-2 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                     <div className="h-full bg-indigo-600 rounded-full" style={{ width: '68%' }}></div>
                   </div>
                   <span className="text-sm font-bold text-slate-700 dark:text-zinc-300">68%</span>
                 </div>
               </div>
               <div className="p-6 bg-slate-50 dark:bg-zinc-900/50 flex items-center justify-center sm:border-l border-t sm:border-t-0 border-slate-100 dark:border-zinc-800 w-full sm:w-auto shrink-0">
                 <button onClick={() => navigate('/learning')} className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2">
                   Resume <PlayCircle size={18}/>
                 </button>
               </div>
             </div>
          </Card>

          {/* 10. WEEKLY PROGRESS */}
          <Card className="flex flex-col h-full min-h-[350px]">
            <h3 className="font-bold text-slate-800 dark:text-zinc-50 text-lg mb-1">Weekly Activity Overview</h3>
            <p className="text-sm text-slate-500 mb-6">Your consolidated effort across all modules this week.</p>
            <div className="flex-1 w-full min-h-[250px]">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                   <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                   <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                   <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '14px', fontWeight: '500'}} />
                   <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />
                   <Bar dataKey="Study" stackId="a" fill="#6366f1" radius={[0, 0, 0, 0]} name="Study (hrs)" />
                   <Bar dataKey="Tasks" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} name="Tasks" />
                   <Bar dataKey="Interview" stackId="a" fill="#8b5cf6" radius={[0, 0, 0, 0]} name="Interviews" />
                   <Bar dataKey="Workout" stackId="a" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Workout (hrs)" />
                 </BarChart>
               </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* RIGHT COLUMN (Secondary Widgets) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          
          {/* 12. QUICK ACTIONS */}
          <div className="grid grid-cols-2 gap-3 mb-2">
            <button onClick={() => navigate('/planner')} className="p-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:border-indigo-300 dark:hover:border-indigo-500 rounded-xl text-slate-700 dark:text-zinc-300 font-semibold text-sm flex flex-col items-center gap-2 shadow-sm transition-all group">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 rounded-full group-hover:scale-110 transition-transform"><Plus size={16}/></div>
              Add Task
            </button>
            <button onClick={() => navigate('/expenses')} className="p-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:border-emerald-300 dark:hover:border-emerald-500 rounded-xl text-slate-700 dark:text-zinc-300 font-semibold text-sm flex flex-col items-center gap-2 shadow-sm transition-all group">
              <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 rounded-full group-hover:scale-110 transition-transform"><Wallet size={16}/></div>
              Log Expense
            </button>
            <button onClick={() => navigate('/workout')} className="p-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:border-blue-300 dark:hover:border-blue-500 rounded-xl text-slate-700 dark:text-zinc-300 font-semibold text-sm flex flex-col items-center gap-2 shadow-sm transition-all group">
              <div className="p-2 bg-blue-50 dark:bg-blue-500/10 text-blue-600 rounded-full group-hover:scale-110 transition-transform"><Dumbbell size={16}/></div>
              Start Workout
            </button>
            <button onClick={() => navigate('/interview')} className="p-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:border-purple-300 dark:hover:border-purple-500 rounded-xl text-slate-700 dark:text-zinc-300 font-semibold text-sm flex flex-col items-center gap-2 shadow-sm transition-all group">
              <div className="p-2 bg-purple-50 dark:bg-purple-500/10 text-purple-600 rounded-full group-hover:scale-110 transition-transform"><BrainCircuit size={16}/></div>
              Practice
            </button>
          </div>

          {/* 5. INTERVIEW READINESS */}
          <Card className="flex flex-col border-purple-100 dark:border-purple-500/20 bg-gradient-to-br from-white to-purple-50/50 dark:from-zinc-900 dark:to-purple-900/10">
             <div className="flex justify-between items-center mb-3">
               <h3 className="font-bold text-slate-800 dark:text-zinc-50 flex items-center gap-2"><BrainCircuit className="text-purple-600" size={18} /> Interview Prep</h3>
               <span className="text-xs font-bold text-emerald-600 flex items-center gap-1"><TrendingUp size={12}/> +4%</span>
             </div>
             <div className="flex items-end gap-3 mb-4">
               <div className="text-4xl font-black text-slate-800 dark:text-zinc-50">{interviewStats.overall_readiness}%</div>
               <div className="text-sm font-semibold text-slate-500 pb-1 uppercase tracking-wider">Readiness</div>
             </div>
             <div className="space-y-2 mb-4">
               <div className="flex justify-between text-sm">
                 <span className="text-slate-600 dark:text-zinc-400">Questions this week</span>
                 <span className="font-bold text-slate-800 dark:text-zinc-50">{questionsPracticedThisWeek}</span>
               </div>
               <div className="flex justify-between text-sm">
                 <span className="text-slate-600 dark:text-zinc-400">Last mock score</span>
                 <span className="font-bold text-slate-800 dark:text-zinc-50">{lastMockScore ? `${lastMockScore}%` : 'N/A'}</span>
               </div>
             </div>
             <button onClick={() => navigate('/interview')} className="w-full py-2 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 hover:border-purple-300 dark:hover:border-purple-500 text-purple-700 dark:text-purple-400 rounded-xl text-sm font-semibold transition-colors">
               Practice Now
             </button>
          </Card>

          {/* 7. ACTIVE PROJECTS */}
          <Card className="flex flex-col">
             <div className="flex justify-between items-center mb-4">
               <h3 className="font-bold text-slate-800 dark:text-zinc-50 flex items-center gap-2"><LayoutDashboard className="text-indigo-500" size={18} /> Active Projects</h3>
             </div>
             <div className="space-y-3">
               {activeProjects.length === 0 ? (
                 <p className="text-sm text-slate-500 text-center py-4">No active projects.</p>
               ) : (
                 activeProjects.map(p => (
                   <div key={p.id} className="p-3 bg-slate-50 dark:bg-zinc-900/50 rounded-xl border border-slate-100 dark:border-zinc-800 cursor-pointer hover:border-indigo-300 transition-colors" onClick={()=>navigate('/projects')}>
                     <h4 className="font-bold text-slate-800 dark:text-zinc-50 text-sm mb-1 truncate">{p.name}</h4>
                     <div className="flex gap-2 items-center mb-2">
                       <div className="flex-1 h-1.5 bg-slate-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                         <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${p.completion_percentage}%` }}></div>
                       </div>
                       <span className="text-[10px] font-bold text-slate-500">{p.completion_percentage}%</span>
                     </div>
                     <p className="text-[11px] font-medium text-slate-500 truncate"><span className="text-slate-400">Next:</span> {p.next_milestone || 'N/A'}</p>
                   </div>
                 ))
               )}
             </div>
          </Card>

          {/* 9. FINANCE SNAPSHOT */}
          <Card className="flex flex-col">
             <div className="flex justify-between items-center mb-3">
               <h3 className="font-bold text-slate-800 dark:text-zinc-50 flex items-center gap-2"><Wallet className="text-emerald-500" size={18} /> Budget Snapshot</h3>
             </div>
             {budget === 0 ? (
               <div className="text-center py-4 space-y-2">
                 <p className="text-sm text-slate-500 font-medium">No budget set for this month.</p>
                 <button onClick={()=>navigate('/expenses')} className="text-emerald-600 text-sm font-semibold">Set Budget →</button>
               </div>
             ) : (
               <>
                 <div className="flex justify-between items-end mb-2">
                   <div>
                     <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Spent</span>
                     <span className="text-2xl font-bold text-slate-800 dark:text-zinc-50">₹{expenses.totalSpent.toLocaleString()}</span>
                   </div>
                   <div className="text-right">
                     <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Remaining</span>
                     <span className="text-sm font-bold text-emerald-600">₹{(budget - expenses.totalSpent).toLocaleString()}</span>
                   </div>
                 </div>
                 <div className="w-full h-2 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden mb-3">
                   <div className={`h-full rounded-full ${(expenses.totalSpent/budget) > 0.9 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min((expenses.totalSpent/budget)*100, 100)}%` }}></div>
                 </div>
                 <button onClick={() => navigate('/expenses')} className="w-full text-center text-xs font-bold text-slate-500 hover:text-emerald-600 transition-colors py-1">View Expenses →</button>
               </>
             )}
          </Card>

          {/* 11. AI DAILY INSIGHT */}
          <Card className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white border-none shadow-md relative overflow-hidden">
             <div className="relative z-10">
               <h3 className="font-bold flex items-center gap-2 mb-2 text-indigo-100"><Sparkles size={16} className="text-amber-300" /> AI Insight</h3>
               <p className="text-sm font-medium leading-relaxed opacity-95">You're strongest in consistency this week, having completed {completedTodayTasksCount} tasks today. Focus on your upcoming mock interview tomorrow to push your readiness over 80%!</p>
             </div>
             <Sparkles size={100} className="absolute -bottom-6 -right-6 text-white/10" />
          </Card>
        </div>
      </motion.div>
    </motion.div>
  );
}
