import { Card } from './Card';

export function StatsCard({ title, value, icon: Icon, trend, trendUp }) {
  return (
    <Card className="flex flex-col gap-4">
      <div className="flex justify-between items-start">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-50 to-violet-100 dark:bg-zinc-900/90 backdrop-blur-sm dark:to-violet-500/20 border border-indigo-100 dark:border-indigo-500/20 flex items-center justify-center shadow-sm">
          <Icon className="text-indigo-600 dark:text-indigo-400 w-5 h-5" />
        </div>
        {trend && (
          <div className={`px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide flex items-center gap-1 shadow-sm border ${trendUp ? 'bg-emerald-50 border-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400' : 'bg-rose-50 border-rose-100 text-rose-600 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-400'}`}>
            {trend}
          </div>
        )}
      </div>
      <div>
        <h3 className="text-slate-500 dark:text-zinc-400 text-sm font-medium tracking-wide uppercase">{title}</h3>
        <p className="text-3xl font-extrabold text-slate-800 dark:text-zinc-50 mt-1.5 tracking-tight">{value}</p>
      </div>
    </Card>
  );
}
