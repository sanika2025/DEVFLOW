import { BookOpen, Target, Clock, Zap } from 'lucide-react';
import { StatsCard } from '../components/StatsCard';
import { Card } from '../components/Card';
import { motion } from 'framer-motion';

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold text-slate-800">Good Morning Sanika 👋</h2>
        <p className="text-slate-500">Here's an overview of your learning progress today.</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatsCard 
          title="Hours Studied" 
          value="4.5h" 
          icon={Clock} 
          trend="+15%" 
          trendUp={true} 
        />
        <StatsCard 
          title="Tasks Completed" 
          value="12" 
          icon={Target} 
          trend="+3" 
          trendUp={true} 
        />
        <StatsCard 
          title="Current Streak" 
          value="7 Days" 
          icon={Zap} 
        />
        <StatsCard 
          title="XP Level" 
          value="Lvl 14" 
          icon={BookOpen} 
          trend="850 XP" 
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
               You've been studying React for 2 hours. I recommend taking a quick 10-minute quiz to reinforce your knowledge!
             </p>
             <button className="mt-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
               Start Quiz
             </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
