import { Card } from './Card';

export function StatsCard({ title, value, icon: Icon, trend, trendUp }) {
  return (
    <Card className="flex flex-col gap-4">
      <div className="flex justify-between items-start">
        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
          <Icon className="text-indigo-600 w-5 h-5" />
        </div>
        {trend && (
          <div className={`px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1 ${trendUp ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
            {trend}
          </div>
        )}
      </div>
      <div>
        <h3 className="text-slate-500 text-sm font-medium">{title}</h3>
        <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
      </div>
    </Card>
  );
}
