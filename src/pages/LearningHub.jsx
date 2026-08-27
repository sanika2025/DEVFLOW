import { BookOpen, PlayCircle, FileText, Code2, CheckCircle2, ChevronRight, BrainCircuit, Loader2, Star, Map, Lock, Trophy } from 'lucide-react';
import { Card } from '../components/Card';
import { useQuery } from '@tanstack/react-query';
import { courseService } from '../services/courseService';
import { lessonService } from '../services/lessonService';
import { progressService } from '../services/progressService';
import { useAuthStore } from '../store/useAuthStore';
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export default function LearningHub() {
  const { user } = useAuthStore();
  const [activeDayId, setActiveDayId] = useState(null);
  const navigate = useNavigate();

  // Fetch Courses (Assuming user is enrolled in the first one for now)
  const { data: coursesData, isLoading: coursesLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: courseService.getCourses
  });

  const mainCourseId = coursesData?.data?.[0]?.id;

  const { data: roadmapData, isLoading: roadmapLoading } = useQuery({
    queryKey: ['roadmap', mainCourseId],
    queryFn: () => courseService.getCourseFullRoadmap(mainCourseId),
    enabled: !!mainCourseId
  });

  const { data: progressQuery } = useQuery({
    queryKey: ['progress', user?.id],
    queryFn: () => progressService.getUserProgress(user?.id),
    enabled: !!user?.id
  });
  
  const userProgress = progressQuery?.data || [];

  // Automatically select the first day if nothing is selected
  const firstDay = roadmapData?.data?.[0]?.weeks?.[0]?.days?.[0];
  
  useEffect(() => {
    if (!activeDayId && firstDay) {
      setActiveDayId(firstDay.id);
    }
  }, [firstDay, activeDayId]);

  const { data: lessonsData, isLoading: lessonsLoading } = useQuery({
    queryKey: ['lessons', activeDayId],
    queryFn: () => lessonService.getDayLessons(activeDayId),
    enabled: !!activeDayId
  });

  if (coursesLoading || roadmapLoading) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  const days = roadmapData?.data?.[0]?.weeks?.[0]?.days || [];
  const currentDayInfo = days.find(d => d.id === activeDayId) || firstDay;
  const lessons = lessonsData?.data || [];

  return (
    <div className="space-y-8 pb-12">
      {/* Header with animated progress */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 bg-white dark:bg-zinc-900/90 backdrop-blur-sm p-6 rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-sm"
      >
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30 transform rotate-3">
            <Trophy className="text-white" size={32} />
          </div>
          <div>
            <h2 className="text-3xl font-extrabold text-slate-800 dark:text-zinc-50 tracking-tight">Your Journey</h2>
            <p className="text-slate-500 dark:text-zinc-400 font-medium mt-1 flex items-center gap-2">
              <Map size={16} /> Web Development Masterclass
            </p>
          </div>
        </div>
        <div className="md:text-right bg-slate-50 dark:bg-zinc-950 p-4 rounded-2xl border border-slate-100 dark:border-zinc-800">
          <div className="text-sm font-bold text-slate-500 dark:text-zinc-400 mb-2 uppercase tracking-wider flex justify-between gap-4">
            <span>Overall Mastery</span>
            <span className="text-indigo-600 dark:text-indigo-400">12%</span>
          </div>
          <div className="w-full md:w-56 h-3 bg-slate-200 dark:bg-zinc-800/60 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: '12%' }}
              transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
            />
          </div>
        </div>
      </motion.header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Gamified Roadmap Path (Left side) */}
        <div className="lg:col-span-5 relative py-8 px-4">
          <h3 className="text-xl font-bold text-slate-800 dark:text-zinc-50 mb-8 flex items-center gap-2">
            <Map className="text-indigo-500" />
            Path to Mastery
          </h3>
          
          <div className="relative pl-10 space-y-12">
            {/* Winding line background */}
            <div className="absolute top-0 bottom-0 left-[2.3rem] w-1 bg-slate-200 dark:bg-zinc-800/60 rounded-full"></div>
            
            {days.map((day, idx) => {
              const isActive = activeDayId === day.id;
              
              const dayProgress = userProgress.find(p => p.day?.id === day.id);
              const isCompleted = dayProgress?.status === 'completed';
              
              const firstIncompleteIdx = days.findIndex(d => {
                 const p = userProgress.find(up => up.day?.id === d.id);
                 return p?.status !== 'completed';
              });
              
              const isLocked = firstIncompleteIdx !== -1 && idx > firstIncompleteIdx;

              return (
                <motion.div 
                  key={day.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="relative group cursor-pointer"
                  onClick={() => !isLocked && setActiveDayId(day.id)}
                >
                  {/* Node Connector Line Fill */}
                  {isCompleted && idx !== days.length - 1 && (
                    <div className="absolute top-8 -bottom-12 left-[-1.05rem] w-1 bg-emerald-500 z-10" />
                  )}

                  {/* Node Circle */}
                  <div className={`absolute -left-[1.75rem] w-10 h-10 rounded-full flex items-center justify-center z-20 border-4 border-slate-50 dark:border-slate-950 transition-all duration-300
                    ${isActive ? 'bg-indigo-600 scale-125 shadow-[0_0_20px_rgba(79,70,229,0.5)]' : 
                      isCompleted ? 'bg-emerald-500' : 
                      isLocked ? 'bg-slate-200 dark:bg-zinc-800/60' : 'bg-slate-300 dark:bg-slate-700'}`
                  }
                  >
                    {isCompleted ? (
                      <CheckCircle2 size={20} className="text-white" />
                    ) : isLocked ? (
                      <Lock size={16} className="text-slate-400 dark:text-zinc-500" />
                    ) : (
                      <Star size={16} className={isActive ? 'text-white' : 'text-slate-500 dark:text-zinc-400'} />
                    )}
                  </div>

                  {/* Node Content Card */}
                  <motion.div 
                    whileHover={!isLocked ? { scale: 1.02, x: 5 } : {}}
                    className={`ml-6 p-5 rounded-2xl border transition-all ${
                      isActive ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20 shadow-md shadow-indigo-100 dark:shadow-indigo-900/10' : 
                      isLocked ? 'border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/90 backdrop-blur-sm/50 opacity-75 grayscale' : 
                      'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 backdrop-blur-sm hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-sm'
                    }`}
                  >
                    <div className="text-xs font-bold uppercase tracking-wider text-indigo-500 mb-1">
                      Level {day.day_number}
                    </div>
                    <h4 className={`font-bold text-lg ${isLocked ? 'text-slate-400 dark:text-zinc-500' : 'text-slate-800 dark:text-zinc-50'}`}>
                      {day.title}
                    </h4>
                    <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1 line-clamp-1">
                      {day.description || 'Master the fundamental concepts and practical applications.'}
                    </p>
                  </motion.div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Selected Day Content (Right side) */}
        <div className="lg:col-span-7">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeDayId}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6 sticky top-8"
            >
              {currentDayInfo && (
                <Card className="flex flex-col gap-6 bg-gradient-to-br from-white dark:bg-zinc-900/90 backdrop-blur-sm dark:bg-none to-indigo-50/30 /20 border-indigo-100 dark:border-indigo-900/50 shadow-xl shadow-indigo-100/20 dark:shadow-black/20">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400 font-bold text-xs rounded-full mb-3 uppercase tracking-wide">
                        <Star size={14} /> Level {currentDayInfo.day_number}
                      </div>
                      <h3 className="font-extrabold text-2xl text-slate-900 dark:text-zinc-50 mb-2">{currentDayInfo.title}</h3>
                      <p className="text-slate-600 dark:text-zinc-400 font-medium">
                        {currentDayInfo.description || 'Complete the quests below to earn mastery points and unlock the next level.'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="font-bold text-slate-800 dark:text-zinc-300 flex items-center gap-2">
                      <FileText className="text-indigo-500" size={18} /> Available Quests
                    </h4>
                    
                    {lessonsLoading ? (
                      <div className="py-8 flex justify-center"><Loader2 className="animate-spin text-indigo-500" /></div>
                    ) : lessons.length === 0 ? (
                      <div className="p-8 text-center bg-slate-50 dark:bg-zinc-950 rounded-2xl border border-dashed border-slate-300 dark:border-zinc-800 text-slate-500">
                        No quests available for this level yet.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {lessons.map((lesson, idx) => (
                          <Link to={`/learning/lesson/${lesson.id}`} key={lesson.id}>
                            <motion.div whileHover={{ scale: 1.01 }}>
                              <CurriculumItem 
                                icon={Code2} 
                                title={lesson.title} 
                                duration="15 mins" 
                                type="Interactive" 
                                active={idx === 0} 
                              />
                            </motion.div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>

                  <button 
                    onClick={() => lessons.length > 0 && navigate(`/learning/lesson/${lessons[0].id}`)}
                    disabled={lessons.length === 0}
                    className="mt-2 w-full bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-400 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white py-4 rounded-xl font-bold transition-all hover:shadow-lg hover:shadow-indigo-500/30 flex items-center justify-center gap-2"
                  >
                    Start Mission <ChevronRight size={20} />
                  </button>
                </Card>
              )}

              {/* AI Coach Hint Box */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card className="bg-slate-900 text-white border-0 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-500/30 flex items-center justify-center">
                        <BrainCircuit className="text-indigo-400" size={18} />
                      </div>
                      <h3 className="font-bold text-indigo-300">Coach's Advice</h3>
                    </div>
                    <p className="text-slate-300 text-sm leading-relaxed">
                      "Pay close attention to today's core concepts. You'll need them to conquer the boss challenge in the upcoming quiz!"
                    </p>
                  </div>
                </Card>
              </motion.div>

            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function CurriculumItem({ icon: Icon, title, duration, type, completed, active, locked }) {
  return (
    <div className={`flex items-center p-4 rounded-xl border transition-all ${active ? 'border-indigo-500 dark:border-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/30 shadow-sm' : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:border-slate-300 dark:hover:border-zinc-700'}`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${completed ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400' : active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'bg-slate-100 dark:bg-zinc-800/60 text-slate-500 dark:text-zinc-400'}`}>
        {completed ? <CheckCircle2 size={24} /> : <Icon size={24} />}
      </div>
      <div className="ml-4 flex-1">
        <h4 className={`font-bold text-sm mb-1 ${locked ? 'text-slate-400 dark:text-zinc-500' : 'text-slate-800 dark:text-zinc-50'}`}>{title}</h4>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${active ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300' : 'bg-slate-100 text-slate-500 dark:bg-zinc-800/60 dark:text-zinc-400'}`}>{type}</span>
          <span className="w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full"></span>
          <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">{duration}</span>
        </div>
      </div>
      {!locked && !completed && (
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${active ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400' : 'bg-slate-50 dark:bg-zinc-900/90 backdrop-blur-sm text-slate-400 dark:text-zinc-500'}`}>
          <PlayCircle size={20} />
        </div>
      )}
    </div>
  );
}
