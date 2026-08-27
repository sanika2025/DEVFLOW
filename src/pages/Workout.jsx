import { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workoutService } from '../services/workoutService';
import { useAuthStore } from '../store/useAuthStore';
import { Card } from '../components/Card';
import { Modal } from '../components/Modal';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Flame, Dumbbell, Clock, Calendar as CalendarIcon, CheckCircle2, PlayCircle, Plus, Trash2, GripVertical, Target, X, Trophy, Loader2 } from 'lucide-react';

export default function Workout() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const location = useLocation();
  
  // Local state
  const [isRoutineModalOpen, setIsRoutineModalOpen] = useState(location.state?.openCreateModal || false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [activeSession, setActiveSession] = useState(null); // When not null, we are in active workout mode
  
  // Data Fetching
  const { data: routinesData, isLoading: routinesLoading } = useQuery({
    queryKey: ['workout_routines', user?.id],
    queryFn: () => workoutService.getWorkoutRoutines(user?.id),
    enabled: !!user?.id
  });

  const { data: sessionsData, isLoading: sessionsLoading } = useQuery({
    queryKey: ['workout_sessions', user?.id],
    queryFn: () => workoutService.getWorkoutSessions(user?.id),
    enabled: !!user?.id
  });

  const { data: goalsData, isLoading: goalsLoading } = useQuery({
    queryKey: ['workout_goals', user?.id],
    queryFn: () => workoutService.getWorkoutGoals(user?.id),
    enabled: !!user?.id
  });

  const routines = routinesData?.data || [];
  const sessions = sessionsData?.data || [];
  const goals = goalsData?.data || { weekly_target: 3, monthly_target: 12 };

  // Calculate Stats
  const stats = useMemo(() => {
    let streak = 0;
    let thisMonth = 0;
    let totalMinutes = 0;
    let thisWeek = 0;
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const dayOfWeek = today.getDay(); // 0 is Sunday
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1)); // Monday as start
    
    // Sort completed sessions descending by date
    const completedSessions = sessions.filter(s => s.is_completed && s.end_time).sort((a, b) => new Date(b.end_time) - new Date(a.end_time));
    
    // Unique dates for streak
    const sessionDates = [...new Set(completedSessions.map(s => new Date(s.end_time).toDateString()))].map(d => new Date(d));
    
    let currentCheckDate = new Date(today);
    for (let i = 0; i < sessionDates.length; i++) {
      const diffTime = Math.abs(currentCheckDate - sessionDates[i]);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0 || diffDays === 1) {
        if (diffDays === 1) currentCheckDate.setDate(currentCheckDate.getDate() - 1);
        if (diffDays === 0 && streak === 0 && currentCheckDate.getTime() !== today.getTime()) {
           // Started matching on a past date, meaning today is missed, but streak can continue if yesterday was done
        }
        streak++;
      } else if (streak === 0 && diffDays === 1) {
        // Missed today, but yesterday was done
        streak++;
        currentCheckDate.setDate(currentCheckDate.getDate() - 1);
      } else {
        break;
      }
    }
    // Prevent double counting if multiple workouts on the same day
    streak = Math.min(streak, sessionDates.length);

    completedSessions.forEach(s => {
      const d = new Date(s.end_time);
      if (d >= startOfMonth) thisMonth++;
      if (d >= startOfWeek) thisWeek++;
      totalMinutes += (s.duration_minutes || 0);
    });

    const consistency = Math.min(Math.round((thisWeek / (goals.weekly_target || 1)) * 100), 100);

    return {
      streak,
      workoutsThisMonth: thisMonth,
      totalHours: Math.floor(totalMinutes / 60),
      totalMins: totalMinutes % 60,
      workoutsThisWeek: thisWeek,
      consistency
    };
  }, [sessions, goals]);

  // Find today's scheduled workout
  const todayWorkout = useMemo(() => {
    const todayDay = new Date().getDay(); // 0-6
    // Check if we have completed a session today
    const completedToday = sessions.find(s => s.is_completed && new Date(s.end_time).toDateString() === new Date().toDateString());
    if (completedToday) return { type: 'completed', session: completedToday };

    // Find a routine scheduled for today
    const scheduled = routines.find(r => r.days_of_week && r.days_of_week.includes(todayDay));
    if (scheduled) return { type: 'scheduled', routine: scheduled };
    
    return { type: 'rest' };
  }, [routines, sessions]);

  // Mutations
  const createRoutineMutation = useMutation({
    mutationFn: async (routineData) => {
      const { exercises, ...routine } = routineData;
      const rRes = await workoutService.addWorkoutRoutine(user.id, routine);
      if (rRes.success && exercises.length > 0) {
        await workoutService.addExercises(rRes.data.id, exercises);
      }
      return rRes;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout_routines'] });
      setIsRoutineModalOpen(false);
    }
  });

  const deleteRoutineMutation = useMutation({
    mutationFn: (id) => workoutService.deleteWorkoutRoutine(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workout_routines'] })
  });

  const updateGoalsMutation = useMutation({
    mutationFn: (newGoals) => workoutService.saveWorkoutGoals(user.id, newGoals.weekly_target, newGoals.monthly_target),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout_goals'] });
      setIsGoalModalOpen(false);
    }
  });

  const isLoading = routinesLoading || sessionsLoading || goalsLoading;

  if (isLoading) {
    return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-indigo-600" /></div>;
  }

  if (activeSession) {
    return <ActiveWorkoutSession sessionInfo={activeSession} onFinish={() => setActiveSession(null)} />;
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-800 dark:text-zinc-50">Workout</h2>
          <p className="text-slate-500 dark:text-zinc-400 mt-1">Stay consistent, track your progress, and keep your routine simple.</p>
        </div>
        <button 
          onClick={() => setIsRoutineModalOpen(true)}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium shadow-sm hover:bg-indigo-700 transition-colors flex items-center gap-2"
        >
          <Plus size={18} /> New Routine
        </button>
      </header>

      {/* Today's Workout & Weekly Tracker Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 relative overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 border-none shadow-lg shadow-indigo-200 dark:shadow-none text-white">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Dumbbell size={120} />
          </div>
          <h3 className="font-semibold text-indigo-100 mb-2">Today's Workout</h3>
          
          {todayWorkout.type === 'completed' && (
            <div className="flex flex-col gap-4 relative z-10">
              <div className="flex items-center gap-3">
                <CheckCircle2 size={32} className="text-emerald-400" />
                <h4 className="text-3xl font-bold">Workout Completed</h4>
              </div>
              <p className="text-indigo-100 flex items-center gap-2">
                <Clock size={16} /> {todayWorkout.session.duration_minutes} min 
                <span className="mx-2">•</span> 
                <Activity size={16} /> {todayWorkout.session.workout_sets?.length || 0} sets
              </p>
            </div>
          )}

          {todayWorkout.type === 'scheduled' && (
            <div className="flex flex-col gap-4 relative z-10">
              <h4 className="text-3xl font-bold">{todayWorkout.routine.title}</h4>
              <div className="flex flex-wrap gap-4 text-indigo-100">
                <span className="flex items-center gap-1.5"><Activity size={18} /> {todayWorkout.routine.workout_exercises?.length || 0} exercises</span>
                <span className="flex items-center gap-1.5"><Clock size={18} /> ~{todayWorkout.routine.estimated_duration || 45} min</span>
                <span className="flex items-center gap-1.5 bg-white/20 px-2 py-0.5 rounded-md text-sm">{todayWorkout.routine.difficulty || 'Intermediate'}</span>
              </div>
              <div className="mt-2">
                <button 
                  onClick={() => setActiveSession(todayWorkout.routine)}
                  className="bg-white text-indigo-600 px-6 py-3 rounded-xl font-bold shadow-md hover:bg-slate-50 transition-colors flex items-center gap-2"
                >
                  <PlayCircle size={20} /> Start Workout
                </button>
              </div>
            </div>
          )}

          {todayWorkout.type === 'rest' && (
            <div className="flex flex-col gap-4 relative z-10 py-2">
              <h4 className="text-3xl font-bold">Rest Day</h4>
              <p className="text-indigo-100 text-lg">Your muscles are recovering. Enjoy your day off!</p>
            </div>
          )}
        </Card>

        {/* Weekly Activity */}
        <Card className="flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-slate-800 dark:text-zinc-50 mb-4">This Week</h3>
            <div className="flex justify-between items-center mb-2">
              <span className="text-3xl font-bold text-slate-800 dark:text-zinc-50">{stats.workoutsThisWeek} <span className="text-lg text-slate-400 font-medium">/ {goals.weekly_target}</span></span>
              <span className="text-sm font-medium text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 dark:text-indigo-400 px-2.5 py-1 rounded-full">
                {stats.consistency}% Goal
              </span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-zinc-800 rounded-full h-2.5 mb-6 overflow-hidden">
              <div className="bg-emerald-500 h-2.5 rounded-full" style={{ width: `${Math.min((stats.workoutsThisWeek / goals.weekly_target) * 100, 100)}%` }}></div>
            </div>
            
            <div className="flex justify-between gap-1">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => {
                const now = new Date();
                const dayOfWeek = now.getDay();
                const currIdx = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // 0-6 for Mon-Sun
                const isPast = idx <= currIdx;
                
                // Determine if workout was completed on this relative day
                const checkDate = new Date(now);
                checkDate.setDate(now.getDate() - (currIdx - idx));
                
                const didWorkout = sessions.some(s => s.is_completed && new Date(s.end_time).toDateString() === checkDate.toDateString());
                
                let icon = <div className="w-2 h-2 rounded-full bg-slate-200 dark:bg-zinc-700"></div>; // planned/empty
                if (didWorkout) {
                  icon = <CheckCircle2 size={16} className="text-emerald-500" />;
                } else if (isPast) {
                  icon = <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-zinc-600"></div>; // missed/rest
                }
                
                return (
                  <div key={idx} className="flex flex-col items-center gap-2">
                    <span className="text-xs font-medium text-slate-400">{day}</span>
                    <div className="h-6 flex items-center justify-center">
                      {icon}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="flex flex-col items-center justify-center py-6 text-center">
          <Flame className="text-orange-500 mb-2" size={28} />
          <span className="text-2xl font-bold text-slate-800 dark:text-zinc-50">{stats.streak} days</span>
          <span className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-1">Current Streak</span>
        </Card>
        <Card className="flex flex-col items-center justify-center py-6 text-center">
          <Dumbbell className="text-indigo-500 mb-2" size={28} />
          <span className="text-2xl font-bold text-slate-800 dark:text-zinc-50">{stats.workoutsThisMonth}</span>
          <span className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-1">This Month</span>
        </Card>
        <Card className="flex flex-col items-center justify-center py-6 text-center">
          <Clock className="text-blue-500 mb-2" size={28} />
          <span className="text-2xl font-bold text-slate-800 dark:text-zinc-50">{stats.totalHours}h {stats.totalMins}m</span>
          <span className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-1">Total Time</span>
        </Card>
        <Card className="flex flex-col items-center justify-center py-6 text-center">
          <Target className="text-emerald-500 mb-2" size={28} />
          <span className="text-2xl font-bold text-slate-800 dark:text-zinc-50">{stats.consistency}%</span>
          <span className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-1">Consistency</span>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-slate-800 dark:text-zinc-50">My Routines</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {routines.map(routine => (
              <Card key={routine.id} className="flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-lg text-slate-800 dark:text-zinc-50 truncate pr-2">{routine.title}</h4>
                  <button onClick={() => deleteRoutineMutation.mutate(routine.id)} className="text-slate-400 hover:text-red-500 transition-colors shrink-0">
                    <Trash2 size={16} />
                  </button>
                </div>
                <p className="text-sm text-slate-500 mb-4 line-clamp-2 min-h-[40px]">{routine.description || 'No description provided.'}</p>
                <div className="text-xs font-medium text-slate-500 mb-4 flex flex-col gap-1.5">
                  <span className="flex items-center gap-1.5"><Activity size={14} className="text-indigo-400" /> {routine.workout_exercises?.length || 0} exercises • {routine.estimated_duration || 45} min</span>
                  <span className="flex items-center gap-1.5"><CalendarIcon size={14} className="text-blue-400" /> 
                    {routine.days_of_week?.length > 0 
                      ? routine.days_of_week.map(d => ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d]).join(', ')
                      : 'Not scheduled'}
                  </span>
                </div>
                <div className="mt-auto pt-4 border-t border-slate-100 dark:border-zinc-800/50 flex gap-2">
                  <button onClick={() => setActiveSession(routine)} className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 py-2 rounded-lg font-medium text-sm transition-colors text-center">
                    Start
                  </button>
                  <button className="px-4 text-sm font-medium text-slate-500 hover:text-indigo-600 bg-slate-50 dark:bg-zinc-800/50 rounded-lg transition-colors">Edit</button>
                </div>
              </Card>
            ))}
            
            {routines.length === 0 && (
              <div className="col-span-1 md:col-span-2">
                <Card className="text-center py-10 border-2 border-dashed bg-transparent border-slate-200 dark:border-zinc-800">
                  <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Dumbbell className="text-indigo-500" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-800 dark:text-zinc-50 mb-1">Build your routine</h4>
                  <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6">Create a simple workout plan and start tracking your consistency.</p>
                  <button onClick={() => setIsRoutineModalOpen(true)} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium shadow-sm hover:bg-indigo-700 transition-colors">
                    + Create Routine
                  </button>
                  
                  <div className="mt-8 pt-8 border-t border-slate-100 dark:border-zinc-800/50 text-left">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-2">Templates</span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                      {['Full Body', 'Upper / Lower', 'Beginner'].map(t => (
                        <div key={t} className="p-3 bg-white dark:bg-zinc-900 rounded-lg border border-slate-100 dark:border-zinc-800 text-sm font-medium text-slate-700 dark:text-zinc-300 hover:border-indigo-300 cursor-pointer transition-colors text-center">
                          {t}
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-slate-800 dark:text-zinc-50">Goals</h3>
              <button onClick={() => setIsGoalModalOpen(true)} className="text-sm text-indigo-600 font-medium hover:underline">Edit</button>
            </div>
            <Card className="flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-slate-700 dark:text-zinc-300 font-medium">
                  <Target size={16} className="text-blue-500" /> Weekly
                </div>
                <span className="font-bold">{stats.workoutsThisWeek} / {goals.weekly_target}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-slate-700 dark:text-zinc-300 font-medium">
                  <Trophy size={16} className="text-amber-500" /> Monthly
                </div>
                <span className="font-bold">{stats.workoutsThisMonth} / {goals.monthly_target}</span>
              </div>
            </Card>
          </div>

          <div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-zinc-50 mb-4">Workout History</h3>
            <div className="space-y-3">
              {sessions.filter(s => s.is_completed).slice(0, 5).map(session => (
                <div key={session.id} className="flex items-center justify-between p-3 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-xl">
                  <div>
                    <h5 className="font-semibold text-slate-800 dark:text-zinc-50 text-sm">{session.workout_routines?.title || 'Custom Workout'}</h5>
                    <p className="text-xs text-slate-500">{new Date(session.end_time).toLocaleDateString(undefined, { month: 'short', day: 'numeric'})} • {session.duration_minutes} min</p>
                  </div>
                  <div className="text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 p-1.5 rounded-full">
                    <CheckCircle2 size={16} />
                  </div>
                </div>
              ))}
              {sessions.filter(s => s.is_completed).length === 0 && (
                <p className="text-sm text-slate-500 text-center py-6">No workouts completed yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <CreateRoutineModal isOpen={isRoutineModalOpen} onClose={() => setIsRoutineModalOpen(false)} onSubmit={(data) => createRoutineMutation.mutate(data)} isPending={createRoutineMutation.isPending} />
      
      <Modal isOpen={isGoalModalOpen} onClose={() => setIsGoalModalOpen(false)} title="Personal Goals">
        <form onSubmit={(e) => {
          e.preventDefault();
          updateGoalsMutation.mutate({
            weekly_target: parseInt(e.target.weekly.value),
            monthly_target: parseInt(e.target.monthly.value)
          });
        }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1">Weekly Goal (workouts)</label>
            <input name="weekly" type="number" defaultValue={goals.weekly_target} min="1" max="7" className="w-full border rounded-lg px-3 py-2 bg-transparent dark:border-zinc-800" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1">Monthly Goal (workouts)</label>
            <input name="monthly" type="number" defaultValue={goals.monthly_target} min="1" max="31" className="w-full border rounded-lg px-3 py-2 bg-transparent dark:border-zinc-800" />
          </div>
          <button type="submit" disabled={updateGoalsMutation.isPending} className="w-full bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors">
            {updateGoalsMutation.isPending ? 'Saving...' : 'Save Goals'}
          </button>
        </form>
      </Modal>

    </div>
  );
}

// ----------------------------------------------------------------------
// Subcomponents
// ----------------------------------------------------------------------

function CreateRoutineModal({ isOpen, onClose, onSubmit, isPending }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState('Intermediate');
  const [days, setDays] = useState([]);
  const [duration, setDuration] = useState(45);
  const [exercises, setExercises] = useState([]);

  useEffect(() => {
    if (isOpen) {
      setTitle(''); setDescription(''); setDifficulty('Intermediate'); setDays([]); setDuration(45); setExercises([]);
    }
  }, [isOpen]);

  const handleAddExercise = () => {
    setExercises([...exercises, { id: Date.now(), name: '', sets: 3, reps: 10, weight_lbs: 0, rest_time: 60, order_index: exercises.length }]);
  };

  const handleRemoveExercise = (idx) => {
    setExercises(exercises.filter((_, i) => i !== idx));
  };

  const updateExercise = (idx, field, value) => {
    const newEx = [...exercises];
    newEx[idx][field] = value;
    setExercises(newEx);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      title, description, difficulty, days_of_week: days, estimated_duration: duration,
      exercises: exercises.map((ex, idx) => ({ ...ex, order_index: idx }))
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Routine" className="max-w-2xl w-full">
      <form onSubmit={handleSubmit} className="space-y-6 max-h-[70vh] overflow-y-auto px-1 pb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1">Routine Name</label>
            <input required type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Upper Body Power" className="w-full border rounded-lg px-3 py-2 bg-transparent dark:border-zinc-800" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows="2" className="w-full border rounded-lg px-3 py-2 bg-transparent dark:border-zinc-800"></textarea>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1">Difficulty</label>
            <select value={difficulty} onChange={e => setDifficulty(e.target.value)} className="w-full border rounded-lg px-3 py-2 bg-transparent dark:border-zinc-800">
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Advanced</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1">Est. Duration (min)</label>
            <input type="number" value={duration} onChange={e => setDuration(parseInt(e.target.value))} className="w-full border rounded-lg px-3 py-2 bg-transparent dark:border-zinc-800" />
          </div>
          <div className="md:col-span-2">
             <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-2">Scheduled Days</label>
             <div className="flex gap-2 flex-wrap">
               {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => (
                 <button 
                   key={i} type="button" 
                   onClick={() => setDays(days.includes(i) ? days.filter(x => x !== i) : [...days, i])}
                   className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${days.includes(i) ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'}`}
                 >{d}</button>
               ))}
             </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-zinc-800">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-semibold text-slate-800 dark:text-zinc-50">Exercises</h4>
            <button type="button" onClick={handleAddExercise} className="text-sm font-medium text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
              <Plus size={16} /> Add Exercise
            </button>
          </div>
          
          <div className="space-y-3">
            {exercises.map((ex, idx) => (
              <div key={ex.id} className="flex flex-wrap md:flex-nowrap items-center gap-3 p-3 bg-slate-50 dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800">
                <GripVertical size={16} className="text-slate-400 cursor-move shrink-0 hidden md:block" />
                <input required type="text" placeholder="Exercise name" value={ex.name} onChange={e => updateExercise(idx, 'name', e.target.value)} className="flex-1 min-w-[150px] border rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-zinc-950 dark:border-zinc-800" />
                <div className="flex items-center gap-2 shrink-0">
                  <input type="number" min="1" value={ex.sets} onChange={e => updateExercise(idx, 'sets', parseInt(e.target.value))} className="w-16 border rounded-lg px-2 py-1.5 text-sm bg-white dark:bg-zinc-950 dark:border-zinc-800" title="Sets" />
                  <span className="text-slate-400 text-xs">×</span>
                  <input type="number" min="1" value={ex.reps} onChange={e => updateExercise(idx, 'reps', parseInt(e.target.value))} className="w-16 border rounded-lg px-2 py-1.5 text-sm bg-white dark:bg-zinc-950 dark:border-zinc-800" title="Reps" />
                </div>
                <button type="button" onClick={() => handleRemoveExercise(idx)} className="p-1.5 text-slate-400 hover:text-red-500 bg-white dark:bg-zinc-950 rounded-lg border border-slate-200 dark:border-zinc-800 ml-auto md:ml-0 shrink-0">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            {exercises.length === 0 && (
              <p className="text-sm text-center text-slate-400 py-4 border border-dashed rounded-xl dark:border-zinc-800">No exercises added yet.</p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6">
          <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">Cancel</button>
          <button type="submit" disabled={isPending} className="px-5 py-2.5 rounded-xl font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors">Create Routine</button>
        </div>
      </form>
    </Modal>
  );
}

function ActiveWorkoutSession({ sessionInfo, onFinish }) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const exercises = sessionInfo.workout_exercises || [];
  
  const [currentExIdx, setCurrentExIdx] = useState(0);
  const [completedSets, setCompletedSets] = useState({}); // { 'exId-setNum': true }
  const [restTimer, setRestTimer] = useState(0);
  const [startTime] = useState(new Date());
  
  const currentEx = exercises[currentExIdx];

  // Rest Timer Logic
  useEffect(() => {
    let interval;
    if (restTimer > 0) {
      interval = setInterval(() => setRestTimer(prev => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [restTimer]);

  const handleCompleteSet = (exId, setNum) => {
    setCompletedSets(prev => ({ ...prev, [`${exId}-${setNum}`]: true }));
    if (currentEx.rest_time) {
      setRestTimer(currentEx.rest_time);
    }
  };

  const handleFinishWorkout = async () => {
    const durationMinutes = Math.round((new Date() - startTime) / 60000);
    
    // Create session in backend
    const sRes = await workoutService.startSession(user.id, sessionInfo.id);
    if (sRes.success) {
      const sessionId = sRes.data.id;
      
      // Save sets
      const payloadSets = [];
      exercises.forEach(ex => {
        for (let i = 1; i <= ex.sets; i++) {
          payloadSets.push({
            exercise_id: ex.id,
            set_number: i,
            reps_completed: ex.reps,
            weight_used: ex.weight_lbs,
            is_completed: !!completedSets[`${ex.id}-${i}`]
          });
        }
      });
      await workoutService.saveSets(sessionId, payloadSets);
      await workoutService.completeSession(sessionId, durationMinutes);
      
      queryClient.invalidateQueries({ queryKey: ['workout_sessions'] });
    }
    onFinish();
  };

  if (exercises.length === 0) {
    return (
      <div className="text-center p-12">
        <p className="mb-4">This routine has no exercises.</p>
        <button onClick={onFinish} className="px-4 py-2 bg-indigo-600 text-white rounded-lg">Go Back</button>
      </div>
    );
  }

  const isLastExercise = currentExIdx === exercises.length - 1;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-800 dark:text-zinc-50">{sessionInfo.title}</h2>
          <p className="text-indigo-600 font-medium">Session in progress • {Math.round((new Date() - startTime) / 60000)} min elapsed</p>
        </div>
        <button onClick={handleFinishWorkout} className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-md transition-colors flex items-center gap-2">
          <CheckCircle2 size={20} /> Finish Workout
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {exercises.map((ex, idx) => (
          <button 
            key={ex.id} 
            onClick={() => setCurrentExIdx(idx)}
            className={`shrink-0 px-4 py-2 rounded-lg text-sm font-bold transition-all border ${idx === currentExIdx ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-800'}`}
          >
            {idx + 1}. {ex.name}
          </button>
        ))}
      </div>

      <Card className="min-h-[400px] flex flex-col relative overflow-hidden">
        {restTimer > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-4 right-4 bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 px-4 py-2 rounded-full font-bold flex items-center gap-2"
          >
            <Clock size={16} /> Rest: {Math.floor(restTimer / 60).toString().padStart(2, '0')}:{(restTimer % 60).toString().padStart(2, '0')}
            <button onClick={() => setRestTimer(0)} className="ml-2 bg-white/50 dark:bg-black/20 p-1 rounded-md text-xs hover:bg-white dark:hover:bg-black/40">Skip</button>
          </motion.div>
        )}

        <div className="text-center mb-8 mt-4">
          <h3 className="text-4xl font-black text-slate-800 dark:text-zinc-50 mb-2">{currentEx.name}</h3>
          <p className="text-slate-500 text-lg font-medium">{currentEx.sets} sets × {currentEx.reps} reps {currentEx.weight_lbs > 0 && `• ${currentEx.weight_lbs} lbs`}</p>
        </div>

        <div className="space-y-4 flex-1">
          {Array.from({ length: currentEx.sets }).map((_, i) => {
            const setNum = i + 1;
            const isCompleted = completedSets[`${currentEx.id}-${setNum}`];
            return (
              <div key={setNum} className={`flex items-center justify-between p-4 rounded-xl border transition-all ${isCompleted ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/30' : 'bg-slate-50 border-slate-200 dark:bg-zinc-900/50 dark:border-zinc-800'}`}>
                <div className="flex items-center gap-4 text-lg font-semibold">
                  <span className="w-8 h-8 rounded-full bg-white dark:bg-zinc-800 flex items-center justify-center shadow-sm text-slate-500">{setNum}</span>
                  <span className={isCompleted ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-700 dark:text-zinc-300'}>{currentEx.reps} reps</span>
                </div>
                <button 
                  onClick={() => !isCompleted && handleCompleteSet(currentEx.id, setNum)}
                  className={`px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 transition-colors ${isCompleted ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 cursor-default' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                >
                  {isCompleted ? <><CheckCircle2 size={18} /> Done</> : 'Complete Set'}
                </button>
              </div>
            );
          })}
        </div>

        <div className="mt-8 pt-4 border-t border-slate-100 dark:border-zinc-800 flex justify-between">
          <button onClick={() => setCurrentExIdx(Math.max(0, currentExIdx - 1))} disabled={currentExIdx === 0} className="px-5 py-2.5 rounded-xl font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-800 disabled:opacity-30 transition-colors">Previous</button>
          {!isLastExercise ? (
            <button onClick={() => setCurrentExIdx(currentExIdx + 1)} className="px-5 py-2.5 rounded-xl font-medium text-white bg-slate-800 hover:bg-slate-900 dark:bg-zinc-100 dark:text-zinc-900 transition-colors flex items-center gap-2">Next Exercise <ChevronRight size={18}/></button>
          ) : (
            <button onClick={handleFinishWorkout} className="px-5 py-2.5 rounded-xl font-bold text-white bg-emerald-500 hover:bg-emerald-600 transition-colors">Complete Session</button>
          )}
        </div>
      </Card>
    </div>
  );
}

// Ensure ChevronRight is imported or add a simple SVG
function ChevronRight(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m9 18 6-6-6-6"/></svg>
  )
}
