import { BookOpen, Target, Clock, Zap, Loader2 } from 'lucide-react';
import { StatsCard } from '../components/StatsCard';
import { Card } from '../components/Card';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/useAuthStore';
import { useQuery } from '@tanstack/react-query';
import { progressService } from '../services/progressService';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { user, profile } = useAuthStore();
  
  const { data, isLoading } = useQuery({
    queryKey: ['progress', user?.id],
    queryFn: () => progressService.getUserProgress(user?.id),
    enabled: !!user?.id
  });

  const progressData = data?.data || [];
  const completedTasks = progressData.filter(p => p.status === 'completed').length;
  const hoursStudied = progressData
    .filter(p => p.status === 'completed')
    .reduce((acc, curr) => acc + (curr.day?.estimated_hours || 0), 0);
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold text-slate-800">Good Morning {profile?.full_name?.split(' ')[0] || 'User'} 👋</h2>
        <p className="text-slate-500">Here's an overview of your learning progress today.</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatsCard 
          title="Hours Studied" 
          value={`${hoursStudied.toFixed(1)}h`}
          icon={Clock} 
          trendUp={true} 
        />
        <StatsCard 
          title="Tasks Completed" 
          value={completedTasks.toString()} 
          icon={Target} 
          trendUp={true} 
        />
        <StatsCard 
          title="Current Streak" 
          value="1 Days" 
          icon={Zap} 
        />
        <StatsCard 
          title="XP Level" 
          value={`Lvl ${profile?.xp_level || 1}`} 
          icon={BookOpen} 
          trend={`${profile?.xp_points || 0} XP`} 
          trendUp={true} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 min-h-[400px]">
          <h3 className="font-semibold text-slate-800 mb-4">Weekly Progress Activity</h3>
          <div className="flex items-center justify-center h-[300px] bg-slate-50 rounded-xl border border-dashed border-slate-200">
             <span className="text-slate-400">Chart Placeholder</span>
          </div>
        </Card>
        
        <Card className="flex flex-col gap-4">
          <h3 className="font-semibold text-slate-800">Today's AI Recommendation</h3>
          <div className="flex-1 bg-indigo-50/50 rounded-xl p-4 border border-indigo-100 flex flex-col justify-center items-center text-center gap-3">
             <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center text-2xl">
               🤖
             </div>
             <p className="text-sm text-indigo-900">
               Based on your current progress, I recommend diving into today's lessons!
             </p>
             <Link to="/learning" className="mt-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
               Go to Learning Hub
             </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
