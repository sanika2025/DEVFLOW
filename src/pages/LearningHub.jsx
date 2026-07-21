import { BookOpen, PlayCircle, FileText, Code2, CheckCircle2, ChevronRight, BrainCircuit, Loader2 } from 'lucide-react';
import { Card } from '../components/Card';
import { useQuery } from '@tanstack/react-query';
import { courseService } from '../services/courseService';
import { lessonService } from '../services/lessonService';
import { useAuthStore } from '../store/useAuthStore';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

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

  // Automatically select the first day if nothing is selected
  const firstDay = roadmapData?.data?.[0]?.weeks?.[0]?.days?.[0];
  if (!activeDayId && firstDay) {
    setActiveDayId(firstDay.id);
  }

  const { data: lessonsData, isLoading: lessonsLoading } = useQuery({
    queryKey: ['lessons', activeDayId],
    queryFn: () => lessonService.getDayLessons(activeDayId),
    enabled: !!activeDayId
  });

  if (coursesLoading || roadmapLoading || lessonsLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  const days = roadmapData?.data?.[0]?.weeks?.[0]?.days || [];
  const currentDayInfo = days.find(d => d.id === activeDayId) || firstDay;
  const lessons = lessonsData?.data || [];

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 dark:text-zinc-50">Learning Hub</h2>
          <p className="text-slate-500 dark:text-zinc-400 mt-1">{currentDayInfo ? currentDayInfo.title : 'Select a day to start'}</p>
        </div>
        <div className="text-right">
          <div className="text-sm font-medium text-slate-500 dark:text-zinc-400 mb-1">Overall Progress</div>
          <div className="flex items-center gap-3">
            <div className="w-48 h-2 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 w-[0%] rounded-full"></div>
            </div>
            <span className="font-bold text-slate-700 dark:text-zinc-300">0%</span>
          </div>
        </div>
      </header>

      {/* Day Navigation */}
      {days.length > 0 && (
        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {days.map((day) => (
            <button
              key={day.id}
              onClick={() => setActiveDayId(day.id)}
              className={`whitespace-nowrap px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                activeDayId === day.id
                  ? 'bg-indigo-600 dark:bg-indigo-500 text-white shadow-md shadow-indigo-200 dark:shadow-indigo-900/50'
                  : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800 hover:border-slate-300 border border-slate-200 dark:border-zinc-800'
              }`}
            >
              Day {day.day_number}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-zinc-800 pb-4">
              <h3 className="font-semibold text-lg text-slate-800 dark:text-zinc-50">Today's Curriculum</h3>
              <span className="px-3 py-1 bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-500 font-medium text-xs rounded-full">
                {currentDayInfo?.difficulty || 'Beginner'}
              </span>
            </div>
            
            <div className="space-y-3">
              {lessons.length === 0 ? (
                <p className="text-slate-500 dark:text-zinc-400 text-center py-4">No lessons available for this day.</p>
              ) : (
                lessons.map((lesson, idx) => (
                  <Link to={`/learning/lesson/${lesson.id}`} key={lesson.id}>
                    <CurriculumItem 
                      icon={FileText} 
                      title={lesson.title} 
                      duration="10 mins" 
                      type="Article" 
                      active={idx === 0} 
                    />
                  </Link>
                ))
              )}
            </div>

            <button 
              onClick={() => lessons.length > 0 && navigate(`/learning/lesson/${lessons[0].id}`)}
              disabled={lessons.length === 0}
              className="mt-4 w-full bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-400 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
            >
              Continue Learning <ChevronRight w={18} h={18} />
            </button>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-indigo-50 dark:from-indigo-950/50 to-white dark:to-zinc-900 border-indigo-100 dark:border-indigo-900/50">
            <div className="flex items-center gap-2 mb-3">
              <BrainCircuit className="text-indigo-600 dark:text-indigo-400" size={20} />
              <h3 className="font-semibold text-indigo-900 dark:text-indigo-300">AI Summary</h3>
            </div>
            <p className="text-sm text-indigo-800/80 dark:text-indigo-200/80 leading-relaxed mb-4">
              Today you're focusing on core concepts. Make sure to complete the coding challenges associated with these lessons!
            </p>
          </Card>

          <Card>
            <h3 className="font-semibold text-slate-800 dark:text-zinc-50 mb-4">Resources</h3>
            <div className="space-y-3">
              <ResourceLink title="Official Docs" />
              <ResourceLink title="Community Examples" />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function CurriculumItem({ icon: Icon, title, duration, type, completed, active, locked }) {
  return (
    <div className={`flex items-center p-3 rounded-xl border transition-all ${active ? 'border-indigo-500 dark:border-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/20 shadow-sm' : 'border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 hover:border-slate-300 dark:hover:border-zinc-700'}`}>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${completed ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400' : active ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400' : 'bg-slate-200 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500'}`}>
        {completed ? <CheckCircle2 size={20} /> : <Icon size={20} />}
      </div>
      <div className="ml-4 flex-1">
        <h4 className={`font-medium ${locked ? 'text-slate-400 dark:text-zinc-500' : 'text-slate-800 dark:text-zinc-50'}`}>{title}</h4>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">{type}</span>
          <span className="w-1 h-1 bg-slate-300 dark:bg-zinc-700 rounded-full"></span>
          <span className="text-xs text-slate-500 dark:text-zinc-400">{duration}</span>
        </div>
      </div>
      {!locked && !completed && (
        <button className={`w-8 h-8 rounded-full flex items-center justify-center ${active ? 'bg-indigo-600 dark:bg-indigo-500 text-white hover:bg-indigo-700 dark:hover:bg-indigo-400' : 'bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-700'}`}>
          <PlayCircle size={16} />
        </button>
      )}
    </div>
  );
}

function ResourceLink({ title }) {
  return (
    <a href="#" className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-zinc-800 hover:border-indigo-200 dark:hover:border-indigo-800 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/30 transition-colors group">
      <span className="text-sm font-medium text-slate-700 dark:text-zinc-300 group-hover:text-indigo-700 dark:group-hover:text-indigo-400">{title}</span>
      <ChevronRight size={16} className="text-slate-400 dark:text-zinc-500 group-hover:text-indigo-500 dark:group-hover:text-indigo-400" />
    </a>
  );
}
