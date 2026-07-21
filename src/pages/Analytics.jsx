import { Card } from '../components/Card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Calendar, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { progressService } from '../services/progressService';
import { useAuthStore } from '../store/useAuthStore';
import { useMemo } from 'react';

export default function Analytics() {
  const { user } = useAuthStore();

  const { data: progressData, isLoading } = useQuery({
    queryKey: ['progress', user?.id],
    queryFn: () => progressService.getUserProgress(user?.id),
    enabled: !!user?.id
  });

  const chartData = useMemo(() => {
    if (!progressData?.data) return [];
    
    // Create a mock past 7 days data structure based on completed days
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    let mockData = days.map(d => ({ name: d, score: 0, time: 0 }));

    progressData.data.forEach(p => {
      if (p.completed_at) {
        const d = new Date(p.completed_at).getDay();
        mockData[d].score += 1000;
        mockData[d].time += 60; // 1 hr per day mock
      }
    });

    return mockData;
  }, [progressData]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-indigo-600" size={32} /></div>;
  }

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-3xl font-bold text-slate-800">Analytics</h2>
        <p className="text-slate-500 mt-1">Detailed breakdown of your learning and productivity.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold text-slate-800">Study Time & Focus</h3>
            <button className="text-slate-500 p-2 hover:bg-slate-50 rounded-lg"><Calendar size={18} /></button>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTime" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Area type="monotone" dataKey="time" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorTime)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold text-slate-800">Interview Score Trend</h3>
            <button className="text-slate-500 p-2 hover:bg-slate-50 rounded-lg"><Calendar size={18} /></button>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#34d399" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Area type="monotone" dataKey="score" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card>
         <h3 className="font-semibold text-slate-800 mb-6">Activity Heatmap (GitHub Style)</h3>
         <div className="overflow-x-auto pb-4">
           <div className="min-w-[800px] flex flex-col gap-1">
             {[...Array(5)].map((_, r) => (
                <div key={r} className="flex gap-1">
                  {[...Array(50)].map((_, c) => {
                     // For UI visualization purposes right now
                     const intensity = Math.random();
                     let bgClass = 'bg-slate-100';
                     if (intensity > 0.8) bgClass = 'bg-indigo-600';
                     else if (intensity > 0.5) bgClass = 'bg-indigo-400';
                     else if (intensity > 0.2) bgClass = 'bg-indigo-200';
                     
                     return <div key={c} className={`w-3.5 h-3.5 rounded-sm ${bgClass}`} title="Activity block"></div>
                  })}
                </div>
             ))}
           </div>
         </div>
      </Card>
    </div>
  );
}
